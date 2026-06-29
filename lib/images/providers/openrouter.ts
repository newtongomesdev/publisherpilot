import type { ImageProvider, GeneratedImageAsset, GenerateImageOptions } from "@/lib/images/image-provider";
import { logApiUsage } from "@/lib/ai/usage-tracker";

export type OpenRouterImageModel = {
  modelId: string;
  name: string;
  costPerImage?: number;
  costPerMegapixel?: number;
  description: string;
  supportsAspectRatio: boolean;
};

export const OPENROUTER_IMAGE_MODELS: OpenRouterImageModel[] = [
  {
    modelId: "google/gemini-2.5-flash-image",
    name: "Nano Banana (Gemini 2.5 Flash)",
    costPerMegapixel: 0.0025,
    description: "Rápido, bom custo-benefício. Suporta aspect ratio customizado via image_config.",
    supportsAspectRatio: true,
  },
  {
    modelId: "google/gemini-3.1-flash-image",
    name: "Nano Banana 2 (Gemini 3.1 Flash)",
    costPerMegapixel: 0.003,
    description: "Mais recente do Google. Qualidade Pro com velocidade Flash. Suporta aspect ratio.",
    supportsAspectRatio: true,
  },
  {
    modelId: "google/gemini-3-pro-image",
    name: "Nano Banana Pro (Gemini 3 Pro)",
    costPerMegapixel: 0.012,
    description: "Máxima qualidade Google. Text rendering, multi-image blending, 2K/4K output.",
    supportsAspectRatio: true,
  },
];

function getAspectRatioMapping(ar: string): string {
  // Map standard ratios to OpenRouter/Gemini format
  const map: Record<string, string> = {
    "16:9": "16:9",
    "9:16": "9:16",
    "1:1": "1:1",
    "4:3": "4:3",
    "3:4": "3:4",
    "3:2": "3:2",
    "2:3": "2:3",
    "4:5": "4:5",
    "5:4": "5:4",
    "21:9": "21:9",
  };
  return map[ar] || "1:1";
}

export const openrouterImageProvider: ImageProvider = {
  name: "openrouter",
  label: "OpenRouter",
  async generateImage(options: GenerateImageOptions): Promise<GeneratedImageAsset> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) {
      throw new Error("Chave do OpenRouter (OPENROUTER_API_KEY) não está configurada no servidor.");
    }

    const model = options.model || "google/gemini-2.5-flash-image-preview";
    const url = "https://openrouter.ai/api/v1/chat/completions";

    console.log(`[openrouter-provider] Generating image using model: ${model}, prompt: "${options.prompt.slice(0, 60)}..."`);

    // Build the request body
    const body: Record<string, any> = {
      model,
      messages: [
        {
          role: "user",
          content: `Generate an image: ${options.prompt}`,
        },
      ],
      modalities: ["image", "text"],
    };

    // Add aspect ratio for models that support it (Gemini models)
    const modelInfo = OPENROUTER_IMAGE_MODELS.find((m) => m.modelId === model);
    if (modelInfo?.supportsAspectRatio && options.aspectRatio) {
      body.image_config = {
        aspect_ratio: getAspectRatioMapping(options.aspectRatio),
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "Atlas Forge AI",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[openrouter-provider] Error from OpenRouter API: ${errText}`);
      throw new Error(`Erro na API do OpenRouter: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message?.images || message.images.length === 0) {
      throw new Error("OpenRouter não retornou nenhuma imagem.");
    }

    const imageData = message.images[0];
    const imageUrl = imageData.image_url?.url || imageData.url;

    if (!imageUrl) {
      throw new Error("OpenRouter retornou imagem sem URL.");
    }

    // Log usage cost
    const costPerMp = modelInfo?.costPerMegapixel ?? 0.003;
    const mpEstimate = options.aspectRatio === "16:9" || options.aspectRatio === "9:16"
      ? 2.07
      : options.aspectRatio === "1:1"
      ? 1.05
      : 1.46;
    const estimatedCost = modelInfo?.costPerImage ?? (costPerMp * mpEstimate);

    logApiUsage({
      provider: "openrouter",
      model,
      operation: "generateImage",
      costUsd: estimatedCost,
    }).catch((err) => console.error("[openrouter-provider] Failed to log usage:", err));

    return {
      url: imageUrl,
      mimeType: "image/png",
      prompt: options.prompt,
      provider: "openrouter",
      model: model,
    };
  },
};
