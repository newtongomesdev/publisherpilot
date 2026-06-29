import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ 
      ok: false, 
      error: "Chave do OpenRouter (OPENROUTER_API_KEY) não configurada no servidor." 
    }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawModel = searchParams.get("model") || "gemini-2.5-flash-image";
    const googleBody = await request.json();

    // Route Fal.ai requests directly
    if (rawModel.startsWith("fal-ai/")) {
      const falKey = process.env.FAL_KEY;
      if (!falKey) {
        return NextResponse.json({ 
          ok: false, 
          error: "Chave do Fal.ai (FAL_KEY) não configurada no servidor." 
        }, { status: 500 });
      }

      // Extract the prompt from googleBody contents
      let promptText = "";
      if (googleBody.contents && Array.isArray(googleBody.contents)) {
        for (const content of googleBody.contents) {
          const parts = content.parts || [];
          for (const part of parts) {
            if (part.text) {
              promptText += (promptText ? "\n" : "") + part.text;
            }
          }
        }
      }

      if (!promptText) {
        return NextResponse.json({ ok: false, error: "Nenhum texto de prompt fornecido para a geração da imagem." }, { status: 400 });
      }

      // Call Fal.ai queue-based API synchronously
      console.log(`[carousel-cover] Generating cover with Fal.ai: ${rawModel}`);
      const falUrl = `https://fal.run/${rawModel}`;
      const falResp = await fetch(falUrl, {
        method: "POST",
        headers: {
          "Authorization": `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptText,
          sync_mode: true,
          image_size: "landscape_16_9",
        }),
      });

      if (!falResp.ok) {
        const errText = await falResp.text();
        console.error("[carousel-cover] Fal.ai API Error:", falResp.status, errText);
        return NextResponse.json({ ok: false, error: `Erro na API do Fal.ai: ${falResp.statusText} - ${errText}` }, { status: 502 });
      }

      const falData = await falResp.json();
      const images = falData.images || [];
      if (images.length === 0 || !images[0].url) {
        return NextResponse.json({ ok: false, error: "Fal.ai não retornou nenhuma imagem." }, { status: 502 });
      }

      const imageUrl = images[0].url;

      // Download the generated image to return as base64 inlineData
      const imgFetch = await fetch(imageUrl);
      if (!imgFetch.ok) {
        return NextResponse.json({ ok: false, error: "Falha ao baixar imagem gerada pelo Fal.ai." }, { status: 502 });
      }

      const buffer = await imgFetch.arrayBuffer();
      const base64Image = Buffer.from(buffer).toString("base64");
      const mimeType = imgFetch.headers.get("content-type") || "image/jpeg";

      const googleResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Image
                  }
                }
              ]
            }
          }
        ]
      };

      return NextResponse.json(googleResponse);
    }

    // Mapeia para o modelo namespaced do OpenRouter
    const model = rawModel.includes("/") ? rawModel : `google/${rawModel}`;

    // 1. Converte o formato do corpo do Google para o formato de mensagens do OpenRouter (OpenAI-compatible)

    const messages: any[] = [];
    if (googleBody.contents && Array.isArray(googleBody.contents)) {
      for (const content of googleBody.contents) {
        const role = content.role === "model" ? "assistant" : "user";
        const parts = content.parts || [];
        
        const openAiContent = parts.map((part: any) => {
          if (part.text) {
            return { type: "text", text: part.text };
          } else if (part.inline_data || part.inlineData) {
            const inline = part.inline_data || part.inlineData;
            return {
              type: "image_url",
              image_url: {
                url: `data:${inline.mime_type || inline.mimeType};base64,${inline.data}`
              }
            };
          }
          return null;
        }).filter(Boolean);

        messages.push({ role, content: openAiContent });
      }
    }

    // 2. Chama a API do OpenRouter
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "PublisherPilot",
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[carousel-generate-cover] OpenRouter Error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `Erro na API do OpenRouter: ${resp.status}` }, { status: 502 });
    }

    const openRouterData = await resp.json();

    // 3. Converte a resposta do OpenRouter contendo imagens de volta para o formato esperado pelo Google/Gemini
    const choice = openRouterData.choices?.[0];
    const assistantMessage = choice?.message;
    
    // Procura imagem em message.images (formato padrão do OpenRouter para multimodal output)
    const imagesList = assistantMessage?.images || [];
    let base64Image = "";
    let mimeType = "image/png";

    if (imagesList.length > 0 && imagesList[0].image_url?.url) {
      const dataUrl = imagesList[0].image_url.url;
      const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      }
    }

    // Fallback caso venha no formato inline ou outro
    if (!base64Image && assistantMessage?.content) {
      // Algumas IAs podem responder com o base64 direto ou formatado em markdown
      const match = /data:image\/[^;]+;base64,([^\s]+)/.exec(assistantMessage.content);
      if (match) {
        base64Image = match[1];
      }
    }

    if (!base64Image) {
      return NextResponse.json({ 
        ok: false, 
        error: "A IA não retornou nenhuma imagem na resposta do OpenRouter. Verifique o modelo ou o prompt." 
      }, { status: 502 });
    }

    // Formata no padrão de resposta do Google Gemini esperado pela frontend
    const googleResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        }
      ]
    };

    // Index generated cover image
    try {
      const { indexImage } = await import("@/lib/ai/chromadb");
      await indexImage({
        id: `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        prompt: "carousel cover",
        metadata: { model: rawModel, sourceType: "carousel-cover", createdAt: new Date().toISOString() },
      });
    } catch {}

    return NextResponse.json(googleResponse);
  } catch (err: any) {
    console.error("[carousel-generate-cover] Error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Erro interno do servidor" }, { status: 500 });
  }
}
