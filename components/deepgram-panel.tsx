"use client";

import { useState } from "react";

type Tab = "tts" | "stt";

export function DeepgramPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("tts");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");

  // TTS state
  const [ttsText, setTtsText] = useState("");
  const [ttsVoice, setTtsVoice] = useState("aura-2-thalia-en");
  const [ttsLoading, setTtsLoading] = useState(false);

  // STT state
  const [sttUrl, setSttUrl] = useState("");
  const [sttLoading, setSttLoading] = useState(false);
  const [sttResult, setSttResult] = useState("");

  function showFeedback(msg: string, type: "success" | "error" | "info" = "info") {
    setFeedback(msg);
    setFeedbackType(type);
  }

  async function handleTts() {
    if (!ttsText.trim()) {
      showFeedback("Digite o texto para converter em áudio.", "error");
      return;
    }
    setTtsLoading(true);
    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ttsText, voice: ttsVoice }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        showFeedback(payload.error ?? "Falha ao gerar áudio.", "error");
        return;
      }
      // Download
      const binary = atob(payload.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "audio/mp3" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "deepgram-tts.mp3";
      link.click();
      URL.revokeObjectURL(url);
      showFeedback("Áudio gerado e baixado!", "success");
    } catch {
      showFeedback("Erro ao gerar áudio.", "error");
    } finally {
      setTtsLoading(false);
    }
  }

  async function handleStt() {
    if (!sttUrl.trim()) {
      showFeedback("Cole a URL de um arquivo de áudio.", "error");
      return;
    }
    setSttLoading(true);
    setSttResult("");
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sttUrl }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        showFeedback(payload.error ?? "Falha ao transcrever.", "error");
        return;
      }
      setSttResult(payload.transcript);
      showFeedback(`Transcrição concluída! (${payload.transcript.length} caracteres)`, "success");
    } catch {
      showFeedback("Erro ao transcrever áudio.", "error");
    } finally {
      setSttLoading(false);
    }
  }

  const voices = [
    { value: "aura-2-thalia-en", label: "Thalia (Inglês)" },
    { value: "aura-asteria-en", label: "Asteria (Inglês)" },
    { value: "aura-luna-en", label: "Luna (Inglês)" },
    { value: "aura-stella-en", label: "Stella (Inglês)" },
    { value: "aura-athena-en", label: "Athena (Inglês)" },
    { value: "aura-hera-en", label: "Hera (Inglês)" },
  ];

  const feedbackColors = {
    success: "text-emerald-400",
    error: "text-rose-400",
    info: "text-zinc-400",
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-800 pb-4">
        <button
          onClick={() => setActiveTab("tts")}
          className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
            activeTab === "tts"
              ? "bg-purple-500/20 text-purple-400 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          Text to Speech (TTS)
        </button>
        <button
          onClick={() => setActiveTab("stt")}
          className={`rounded-xl px-6 py-3 text-sm font-medium transition-all ${
            activeTab === "stt"
              ? "bg-purple-500/20 text-purple-400 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
          }`}
        >
          Speech to Text (STT)
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`text-sm ${feedbackColors[feedbackType]}`}>{feedback}</p>
      )}

      {/* TTS Tab */}
      {activeTab === "tts" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Texto para converter em áudio</label>
            <textarea
              value={ttsText}
              onChange={(e) => setTtsText(e.target.value)}
              placeholder="Cole ou digite o texto que deseja converter em áudio..."
              className="min-h-[200px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 outline-none focus:border-purple-500 resize-y"
            />
            <p className="text-xs text-zinc-600 mt-1">{ttsText.length}/5000 caracteres</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Voz</label>
            <select
              value={ttsVoice}
              onChange={(e) => setTtsVoice(e.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-purple-500"
            >
              {voices.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTts}
            disabled={ttsLoading || !ttsText.trim()}
            className="rounded-full bg-purple-500 px-8 py-3 font-medium text-white hover:bg-purple-400 disabled:opacity-50 transition-colors"
          >
            {ttsLoading ? "Gerando áudio..." : "Gerar áudio"}
          </button>
        </div>
      )}

      {/* STT Tab */}
      {activeTab === "stt" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">URL do arquivo de áudio</label>
            <input
              type="url"
              value={sttUrl}
              onChange={(e) => setSttUrl(e.target.value)}
              placeholder="https://exemplo.com/podcast-episodio.mp3"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-purple-500"
            />
            <p className="text-xs text-zinc-600 mt-1">Formatos aceitos: MP3, WAV, M4A, FLAC, OGG, WebM</p>
          </div>

          <button
            onClick={handleStt}
            disabled={sttLoading || !sttUrl.trim()}
            className="rounded-full bg-purple-500 px-8 py-3 font-medium text-white hover:bg-purple-400 disabled:opacity-50 transition-colors"
          >
            {sttLoading ? "Transcrevendo..." : "Transcrever áudio"}
          </button>

          {sttResult && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Transcrição</label>
              <div className="min-h-[200px] w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-100 whitespace-pre-wrap overflow-y-auto max-h-[400px]">
                {sttResult}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(sttResult);
                  showFeedback("Transcrição copiada!", "success");
                }}
                className="mt-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Copiar transcrição
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
