import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "DEEPGRAM_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { text, voice } = body as { text?: string; voice?: string };

  if (!text) {
    return NextResponse.json({ ok: false, error: "No text provided" }, { status: 400 });
  }

  // Limit to ~5000 chars for Deepgram TTS
  const truncated = text.slice(0, 5000);

  const model = voice || "aura-2-thalia-en";

  try {
    const resp = await fetch(`https://api.deepgram.com/v1/speak?model=${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: truncated }),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[tts] Deepgram error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `Deepgram returned ${resp.status}` }, { status: 502 });
    }

    const audioBuffer = await resp.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");

    // Index TTS text for voice content search
    try {
      const { indexTranscription } = await import("@/lib/ai/chromadb");
      await indexTranscription({
        id: `tts_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content: truncated,
        metadata: {
          sourceType: "tts",
          model,
          createdAt: new Date().toISOString(),
        },
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      audio: base64,
      mimeType: "audio/mp3",
    });
  } catch (err) {
    console.error("[tts] Error:", err);
    return NextResponse.json({ ok: false, error: "TTS failed" }, { status: 500 });
  }
}
