import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { messages, model = "google/gemini-2.5-flash", temperature = 0.7, max_tokens = 4000 } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ ok: false, error: "Parâmetro 'messages' inválido ou ausente." }, { status: 400 });
    }

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
        response_format: { type: "json_object" },
        messages: messages,
        temperature: temperature,
        max_tokens: max_tokens,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[carousel-generate] OpenRouter Error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `Erro na API do OpenRouter: ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json();

    // Index generated carousel content
    try {
      const content = data.choices?.[0]?.message?.content || "";
      if (content.length > 50) {
        const { indexSlide } = await import("@/lib/ai/chromadb");
        await indexSlide({
          id: `carousel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          content: content.slice(0, 5000),
          metadata: {
            model,
            sourceType: "carousel",
            createdAt: new Date().toISOString(),
          },
        });
      }
    } catch {}

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[carousel-generate] Error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Erro interno do servidor" }, { status: 500 });
  }
}
