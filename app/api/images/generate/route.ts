import { NextResponse } from "next/server";
import { falImageProvider } from "@/lib/images/providers/fal";
import { openrouterImageProvider } from "@/lib/images/providers/openrouter";

function getProvider(model?: string) {
  if (!model) return falImageProvider;
  // OpenRouter models use "/" but not "fal-ai/" prefix
  if (model.includes("/") && !model.startsWith("fal-ai/")) {
    return openrouterImageProvider;
  }
  return falImageProvider;
}

export async function POST(request: Request) {
  try {
    const {
      prompt,
      model,
      aspectRatio,
      imageSize,
      negativePrompt,
      outputFormat,
      enableSafetyChecker,
      numInferenceSteps,
      guidanceScale
    } = await request.json();

    if (!prompt) {
      return NextResponse.json({ ok: false, error: "Prompt é obrigatório" }, { status: 400 });
    }

    const provider = getProvider(model);
    console.log(`[api/images/generate] Provider: ${provider.label}, model: ${model || "default"}, imageSize: ${imageSize ? `${imageSize.width}x${imageSize.height}` : aspectRatio || "default"}`);

    const result = await provider.generateImage({
      prompt,
      model,
      aspectRatio,
      imageSize,
      negativePrompt,
      outputFormat,
      enableSafetyChecker,
      numInferenceSteps,
      guidanceScale,
    });

    // Index image in ChromaDB for semantic reuse
    try {
      const { indexImage } = await import("@/lib/ai/chromadb");
      await indexImage({
        id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        prompt,
        metadata: {
          model: model || "default",
          provider: provider.name,
          aspectRatio: aspectRatio || "1:1",
          url: result.url || "",
          createdAt: new Date().toISOString(),
        },
      });
    } catch {}

    return NextResponse.json({ ok: true, image: result });
  } catch (error: any) {
    console.error("[api/images/generate] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Falha ao gerar imagem" },
      { status: 500 }
    );
  }
}
