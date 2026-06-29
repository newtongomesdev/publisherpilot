import type { ImageProvider, GeneratedImageAsset, GenerateImageOptions } from "@/lib/images/image-provider";
import { logApiUsage } from "@/lib/ai/usage-tracker";

export type FalModel = {
  modelId: string;
  name: string;
  cost: string;
  costPerMegapixel: number;
  description: string;
};

export const FAL_MODELS: FalModel[] = [
  {
    modelId: "fal-ai/flux/schnell",
    name: "Flux Schnell",
    cost: "$0.003 / megapixel",
    costPerMegapixel: 0.003,
    description: "Extremamente rápido (~1s). Suporta image_size customizado. Ideal para prototipagem.",
  },
  {
    modelId: "fal-ai/flux/dev",
    name: "Flux Dev",
    cost: "$0.025 / megapixel",
    costPerMegapixel: 0.025,
    description: "12B parâmetros. Excelente qualidade, suporta image_size customizado. Uso pessoal e comercial.",
  },
  {
    modelId: "fal-ai/flux-pro",
    name: "Flux Pro",
    cost: "$0.05 / megapixel",
    costPerMegapixel: 0.05,
    description: "Qualidade profissional topo de linha. Suporta image_size customizado.",
  },
  {
    modelId: "fal-ai/flux-pro/v1.1",
    name: "Flux Pro v1.1",
    cost: "$0.05 / megapixel",
    costPerMegapixel: 0.05,
    description: "Versão aprimorada do Flux Pro com melhor aderência ao prompt.",
  },
  {
    modelId: "fal-ai/flux-2-pro",
    name: "Flux 2 Pro",
    cost: "$0.03 / megapixel",
    costPerMegapixel: 0.03,
    description: "Geração + edição de imagens. Suporta image_size customizado. Mais recente do Black Forest Labs.",
  },
  {
    modelId: "fal-ai/stable-diffusion-v35-large",
    name: "Stable Diffusion 3.5 Large",
    cost: "$0.065 / megapixel",
    costPerMegapixel: 0.065,
    description: "Excelente composição fotográfica. Suporta image_size customizado.",
  },
  {
    modelId: "fal-ai/recraft-v3",
    name: "Recraft v3",
    cost: "$0.04 / megapixel",
    costPerMegapixel: 0.04,
    description: "Especialista em textos legíveis e designs gráficos vetoriais.",
  },
];

export const falImageProvider: ImageProvider = {
  name: "fal",
  label: "Fal.ai",
  async generateImage(options: GenerateImageOptions): Promise<GeneratedImageAsset> {
    const key = process.env.FAL_KEY;
    if (!key) {
      throw new Error("Chave do Fal.ai (FAL_KEY) não está configurada no servidor.");
    }

    const model = options.model || "fal-ai/flux/schnell";
    const url = `https://fal.run/${model}`;

    console.log(`[fal-provider] Generating image using model: ${model}, prompt: "${options.prompt.slice(0, 60)}..."`);

    // Prepare body
    const body: Record<string, any> = {
      prompt: options.prompt,
      sync_mode: true,
    };

    // Add image size - supports both presets and custom {width, height}
    if (options.imageSize) {
      // Custom dimensions (e.g. {width: 1080, height: 1350})
      body.image_size = options.imageSize;
    } else if (options.aspectRatio) {
      // Map aspect ratio string to Fal preset
      if (model.includes("flux")) {
        const ar = options.aspectRatio;
        if (ar === "16:9") body.image_size = "landscape_16_9";
        else if (ar === "9:16") body.image_size = "portrait_16_9";
        else if (ar === "4:3") body.image_size = "landscape_4_3";
        else if (ar === "3:4") body.image_size = "portrait_4_3";
        else if (ar === "1:1") body.image_size = "square_hd";
        else body.image_size = ar;
      } else {
        body.aspect_ratio = options.aspectRatio;
      }
    }

    // Advanced settings mapping
    if (options.negativePrompt) {
      body.negative_prompt = options.negativePrompt;
    }
    if (options.outputFormat) {
      body.output_format = options.outputFormat;
    }
    if (options.enableSafetyChecker !== undefined) {
      body.enable_safety_checker = options.enableSafetyChecker;
    }
    if (options.numInferenceSteps !== undefined) {
      body.num_inference_steps = options.numInferenceSteps;
    }
    if (options.guidanceScale !== undefined) {
      body.guidance_scale = options.guidanceScale;
    }


    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[fal-provider] Error from Fal.ai API: ${errText}`);
      throw new Error(`Erro na API do Fal.ai: ${response.statusText} - ${errText}`);
    }

    const data = await response.json();
    const images = data.images || [];
    if (images.length === 0 || !images[0].url) {
      throw new Error("Fal.ai não retornou nenhuma imagem.");
    }

    const imageUrl = images[0].url;

    // Log usage cost
    const falModel = FAL_MODELS.find((m) => m.modelId === model);
    const costPerMp = falModel?.costPerMegapixel ?? 0.003;
    // Estimate megapixels from aspect ratio (default ~1.46MP for 1080x1350)
    const mpEstimate = options.aspectRatio === "16:9" || options.aspectRatio === "9:16"
      ? 2.07 // 1080x1920
      : options.aspectRatio === "1:1"
      ? 1.17 // 1080x1080
      : 1.46; // 1080x1350 default
    const estimatedCost = costPerMp * mpEstimate;

    logApiUsage({
      provider: "fal",
      model,
      operation: "generateImage",
      costUsd: estimatedCost,
    }).catch((err) => console.error("[fal-provider] Failed to log usage:", err));

    return {
      url: imageUrl,
      mimeType: images[0].content_type || "image/jpeg",
      prompt: options.prompt,
      provider: "fal",
      model: model,
    };
  },
};
