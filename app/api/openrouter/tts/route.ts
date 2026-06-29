import { NextResponse } from "next/server";

const TTS_MODELS = {
  "kokoro-82m": {
    id: "hexgrad/kokoro-82m",
    label: "Kokoro 82M",
    price: "$0.62/M in · grátis",
    voices: [
      // American English — Feminine (11)
      { id: "af_alloy", label: "Alloy (Feminina)", lang: "English (US)" },
      { id: "af_aoede", label: "Aoede (Feminina)", lang: "English (US)" },
      { id: "af_bella", label: "Bella (Feminina)", lang: "English (US)" },
      { id: "af_heart", label: "Heart (Feminina)", lang: "English (US)" },
      { id: "af_jessica", label: "Jessica (Feminina)", lang: "English (US)" },
      { id: "af_kore", label: "Kore (Feminina)", lang: "English (US)" },
      { id: "af_nicole", label: "Nicole (Feminina)", lang: "English (US)" },
      { id: "af_nova", label: "Nova (Feminina)", lang: "English (US)" },
      { id: "af_river", label: "River (Feminina)", lang: "English (US)" },
      { id: "af_sarah", label: "Sarah (Feminina)", lang: "English (US)" },
      { id: "af_sky", label: "Sky (Feminina)", lang: "English (US)" },
      // American English — Masculine (9)
      { id: "am_adam", label: "Adam (Masculino)", lang: "English (US)" },
      { id: "am_echo", label: "Echo (Masculino)", lang: "English (US)" },
      { id: "am_eric", label: "Eric (Masculino)", lang: "English (US)" },
      { id: "am_fenrir", label: "Fenrir (Masculino)", lang: "English (US)" },
      { id: "am_liam", label: "Liam (Masculino)", lang: "English (US)" },
      { id: "am_michael", label: "Michael (Masculino)", lang: "English (US)" },
      { id: "am_onyx", label: "Onyx (Masculino)", lang: "English (US)" },
      { id: "am_puck", label: "Puck (Masculino)", lang: "English (US)" },
      { id: "am_santa", label: "Santa (Masculino)", lang: "English (US)" },
      // British English — Feminine (4)
      { id: "bf_alice", label: "Alice (Feminina)", lang: "English (UK)" },
      { id: "bf_emma", label: "Emma (Feminina)", lang: "English (UK)" },
      { id: "bf_isabella", label: "Isabella (Feminina)", lang: "English (UK)" },
      { id: "bf_lily", label: "Lily (Feminina)", lang: "English (UK)" },
      // British English — Masculine (4)
      { id: "bm_daniel", label: "Daniel (Masculino)", lang: "English (UK)" },
      { id: "bm_fable", label: "Fable (Masculino)", lang: "English (UK)" },
      { id: "bm_george", label: "George (Masculino)", lang: "English (UK)" },
      { id: "bm_lewis", label: "Lewis (Masculino)", lang: "English (UK)" },
      // Spanish (3)
      { id: "ef_dora", label: "Dora (Feminina)", lang: "Español" },
      { id: "em_alex", label: "Alex (Masculino)", lang: "Español" },
      { id: "em_santa", label: "Santa (Masculino)", lang: "Español" },
      // French (1)
      { id: "ff_siwis", label: "Siwis (Feminina)", lang: "Français" },
      // Hindi (4)
      { id: "hf_alpha", label: "Alpha (Feminina)", lang: "हिन्दी" },
      { id: "hf_beta", label: "Beta (Feminina)", lang: "हिन्दी" },
      { id: "hm_omega", label: "Omega (Masculino)", lang: "हिन्दी" },
      { id: "hm_psi", label: "Psi (Masculino)", lang: "हिन्दी" },
      // Italian (2)
      { id: "if_sara", label: "Sara (Feminina)", lang: "Italiano" },
      { id: "im_nicola", label: "Nicola (Masculino)", lang: "Italiano" },
      // Japanese (5)
      { id: "jf_alpha", label: "Alpha (Feminina)", lang: "日本語" },
      { id: "jf_gongitsune", label: "Gongitsune (Feminina)", lang: "日本語" },
      { id: "jf_nezumi", label: "Nezumi (Feminina)", lang: "日本語" },
      { id: "jf_tebukuro", label: "Tebukuro (Feminina)", lang: "日本語" },
      { id: "jm_kumo", label: "Kumo (Masculino)", lang: "日本語" },
      // Portuguese (3)
      { id: "pf_dora", label: "Dora (Feminina)", lang: "Português" },
      { id: "pm_alex", label: "Alex (Masculino)", lang: "Português" },
      { id: "pm_santa", label: "Santa (Masculino)", lang: "Português" },
      // Mandarin Chinese (7)
      { id: "zf_xiaobei", label: "Xiaobei (Feminina)", lang: "中文" },
      { id: "zf_xiaoni", label: "Xiaoni (Feminina)", lang: "中文" },
      { id: "zf_xiaoxiao", label: "Xiaoxiao (Feminina)", lang: "中文" },
      { id: "zf_xiaoyi", label: "Xiaoyi (Feminina)", lang: "中文" },
      { id: "zm_yunjian", label: "Yunjian (Masculino)", lang: "中文" },
      { id: "zm_yunxi", label: "Yunxi (Masculino)", lang: "中文" },
      { id: "zm_yunxia", label: "Yunxia (Masculino)", lang: "中文" },
      { id: "zm_yunyang", label: "Yunyang (Masculino)", lang: "中文" },
    ],
    formats: ["mp3"],
  },
  "voxtral-mini-tts": {
    id: "mistralai/voxtral-mini-tts-2603",
    label: "Voxtral Mini TTS",
    price: "$16/M characters",
    voices: [
      // Paul — EN
      { id: "en_paul_happy", label: "Paul — Feliz", lang: "English" },
      { id: "en_paul_sad", label: "Paul — Triste", lang: "English" },
      { id: "en_paul_neutral", label: "Paul — Neutro", lang: "English" },
      { id: "en_paul_frustrated", label: "Paul — Frustrado", lang: "English" },
      { id: "en_paul_excited", label: "Paul — Animado", lang: "English" },
      { id: "en_paul_confident", label: "Paul — Confiante", lang: "English" },
      { id: "en_paul_cheerful", label: "Paul — Alegre", lang: "English" },
      { id: "en_paul_angry", label: "Paul — Bravo", lang: "English" },
      // Oliver — EN-GB
      { id: "gb_oliver_neutral", label: "Oliver — Neutro", lang: "English (UK)" },
      { id: "gb_oliver_sad", label: "Oliver — Triste", lang: "English (UK)" },
      { id: "gb_oliver_excited", label: "Oliver — Animado", lang: "English (UK)" },
      { id: "gb_oliver_curious", label: "Oliver — Curioso", lang: "English (UK)" },
      { id: "gb_oliver_confident", label: "Oliver — Confiante", lang: "English (UK)" },
      { id: "gb_oliver_cheerful", label: "Oliver — Alegre", lang: "English (UK)" },
      { id: "gb_oliver_angry", label: "Oliver — Bravo", lang: "English (UK)" },
      // Jane — EN-GB
      { id: "gb_jane_sarcasm", label: "Jane — Sarcástica", lang: "English (UK)" },
      { id: "gb_jane_confused", label: "Jane — Confusa", lang: "English (UK)" },
      { id: "gb_jane_shameful", label: "Jane — Envergonhada", lang: "English (UK)" },
      { id: "gb_jane_sad", label: "Jane — Triste", lang: "English (UK)" },
      { id: "gb_jane_neutral", label: "Jane — Neutra", lang: "English (UK)" },
      { id: "gb_jane_jealousy", label: "Jane — Ciúme", lang: "English (UK)" },
      { id: "gb_jane_frustrated", label: "Jane — Frustrada", lang: "English (UK)" },
      { id: "gb_jane_curious", label: "Jane — Curiosa", lang: "English (UK)" },
      { id: "gb_jane_confident", label: "Jane — Confiante", lang: "English (UK)" },
      // Marie — FR
      { id: "fr_marie_sad", label: "Marie — Triste", lang: "Français" },
      { id: "fr_marie_neutral", label: "Marie — Neutre", lang: "Français" },
      { id: "fr_marie_happy", label: "Marie — Joyeuse", lang: "Français" },
      { id: "fr_marie_excited", label: "Marie — Excitée", lang: "Français" },
      { id: "fr_marie_curious", label: "Marie — Curieuse", lang: "Français" },
      { id: "fr_marie_angry", label: "Marie — En colère", lang: "Français" },
    ],
    formats: ["mp3"],
    supportsVoiceClone: true,
  },
} as const;

type ModelKey = keyof typeof TTS_MODELS;

// GET: list models and voices
export async function GET() {
  return NextResponse.json({
    ok: true,
    models: Object.entries(TTS_MODELS).map(([key, m]) => ({
      key,
      label: m.label,
      price: m.price,
      voices: m.voices,
      formats: m.formats,
      supportsInstructions: "supportsInstructions" in m ? m.supportsInstructions : false,
      supportsVoiceClone: "supportsVoiceClone" in m ? m.supportsVoiceClone : false,
    })),
  });
}

// POST: generate speech or preview a voice
export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { text, model: modelKey, voice, instructions, voiceCloneUrl, preview } = body as {
    text?: string;
    model?: string;
    voice?: string;
    instructions?: string;
    voiceCloneUrl?: string;
    preview?: boolean;
  };

  if (!modelKey || !(modelKey in TTS_MODELS)) {
    return NextResponse.json({ ok: false, error: `Invalid model. Options: ${Object.keys(TTS_MODELS).join(", ")}` }, { status: 400 });
  }

  const model = TTS_MODELS[modelKey as ModelKey];

  // Preview mode: generate a short sample sentence
  const inputText = preview
    ? "This is a preview of this voice. Hello, how are you today?"
    : (text || "").slice(0, 5000);

  if (!preview && !text) {
    return NextResponse.json({ ok: false, error: "No text provided" }, { status: 400 });
  }

  try {
    const payload: Record<string, unknown> = {
      model: model.id,
      input: inputText,
      voice: voice || model.voices[0]?.id || "alloy",
      response_format: "mp3",
    };

    // Voice cloning for Voxtral
    if (voiceCloneUrl && "supportsVoiceClone" in model && model.supportsVoiceClone) {
      payload.voice = "custom";
      payload.voice_audio = voiceCloneUrl;
    }

    if (instructions && "supportsInstructions" in model && model.supportsInstructions) {
      payload.instructions = instructions;
    }

    const resp = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60000),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[openrouter/tts] Error:", resp.status, errText);
      return NextResponse.json({ ok: false, error: `OpenRouter returned ${resp.status}: ${errText.slice(0, 300)}` }, { status: 502 });
    }

    const contentType = resp.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errData = await resp.json();
      return NextResponse.json({ ok: false, error: errData.error?.message ?? "TTS failed" }, { status: 502 });
    }

    const audioBuffer = Buffer.from(await resp.arrayBuffer());

    return NextResponse.json({
      ok: true,
      audio: audioBuffer.toString("base64"),
      mimeType: "audio/mpeg",
      model: modelKey,
      voice: voice || model.voices[0]?.id || "alloy",
      isPreview: !!preview,
    });
  } catch (err) {
    console.error("[openrouter/tts] Error:", err);
    return NextResponse.json({ ok: false, error: "TTS generation failed" }, { status: 500 });
  }
}
