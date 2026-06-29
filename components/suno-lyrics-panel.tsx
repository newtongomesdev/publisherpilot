"use client";

import { useState } from "react";
import { 
  Music, Sparkles, Copy, RefreshCw, Layers,
  Check, ArrowRight, Mic, Info
} from "lucide-react";

type StructureBlock = "Intro" | "Verse" | "Chorus" | "Guitar Solo" | "Bridge" | "Outro";

const PRESET_GENRES = [
  "Synthwave", "Heavy Metal", "Gospel (Worship)", "Sertanejo", 
  "Lo-Fi Hip Hop", "Pop Dançante", "Bossa Nova", "Trap/Rap", 
  "Rock Alternativo", "Reggae", "Jazz", "MPB", "R&B / Soul"
];

const PRESET_VOCALS = [
  { value: "male", label: "Masculino", desc: "Voz firme" },
  { value: "female", label: "Feminino", desc: "Voz melódica" },
  { value: "duet", label: "Dueto", desc: "Masculino & Feminino" },
  { value: "whispering", label: "Sussurrado", desc: "Intimista/Suave" },
  { value: "aggressive", label: "Agressivo/Grito", desc: "Metal/Punk" },
];

const PRESET_MOODS = [
  "Melancólico", "Super Energético", "Sombrio/Ciberpunk", 
  "Feliz/Espançado", "Nostálgico", "Épico/Cinematográfico"
];

export function SunoLyricsPanel() {
  // Config states
  const [genre, setGenre] = useState("Synthwave");
  const [vocal, setVocal] = useState("male");
  const [mood, setMood] = useState("Melancólico");
  const [language, setLanguage] = useState("Portuguese");
  const [rimas, setRimas] = useState("rhyming");
  const [temperature, setTemperature] = useState(0.7);
  const [customInstructions, setCustomInstructions] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [mode, setMode] = useState<"custom" | "inspiration">("custom");
  const [inspiration, setInspiration] = useState("");
  
  // Selected Structure Blocks
  const [structure, setStructure] = useState<StructureBlock[]>([
    "Intro", "Verse", "Chorus", "Verse", "Chorus", "Bridge", "Chorus", "Outro"
  ]);

  // Input theme state
  const [theme, setTheme] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  // Output states
  const [title, setTitle] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");
  const [lyrics, setLyrics] = useState("");

  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedStyle, setCopiedStyle] = useState(false);

  // Structure toggle handler
  function toggleBlock(block: StructureBlock) {
    setStructure(prev => {
      // Limit size to avoid too long outputs
      if (prev.length >= 12) return prev;
      return [...prev, block];
    });
  }

  function clearStructure() {
    setStructure([]);
  }

  function removeStructureIndex(index: number) {
    setStructure(prev => prev.filter((_, i) => i !== index));
  }

  async function handleGenerate() {
    const isThemeEmpty = !theme.trim();
    const isInspirationEmpty = !inspiration.trim();
    if (mode === "custom" && isThemeEmpty) return;
    if (mode === "inspiration" && isInspirationEmpty) return;

    setLoading(true);
    setFeedback("");
    setCopiedLyrics(false);
    setCopiedStyle(false);
    
    try {
      const payload: Record<string, any> = {
        theme,
        structure,
        rimas,
        language,
        model,
        temperature,
        customInstructions,
      };

      if (mode === "inspiration") {
        payload.inspiration = inspiration;
      } else {
        payload.genre = genre;
        payload.vocal = vocal;
        payload.mood = mood;
      }

      const response = await fetch("/api/suno-lyrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!data.ok) {
        setFeedback(data.error ?? "Erro ao gerar letra");
        setFeedbackType("error");
        return;
      }

      setTitle(data.title);
      setStylePrompt(data.stylePrompt);
      setLyrics(data.lyrics);
      setFeedback("Letra gerada com sucesso!");
      setFeedbackType("success");
    } catch {
      setFeedback("Falha na comunicação com o servidor de IA.");
      setFeedbackType("error");
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLyrics() {
    if (!lyrics) return;
    navigator.clipboard.writeText(lyrics);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  }

  function handleCopyStyle() {
    if (!stylePrompt) return;
    navigator.clipboard.writeText(stylePrompt);
    setCopiedStyle(true);
    setTimeout(() => setCopiedStyle(false), 2000);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* ==================== LEFT COLUMN: CONFIGURATION ==================== */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Mode Selector Tab */}
        <div className="bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/80 flex gap-1">
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
              mode === "custom"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Modo Personalizado
          </button>
          <button
            type="button"
            onClick={() => setMode("inspiration")}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${
              mode === "inspiration"
                ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/10"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Modo Inspiração
          </button>
        </div>

        {mode === "custom" ? (
          <>
            {/* Genre section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-200 font-medium text-sm">
                <Music className="h-4 w-4 text-emerald-500" />
                <span>Estilo Musical</span>
              </div>
              
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="Ex: Synthwave, Hard Rock, Bossa Nova..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50"
              />

              {/* Quick preset tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PRESET_GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenre(g)}
                    className={`rounded-lg px-2 py-1 text-[10px] transition-all duration-150 ${
                      genre === g
                        ? "bg-emerald-500/20 text-emerald-450 ring-1 ring-emerald-500/30"
                        : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Vocal style */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                <Mic className="h-3.5 w-3.5 text-zinc-400" />
                <span>Estilo de Vocal</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_VOCALS.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVocal(v.value)}
                    className={`rounded-xl border p-2.5 text-left transition-all duration-150 ${
                      vocal === v.value
                        ? "border-emerald-600 bg-emerald-950/10 text-emerald-400 shadow-sm"
                        : "border-zinc-800 bg-zinc-900/30 text-zinc-450 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-semibold text-[11px] tracking-wide">{v.label}</div>
                    <div className="text-[9px] opacity-60 mt-0.5 line-clamp-1">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mood atmosphere */}
            <div className="space-y-2.5">
              <div className="text-zinc-300 text-xs font-medium">Atmosfera & Humor</div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESET_MOODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`rounded-xl py-2 text-xs transition-all ${
                      mood === m
                        ? "bg-emerald-500/10 text-emerald-450 ring-1 ring-emerald-500/20 font-medium"
                        : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-850"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Inspiration reference */
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 text-zinc-200 font-medium text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Música de Inspiração</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Escreva o nome do artista/banda e o nome de uma música de referência. A IA irá inferir os instrumentos, o estilo do vocal e a atmosfera para criar a composição ideal.
            </p>
            <input
              type="text"
              value={inspiration}
              onChange={(e) => setInspiration(e.target.value)}
              placeholder="Ex: Coldplay - Yellow"
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        )}

        {/* Structure blocks builder */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-zinc-300 text-xs font-medium">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-zinc-400" />
              <span>Estrutura da Música (Suno Tags)</span>
            </div>
            <button 
              type="button" 
              onClick={clearStructure}
              className="text-[10px] text-zinc-500 hover:text-rose-400 transition-colors"
            >
              Limpar Tudo
            </button>
          </div>

          {/* Active queue display */}
          <div className="flex flex-wrap gap-1 border border-zinc-850 bg-zinc-950/20 rounded-xl p-2 min-h-[50px]">
            {structure.length === 0 ? (
              <span className="text-[10px] text-zinc-600 italic self-center pl-1">Estrutura livre...</span>
            ) : (
              structure.map((block, idx) => (
                <span
                  key={idx}
                  onClick={() => removeStructureIndex(idx)}
                  className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 px-2 py-0.5 rounded-lg cursor-pointer hover:bg-rose-950/30 hover:border-rose-900/40 hover:text-rose-400 transition-all"
                  title="Clique para remover"
                >
                  {block}
                  <span className="text-[8px] opacity-40">×</span>
                </span>
              ))
            )}
          </div>

          {/* Add block buttons */}
          <div className="grid grid-cols-3 gap-1">
            {(["Intro", "Verse", "Chorus", "Guitar Solo", "Bridge", "Outro"] as StructureBlock[]).map((block) => (
              <button
                key={block}
                type="button"
                onClick={() => toggleBlock(block)}
                className="rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[10px] py-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                + {block}
              </button>
            ))}
          </div>
        </div>

        {/* Basic adjustments */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-zinc-400 text-[11px] font-medium block">Idioma</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500/50"
            >
              <option value="Portuguese">Português (BR)</option>
              <option value="English">Inglês (US)</option>
              <option value="Spanish">Espanhol (ES)</option>
              <option value="French">Francês (FR)</option>
              <option value="Italian">Italiano (IT)</option>
              <option value="German">Alemão (DE)</option>
              <option value="Japanese">Japonês (JP)</option>
              <option value="Korean">Coreano (KR)</option>
              <option value="Russian">Russo (RU)</option>
              <option value="Latin">Latim (LA)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 text-[11px] font-medium block">Estilo de Rimas</label>
            <select
              value={rimas}
              onChange={(e) => setRimas(e.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300 outline-none focus:border-emerald-500/50"
            >
              <option value="rhyming">Rimada Tradicional</option>
              <option value="free">Versos Livres / Poético</option>
            </select>
          </div>
        </div>

        {/* Model selection */}
        <div className="space-y-1.5">
          <label className="text-zinc-400 text-[11px] font-medium block">Modelo de IA</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5 text-xs text-zinc-300 outline-none focus:border-emerald-500/50"
          >
            <option value="google/gemini-2.5-flash">Gemini 2.5 Flash (Rápido e Inteligente)</option>
            <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B (Excelente p/ Criatividade)</option>
            <option value="openai/gpt-4o-mini">GPT-4o Mini (Balanceado)</option>
            <option value="deepseek/deepseek-chat">DeepSeek Chat (Preciso)</option>
          </select>
        </div>

        {/* Temperature slider & instructions */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-450">
              <span>Criatividade / Variabilidade</span>
              <span>{temperature * 100}%</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-zinc-800 rounded-lg appearance-none h-1.5"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-zinc-400 text-[11px] font-medium block">Observações Adicionais</label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="Ex: adicione gírias cyberpunk, mencione café..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-650 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* ==================== RIGHT COLUMN: EDITOR & OUTPUT ==================== */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Prompt Card */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/20 p-5 flex flex-col gap-4 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-medium text-sm">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span>Tema / Conceito da Música</span>
            </div>
          </div>

          <textarea
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="Descreva sobre o que quer que a música fale. Seja específico ou poético! Exemplo: Um programador sênior resolvendo um bug crítico às 4 da manhã sob luzes neon..."
            className="w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 min-h-[80px] max-h-[140px] resize-none leading-relaxed transition-all"
          />

          <button
            onClick={handleGenerate}
            disabled={loading || !theme.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-zinc-950 py-3 font-semibold text-sm transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/10"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Compondo letras...</span>
              </>
            ) : (
              <>
                <span>Compor Letra de Música</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {/* Feedback messages */}
        {feedback && (
          <div className={`rounded-xl border px-4 py-3 text-xs flex items-center gap-2 ${
            feedbackType === "success" 
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" 
              : "bg-rose-950/30 text-rose-400 border-rose-900/50"
          }`}>
            <Info className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
        )}

        {/* Output Lyrics & Prompt */}
        {lyrics && (
          <div className="space-y-4 animate-in fade-in duration-300">
            
            {/* Style Prompt Copy Area */}
            {stylePrompt && (
              <div className="rounded-2xl border border-cyan-900/40 bg-cyan-950/10 p-4 space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                    Suno Style Prompt (Estilo da Música)
                  </span>
                  <button
                    onClick={handleCopyStyle}
                    className="text-[10px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                  >
                    {copiedStyle ? <Check className="h-3.5 w-3.5 text-cyan-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedStyle ? "Copiado!" : "Copiar Estilo"}</span>
                  </button>
                </div>
                <div className="bg-zinc-950/60 rounded-xl px-3 py-2.5 font-mono text-xs text-zinc-200 border border-zinc-850 select-all select-none">
                  {stylePrompt}
                </div>
                <p className="text-[10px] text-zinc-550 leading-normal">
                  *Cole esse campo na caixa &quot;Style of Music&quot; do Suno AI para definir os instrumentos e voz perfeitamente.
                </p>
              </div>
            )}

            {/* Lyrics Card */}
            <div className="rounded-3xl border border-zinc-800 bg-zinc-950/50 p-5 space-y-4 relative flex flex-col">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest block font-bold">Título da Música</span>
                  <h3 className="text-md font-bold text-zinc-100">{title}</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="text-xs text-zinc-400 hover:text-emerald-450 flex items-center gap-1 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1 bg-zinc-900/60"
                    title="Gerar outra versão com os mesmos parâmetros"
                  >
                    <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    <span>Regenerar</span>
                  </button>

                  <button
                    onClick={handleCopyLyrics}
                    className="text-xs text-zinc-400 hover:text-emerald-450 flex items-center gap-1 transition-colors border border-zinc-800 rounded-lg px-2.5 py-1 bg-zinc-900/60"
                  >
                    {copiedLyrics ? <Check className="h-4 w-4 text-emerald-450" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLyrics ? "Copiado!" : "Copiar Letra"}</span>
                  </button>
                </div>
              </div>

              {/* Main Lyrics Area */}
              <div className="whitespace-pre-wrap font-sans text-sm text-zinc-300 leading-relaxed max-h-[350px] overflow-y-auto pr-2 scrollbar-thin select-text">
                {lyrics.split("\n").map((line, idx) => {
                  const isTag = line.startsWith("[") && line.endsWith("]");
                  const isAction = line.startsWith("(") && line.endsWith(")");
                  if (isTag) {
                    return (
                      <div key={idx} className="text-emerald-400 font-bold text-xs mt-4 mb-2 tracking-wide font-mono">
                        {line}
                      </div>
                    );
                  }
                  if (isAction) {
                    return (
                      <div key={idx} className="text-zinc-500 italic text-xs mb-1 font-mono">
                        {line}
                      </div>
                    );
                  }
                  return <div key={idx}>{line}</div>;
                })}
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
