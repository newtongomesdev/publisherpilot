import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { readFile, unlink, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const EDGE_TTS_PATH = process.platform === "win32"
  ? "C:\\Users\\newto\\AppData\\Roaming\\Python\\Python314\\Scripts\\edge-tts.exe"
  : "edge-tts";

// GET: list voices
export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");

  return new Promise<NextResponse>((resolve) => {
    execFile(EDGE_TTS_PATH, ["--list-voices"], { timeout: 15000 }, (err, stdout) => {
      if (err) {
        resolve(NextResponse.json({ ok: false, error: "Failed to list voices" }, { status: 500 }));
        return;
      }

      const lines = stdout.trim().split("\n").slice(1); // skip header
      const voices = lines.map((line) => {
        const parts = line.trim().split(/\s{2,}/);
        return {
          id: parts[0] || "",
          gender: parts[1] || "",
          category: parts[2] || "",
          personality: parts[3] || "",
        };
      }).filter((v) => v.id);

      const filtered = lang
        ? voices.filter((v) => v.id.toLowerCase().startsWith(lang.toLowerCase()))
        : voices;

      resolve(NextResponse.json({ ok: true, voices: filtered }));
    });
  });
}

// POST: generate speech
export async function POST(request: Request) {
  const body = await request.json();
  const { text, voice, rate, volume, pitch } = body as {
    text?: string;
    voice?: string;
    rate?: string;
    volume?: string;
    pitch?: string;
  };

  if (!text) {
    return NextResponse.json({ ok: false, error: "No text provided" }, { status: 400 });
  }

  const tmpDir = join(tmpdir(), "edge-tts");
  await mkdir(tmpDir, { recursive: true });
  const outFile = join(tmpDir, `${randomUUID()}.mp3`);
  const srtFile = outFile.replace(".mp3", ".srt");

  const args = [
    "--text", text.slice(0, 5000),
    "--voice", voice || "pt-BR-FranciscaNeural",
    "--write-media", outFile,
  ];

  if (rate) args.push("--rate", rate);
  if (volume) args.push("--volume", volume);
  if (pitch) args.push("--pitch", pitch);

  // Also generate subtitles
  args.push("--write-subtitles", srtFile);

  return new Promise<NextResponse>((resolve) => {
    execFile(EDGE_TTS_PATH, args, { timeout: 60000 }, async (err) => {
      try {
        if (err) {
          console.error("[edge-tts] Error:", err.message);
          resolve(NextResponse.json({ ok: false, error: "TTS generation failed" }, { status: 500 }));
          return;
        }

        const audioBuffer = await readFile(outFile);
        const base64 = audioBuffer.toString("base64");

        // Cleanup
        await unlink(outFile).catch(() => {});
        await unlink(srtFile).catch(() => {});

        // Index TTS text
        try {
          const { indexTranscription } = await import("@/lib/ai/chromadb");
          await indexTranscription({
            id: `tts_edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            content: text.slice(0, 5000),
            metadata: { sourceType: "tts-edge", voice: voice || "pt-BR-FranciscaNeural", createdAt: new Date().toISOString() },
          });
        } catch {}

        resolve(NextResponse.json({
          ok: true,
          audio: base64,
          mimeType: "audio/mpeg",
          provider: "edge-tts",
          voice: voice || "pt-BR-FranciscaNeural",
        }));
      } catch (readErr) {
        console.error("[edge-tts] Read error:", readErr);
        resolve(NextResponse.json({ ok: false, error: "Failed to read audio" }, { status: 500 }));
      }
    });
  });
}
