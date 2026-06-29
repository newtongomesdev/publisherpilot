import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { url, text } = body as { url?: string; text?: string };

  if (!url && !text) {
    return NextResponse.json({ ok: false, error: "Provide a URL or audio data" }, { status: 400 });
  }

  try {
    let audioPayload: { url?: string; buffer?: ArrayBuffer; contentType?: string };

    if (url) {
      audioPayload = { url };
    } else {
      // text mode not supported for STT
      return NextResponse.json({ ok: false, error: "Only URL transcription is supported" }, { status: 400 });
    }

    const dgUrl = new URL("https://api.deepgram.com/v1/listen");
    dgUrl.searchParams.set("model", "nova-3");
    dgUrl.searchParams.set("language", "pt");
    dgUrl.searchParams.set("smart_format", "true");
    dgUrl.searchParams.set("paragraphs", "true");
    dgUrl.searchParams.set("punctuate", "true");

    const resp = await fetch(dgUrl.toString(), {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: audioPayload.url }),
      signal: AbortSignal.timeout(120000), // 2 min for long audio
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[transcribe] Deepgram error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `Deepgram returned ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json() as {
      results?: {
        channels?: Array<{
          alternatives?: Array<{
            transcript?: string;
            paragraphs?: {
              paragraphs?: Array<{
                text?: string;
                sentences?: Array<{ text?: string; start?: number; end?: number }>;
              }>;
            };
          }>;
        }>;
      };
    };

    const channel = data.results?.channels?.[0];
    const alt = channel?.alternatives?.[0];
    const transcript = alt?.transcript ?? "";
    const paragraphs = alt?.paragraphs?.paragraphs ?? [];

    // Index transcription in ChromaDB
    if (transcript) {
      try {
        const { indexTranscription } = await import("@/lib/ai/chromadb");
        await indexTranscription({
          id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          content: transcript,
          metadata: {
            sourceUrl: audioPayload.url || "",
            createdAt: new Date().toISOString(),
          },
        });
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      transcript,
      paragraphs: paragraphs.map((p) => ({
        text: p.text ?? "",
        sentences: (p.sentences ?? []).map((s) => ({
          text: s.text ?? "",
          start: s.start ?? 0,
          end: s.end ?? 0,
        })),
      })),
    });
  } catch (err) {
    console.error("[transcribe] Error:", err);
    return NextResponse.json({ ok: false, error: "Transcription failed" }, { status: 500 });
  }
}
