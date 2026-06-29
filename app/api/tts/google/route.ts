import { NextResponse } from "next/server";

const GOOGLE_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

// GET: list voices
export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "GOOGLE_TTS_API_KEY not configured" }, { status: 500 });
  }

  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");

  try {
    const params = new URLSearchParams({ key: apiKey });
    if (lang) params.append("languageCode", lang);

    const resp = await fetch(`https://texttospeech.googleapis.com/v1/voices?${params.toString()}`);
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: data.error?.message ?? "Failed to list voices" }, { status: 502 });
    }

    const voices = (data.voices || []).map((v: Record<string, unknown>) => ({
      id: v.name as string,
      languageCodes: v.languageCodes as string[],
      gender: v.ssmlGender as string,
      type: (v as Record<string, unknown>).naturalSampleRateHertz ? "Neural" : "Standard",
    }));

    return NextResponse.json({ ok: true, voices });
  } catch (err) {
    console.error("[google-tts] Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to list voices" }, { status: 500 });
  }
}

// POST: generate speech
export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "GOOGLE_TTS_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { text, voice, languageCode, speakingRate, pitch } = body as {
    text?: string;
    voice?: string;
    languageCode?: string;
    speakingRate?: number;
    pitch?: number;
  };

  if (!text) {
    return NextResponse.json({ ok: false, error: "No text provided" }, { status: 400 });
  }

  try {
    const payload = {
      input: { text: text.slice(0, 5000) },
      voice: {
        languageCode: languageCode || "pt-BR",
        name: voice || "pt-BR-Neural2-A",
        ssmlGender: "FEMALE",
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: speakingRate || 1.0,
        pitch: pitch || 0,
      },
    };

    const resp = await fetch(`${GOOGLE_TTS_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("[google-tts] Error:", resp.status, data);
      return NextResponse.json({ ok: false, error: data.error?.message ?? "TTS failed" }, { status: 502 });
    }

    // Index TTS text
    try {
      const { indexTranscription } = await import("@/lib/ai/chromadb");
      await indexTranscription({
        id: `tts_google_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content: text.slice(0, 5000),
        metadata: { sourceType: "tts-google", voice: voice || "pt-BR-Neural2-A", createdAt: new Date().toISOString() },
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      audio: data.audioContent,
      mimeType: "audio/mpeg",
      provider: "google-tts",
      voice: voice || "pt-BR-Neural2-A",
    });
  } catch (err) {
    console.error("[google-tts] Error:", err);
    return NextResponse.json({ ok: false, error: "TTS generation failed" }, { status: 500 });
  }
}
