"use client";

import { useState, useEffect } from "react";
import { 
  Volume2, Play, AudioLines, Download, Settings, Sparkles, 
  Languages, Search, Mic, Waves, Sliders, Check, HelpCircle 
} from "lucide-react";

type Provider = "openrouter" | "edge" | "google";

type OpenRouterVoice = { id: string; label: string; lang: string };
type OpenRouterModel = {
  key: string;
  label: string;
  price: string;
  voices: OpenRouterVoice[];
  supportsInstructions: boolean;
  supportsVoiceClone: boolean;
};

type EdgeVoice = {
  id: string;
  gender: string;
  category: string;
  personality: string;
};

type GoogleVoice = {
  id: string;
  languageCodes: string[];
  gender: string;
  type: string;
};

export function OpenRouterTtsPanel() {
  const [provider, setProvider] = useState<Provider>("edge");
  const [searchQuery, setSearchQuery] = useState("");

  // OpenRouter state
  const [orModels, setOrModels] = useState<OpenRouterModel[]>([]);
  const [orModel, setOrModel] = useState("");
  const [orVoice, setOrVoice] = useState("");
  const [orLang, setOrLang] = useState("all");
  const [orInstructions, setOrInstructions] = useState("");
  const [cloneMode, setCloneMode] = useState(false);
  const [cloneUrl, setCloneUrl] = useState("");

  // Edge-TTS state
  const [edgeVoices, setEdgeVoices] = useState<EdgeVoice[]>([]);
  const [edgeVoice, setEdgeVoice] = useState("pt-BR-FranciscaNeural");
  const [edgeLang, setEdgeLang] = useState("all");
  const [edgeRate, setEdgeRate] = useState("+0%");
  const [edgeVolume, setEdgeVolume] = useState("+0%");
  const [edgePitch, setEdgePitch] = useState("+0Hz");

  // Google TTS state
  const [googleVoices, setGoogleVoices] = useState<GoogleVoice[]>([]);
  const [googleVoice, setGoogleVoice] = useState("");
  const [googleLang, setGoogleLang] = useState("all");
  const [googleRate, setGoogleRate] = useState(1.0);
  const [googlePitch, setGooglePitch] = useState(0.0);
  const [googleError, setGoogleError] = useState("");
  const [googleMoreOpen, setGoogleMoreOpen] = useState(false);

  // Common state
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "info">("info");
  const [audioUrl, setAudioUrl] = useState("");
  const [previewing, setPreviewing] = useState("");

  // Load OpenRouter models
  useEffect(() => {
    fetch("/api/openrouter/tts")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setOrModels(data.models);
          if (data.models.length > 0) {
            setOrModel(data.models[0].key);
            if (data.models[0].voices.length > 0) {
              setOrVoice(data.models[0].voices[0].id);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  // Load Edge-TTS voices
  useEffect(() => {
    fetch("/api/tts/edge")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setEdgeVoices(data.voices);
      })
      .catch(() => {});
  }, []);

  // Load Google TTS voices
  useEffect(() => {
    fetch("/api/tts/google")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setGoogleVoices(data.voices);
          if (data.voices.length > 0) setGoogleVoice(data.voices[0].id);
          setGoogleError("");
        } else {
          setGoogleError(data.error || "Erro ao carregar vozes do Google Cloud.");
        }
      })
      .catch(() => {
        setGoogleError("Não foi possível conectar ao servidor para obter as vozes do Google Cloud.");
      });
  }, []);

  // Computed lists
  const orCurrentModel = orModels.find((m) => m.key === orModel);
  const orLangs = orCurrentModel ? [...new Set(orCurrentModel.voices.map((v) => v.lang))] : [];
  const orFiltered = orCurrentModel
    ? orCurrentModel.voices.filter((v) => {
        const matchesLang = orLang === "all" || v.lang === orLang;
        const matchesSearch = v.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              v.id.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesLang && matchesSearch;
      })
    : [];

  // Edge-TTS: group variants under base language
  const EDGE_LANG_MAP: Record<string, string> = {
    en: "English", es: "Español", zh: "中文", ar: "العربية", pt: "Português",
    fr: "Français", de: "Deutsch", ru: "Русский", ja: "日本語", it: "Italiano",
    ko: "한국어", hi: "हिन्दी", nl: "Nederlands", pl: "Polski", tr: "Türkçe",
    vi: "Tiếng Việt", th: "ไทย", id: "Bahasa Indonesia", sv: "Svenska", nb: "Norsk",
    da: "Dansk", fi: "Suomi", cs: "Čeština", sk: "Slovenčina", ro: "Română",
    hu: "Magyar", el: "Ελληνικά", he: "עبرى", uk: "Українська", bg: "Български",
    hr: "Hrvatski", sr: "Српски", sl: "Slovenščina", lt: "Lietuvių", lv: "Latviešu",
    et: "Eesti", is: "Íslenska", af: "Afrikaans", ms: "Bahasa Melayu", fil: "Filipino",
    bn: "বাংলা", ta: "தமிழ்", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം",
    gu: "ગુજરાતી", ur: "اردو", mr: "मराठी", ne: "नेपाली", sw: "Kiswahili",
    fa: "فارسی", ka: "ქართული", kk: "Қазақ", km: "ភាសាខ្მែრ", lo: "ລາວ",
    mk: "Македонски", mn: "Монгол", my: "မြန်မာ", mt: "Malti", ps: "پښტო",
    si: "සිංහල", so: "Soomaali", sq: "Shqiptar", am: "አማርኛ", az: "Azərbaycan",
    bs: "Bosanski", ca: "Català", cy: "Cymraeg", eu: "Euskara", ga: "Gaeilge",
    gl: "Galego", hy: "Հայերენ", iu: "ᐃᓄᒃᑎᑐᑦ", zu: "isiZulu", be: "Беларуская",
  };
  
  const getEdgeBaseLang = (voiceId: string) => {
    const parts = voiceId.split("-");
    if (parts.length >= 2) return parts[0];
    return voiceId.split("_")[0];
  };

  const EDGE_TOP_LANGS = ["pt", "en", "es", "zh", "fr", "de", "ja", "it"];
  const edgeLangGroups = [...new Set(edgeVoices.map((v) => getEdgeBaseLang(v.id)))].sort();
  const edgeTopLangs = EDGE_TOP_LANGS.filter((l) => edgeLangGroups.includes(l));
  const edgeMoreLangs = edgeLangGroups.filter((l) => !EDGE_TOP_LANGS.includes(l));
  const [edgeMoreOpen, setEdgeMoreOpen] = useState(false);

  const edgeFiltered = edgeVoices.filter((v) => {
    const lang = getEdgeBaseLang(v.id);
    const matchesLang = edgeLang === "all" || lang === edgeLang;
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesSearch;
  });

  const GOOGLE_LANG_MAP: Record<string, string> = {
    "pt-BR": "Português",
    "en-US": "Inglês (US)",
    "es-ES": "Espanhol",
    "fr-FR": "Francês",
    "de-DE": "Alemão",
    "it-IT": "Italiano",
    "en-GB": "Inglês (UK)",
    "pt-PT": "Português (PT)",
    "ja-JP": "Japonês",
    "zh-CN": "Chinês",
  };
  const GOOGLE_TOP_LANGS = ["pt-BR", "en-US", "es-ES", "fr-FR", "de-DE", "it-IT"];
  const googleLangs = [...new Set(googleVoices.flatMap((v) => v.languageCodes))].sort();
  const googleTopLangs = GOOGLE_TOP_LANGS.filter((l) => googleLangs.includes(l));
  const googleMoreLangs = googleLangs.filter((l) => !GOOGLE_TOP_LANGS.includes(l));
  const googleFiltered = googleVoices.filter((v) => {
    const matchesLang = googleLang === "all" || v.languageCodes.includes(googleLang);
    const matchesSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLang && matchesSearch;
  });

  // Reset model-specific state on model change
  useEffect(() => {
    if (orCurrentModel?.voices.length) {
      setOrVoice(orCurrentModel.voices[0].id);
      setOrLang("all");
      setCloneMode(false);
    }
  }, [orModel, orCurrentModel?.voices]);

  // Clear search on provider change
  useEffect(() => {
    setSearchQuery("");
  }, [provider]);

  function showFeedback(msg: string, type: "success" | "error" | "info" = "info") {
    setFeedback(msg);
    setFeedbackType(type);
  }

  // Preview voice
  async function handlePreview(voiceId: string, prov: Provider) {
    setPreviewing(`${prov}-${voiceId}`);
    try {
      let resp: Response;

      if (prov === "openrouter") {
        resp = await fetch("/api/openrouter/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: orModel, voice: voiceId, preview: true }),
        });
      } else if (prov === "edge") {
        resp = await fetch("/api/tts/edge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Olá, esta é uma prévia desta voz. Como vai você hoje?", voice: voiceId }),
        });
      } else {
        resp = await fetch("/api/tts/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: "Olá, esta é uma prévia desta voz. Como vai você hoje?", voice: voiceId }),
        });
      }

      const data = await resp.json();
      if (!data.ok) {
        showFeedback(data.error ?? "Falha ao gerar preview", "error");
        return;
      }

      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mimeType || "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      showFeedback("Erro ao gerar preview.", "error");
    } finally {
      setPreviewing("");
    }
  }

  // Generate full audio
  async function handleGenerate() {
    if (!text.trim()) return;
    setLoading(true);
    setFeedback("");
    try {
      let resp: Response;

      if (provider === "openrouter") {
        const payload: Record<string, unknown> = {
          model: orModel,
          text,
          voice: orVoice,
        };
        if (orInstructions && orCurrentModel?.supportsInstructions) {
          payload.instructions = orInstructions;
        }
        if (cloneMode && cloneUrl && orCurrentModel?.supportsVoiceClone) {
          payload.voiceCloneUrl = cloneUrl;
        }
        resp = await fetch("/api/openrouter/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else if (provider === "edge") {
        resp = await fetch("/api/tts/edge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text, 
            voice: edgeVoice, 
            rate: edgeRate, 
            volume: edgeVolume, 
            pitch: edgePitch 
          }),
        });
      } else {
        const selectedVoiceObj = googleVoices.find((v) => v.id === googleVoice);
        const langCode = selectedVoiceObj?.languageCodes[0] || "pt-BR";
        resp = await fetch("/api/tts/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text, 
            voice: googleVoice, 
            languageCode: langCode,
            speakingRate: googleRate,
            pitch: googlePitch
          }),
        });
      }

      const data = await resp.json();
      if (!data.ok) {
        showFeedback(data.error ?? "Falha ao gerar áudio", "error");
        return;
      }

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      const binary = atob(data.audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: data.mimeType || "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      showFeedback("Áudio gerado com sucesso!", "success");
    } catch {
      showFeedback("Erro ao gerar áudio.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleDownload() {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    const ext = audioUrl.includes("wav") ? "wav" : "mp3";
    link.download = `tts-${provider}-${Date.now()}.${ext}`;
    link.click();
  }

  const feedbackColors = {
    success: "bg-emerald-950/40 text-emerald-400 border-emerald-900/50",
    error: "bg-rose-950/40 text-rose-400 border-rose-900/50",
    info: "bg-zinc-900 text-zinc-400 border-zinc-800",
  };

  const providerTabs: { key: Provider; label: string; badge: string; desc: string }[] = [
    { key: "edge", label: "Edge-TTS", badge: "GRATUITO", desc: "Microsoft Neural Voices" },
    { key: "openrouter", label: "OpenRouter", badge: "KOKORO AI", desc: "Qualidade Premium" },
    { key: "google", label: "Google TTS", badge: "FREE TIER", desc: "Vozes Padrão/Wavenet" },
  ];

  const providerBorderColors: Record<Provider, string> = {
    edge: "border-emerald-600 bg-emerald-950/10 text-emerald-400",
    openrouter: "border-cyan-600 bg-cyan-950/10 text-cyan-400",
    google: "border-blue-600 bg-blue-950/10 text-blue-400",
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* ==================== LEFT COLUMN: CONFIGURATION ==================== */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Provedores (Providers Selector) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-200 font-medium text-sm">
            <Settings className="h-4 w-4 text-emerald-500" />
            <span>Escolha o Provedor</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {providerTabs.map((p) => (
              <button
                key={p.key}
                onClick={() => setProvider(p.key)}
                className={`rounded-2xl border p-3 text-left transition-all duration-200 flex flex-col justify-between ${
                  provider === p.key
                    ? `${providerBorderColors[p.key]} ring-2 ring-current/25 shadow-md`
                    : "border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900/50"
                }`}
              >
                <div>
                  <div className="font-semibold text-xs tracking-wide">{p.label}</div>
                  <div className="text-[10px] opacity-60 mt-0.5 line-clamp-1">{p.desc}</div>
                </div>
                <div className="mt-2 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/50 self-start text-zinc-300">
                  {p.badge}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ========== EDGE-TTS OPTIONS ========== */}
        {provider === "edge" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Edge Language Filter */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                <Languages className="h-3.5 w-3.5 text-zinc-400" />
                <span>Idioma</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => { setEdgeLang("all"); setEdgeMoreOpen(false); }}
                  className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                    edgeLang === "all"
                      ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 font-medium"
                      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  Todos ({edgeVoices.length})
                </button>
                {edgeTopLangs.map((lang) => {
                  const count = edgeVoices.filter((v) => getEdgeBaseLang(v.id) === lang).length;
                  const label = EDGE_LANG_MAP[lang] || lang.toUpperCase();
                  return (
                    <button
                      key={lang}
                      onClick={() => { setEdgeLang(lang); setEdgeMoreOpen(false); }}
                      className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                        edgeLang === lang
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 font-medium"
                          : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {label} ({count})
                    </button>
                  );
                })}
                {/* Dropdown "Mais" */}
                <div className="relative">
                  <button
                    onClick={() => setEdgeMoreOpen(!edgeMoreOpen)}
                    className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                      edgeMoreLangs.includes(edgeLang)
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    {edgeMoreLangs.includes(edgeLang)
                      ? `${EDGE_LANG_MAP[edgeLang] || edgeLang.toUpperCase()} ▾`
                      : `Mais (${edgeMoreLangs.length}) ▾`}
                  </button>
                  {edgeMoreOpen && (
                    <div className="absolute top-full left-0 mt-1.5 z-50 max-h-[200px] overflow-y-auto rounded-xl border border-zinc-850 bg-zinc-900 shadow-xl min-w-[160px] scrollbar-thin">
                      {edgeMoreLangs.map((lang) => {
                        const count = edgeVoices.filter((v) => getEdgeBaseLang(v.id) === lang).length;
                        const label = EDGE_LANG_MAP[lang] || lang.toUpperCase();
                        return (
                          <button
                            key={lang}
                            onClick={() => { setEdgeLang(lang); setEdgeMoreOpen(false); }}
                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                              edgeLang === lang
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "text-zinc-400 hover:bg-zinc-800/80"
                            }`}
                          >
                            {label} ({count})
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Edge Search & Voice Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-zinc-350 text-xs font-medium">Voz</label>
                <span className="text-[10px] text-zinc-500 font-normal">{edgeFiltered.length} vozes disponíveis</span>
              </div>
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Pesquisar voz..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>

              {/* Grid Voice Options */}
              <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1 border border-zinc-850 bg-zinc-950/20 rounded-xl p-1.5 scrollbar-thin">
                {edgeFiltered.length === 0 ? (
                  <div className="text-center py-6 text-zinc-500 text-xs">Nenhuma voz encontrada</div>
                ) : (
                  edgeFiltered.map((v) => {
                    const isSelected = edgeVoice === v.id;
                    const cleanName = v.id.replace("Neural", "").split("-").slice(2).join("-") || v.id.replace("Neural", "");
                    const langLabel = v.id.split("-").slice(0, 2).join("-");
                    return (
                      <div
                        key={v.id}
                        onClick={() => setEdgeVoice(v.id)}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-150 ${
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isSelected && <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />}
                          <div className="truncate">
                            <span className="font-medium text-zinc-200">{cleanName}</span>
                            <span className="text-[10px] text-zinc-500 ml-1.5">({langLabel} · {v.gender === "Female" ? "Fem" : "Masc"})</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePreview(v.id, "edge"); }}
                          disabled={previewing !== ""}
                          className="ml-2 flex-shrink-0 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/30"
                          title="Ouvir amostra"
                        >
                          {previewing === `edge-${v.id}` ? (
                            <span className="block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                          ) : (
                            <Play className="h-2.5 w-2.5 fill-current" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Edge Rate Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-355 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Velocidade de Fala</span>
                </div>
                <span className="text-[10px] text-emerald-400">{edgeRate === "+0%" ? "Normal" : edgeRate}</span>
              </div>
              <div className="flex gap-1">
                {["-50%", "-25%", "+0%", "+25%", "+50%"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setEdgeRate(r)}
                    className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                      edgeRate === r
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 font-medium"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850"
                    }`}
                  >
                    {r === "+0%" ? "Normal" : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-355 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-zinc-550" />
                  <span>Volume</span>
                </div>
                <span className="text-[10px] text-emerald-400">{edgeVolume === "+0%" ? "Padrão" : edgeVolume}</span>
              </div>
              <div className="flex gap-1">
                {["-40%", "-20%", "+0%", "+20%", "+40%"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setEdgeVolume(v)}
                    className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                      edgeVolume === v
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 font-medium"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850"
                    }`}
                  >
                    {v === "+0%" ? "Normal" : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Edge Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-zinc-355 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <Sliders className="h-3.5 w-3.5 text-zinc-550" />
                  <span>Tom (Pitch)</span>
                </div>
                <span className="text-[10px] text-emerald-400">{edgePitch === "+0Hz" ? "Padrão" : edgePitch}</span>
              </div>
              <div className="flex gap-1">
                {["-10Hz", "-5Hz", "+0Hz", "+5Hz", "+10Hz"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setEdgePitch(p)}
                    className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                      edgePitch === p
                        ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30 font-medium"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850"
                    }`}
                  >
                    {p === "+0Hz" ? "Normal" : p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========== OPENROUTER OPTIONS ========== */}
        {provider === "openrouter" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Model Selection */}
            <div className="space-y-2">
              <label className="text-zinc-350 text-xs font-medium block">Modelo AI</label>
              <div className="grid grid-cols-1 gap-2">
                {orModels.map((m) => {
                  const isSelected = orModel === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setOrModel(m.key)}
                      className={`rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-cyan-600 bg-cyan-950/15 text-cyan-400 ring-1 ring-cyan-500/20"
                          : "border-zinc-800 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs tracking-wide text-zinc-200">{m.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">{m.price}</span>
                      </div>
                      <div className="text-[10px] opacity-60 mt-1">
                        {m.voices.length} vozes disponíveis · Suporta áudios complexos
                      </div>
                      <div className="flex gap-2 mt-2">
                        {m.supportsInstructions && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950/50 text-cyan-300 border border-cyan-900/50">
                            + Estilo
                          </span>
                        )}
                        {m.supportsVoiceClone && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-900/50">
                            + Clone
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language filter for OR */}
            {orCurrentModel && orLangs.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                  <Languages className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Idioma</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setOrLang("all")}
                    className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                      orLang === "all"
                        ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 font-medium"
                        : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                    }`}
                  >
                    Todos ({orCurrentModel.voices.length})
                  </button>
                  {orLangs.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setOrLang(lang)}
                      className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                        orLang === lang
                          ? "bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/30 font-medium"
                          : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      {lang.toUpperCase()} ({orCurrentModel.voices.filter((v) => v.lang === lang).length})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* OR Voice list with search */}
            {orCurrentModel && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-zinc-350 text-xs font-medium">Voz</label>
                  <span className="text-[10px] text-zinc-500">{orFiltered.length} vozes</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Pesquisar voz..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto pr-1 border border-zinc-850 bg-zinc-950/20 rounded-xl p-1.5 scrollbar-thin">
                  {orFiltered.length === 0 ? (
                    <div className="text-center py-6 text-zinc-500 text-xs">Nenhuma voz encontrada</div>
                  ) : (
                    orFiltered.map((v) => {
                      const isSelected = orVoice === v.id;
                      return (
                        <div
                          key={v.id}
                          onClick={() => setOrVoice(v.id)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? "bg-cyan-500/10 text-cyan-400 ring-1 ring-cyan-500/30"
                              : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected && <Check className="h-3 w-3 text-cyan-400 flex-shrink-0" />}
                            <span className="font-medium text-zinc-200 truncate">{v.label}</span>
                            <span className="text-[9px] text-zinc-500 flex-shrink-0">({v.lang})</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(v.id, "openrouter"); }}
                            disabled={previewing !== ""}
                            className="ml-2 flex-shrink-0 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/30"
                            title="Ouvir amostra"
                          >
                            {previewing === `openrouter-${v.id}` ? (
                              <span className="block h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                            ) : (
                              <Play className="h-2.5 w-2.5 fill-current" />
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Voice Cloning Options */}
            {orCurrentModel?.supportsVoiceClone && (
              <div className="rounded-2xl border border-indigo-900/50 bg-indigo-950/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
                      <Mic className="h-3.5 w-3.5 text-indigo-400" />
                      Clonagem de Voz Instantânea
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Envie um áudio de referência (3 a 25 segundos)</p>
                  </div>
                  <button
                    onClick={() => setCloneMode(!cloneMode)}
                    className={`rounded-xl px-3 py-1 text-[10px] font-bold tracking-wide transition-all ${
                      cloneMode 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    }`}
                  >
                    {cloneMode ? "Ativo" : "Ativar"}
                  </button>
                </div>
                {cloneMode && (
                  <input
                    type="url"
                    value={cloneUrl}
                    onChange={(e) => setCloneUrl(e.target.value)}
                    placeholder="URL direta do arquivo de áudio (mp3/wav/ogg)"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-655 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/10"
                  />
                )}
              </div>
            )}

            {/* Model Instructions */}
            {orCurrentModel?.supportsInstructions && (
              <div className="space-y-1.5">
                <label className="text-zinc-350 text-xs font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  Instruções de Estilo
                </label>
                <input
                  type="text"
                  value={orInstructions}
                  onChange={(e) => setOrInstructions(e.target.value)}
                  placeholder="Ex: Fale com um sussurro suave, pausado e melancólico..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            )}
          </div>
        )}

        {/* ========== GOOGLE TTS OPTIONS ========== */}
        {provider === "google" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {googleError ? (
              <div className="rounded-2xl border border-amber-900/40 bg-amber-955/10 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-amber-400">
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                  <span>Google Cloud TTS não configurado</span>
                </div>
                <p className="text-zinc-405 leading-relaxed">
                  Para utilizar as vozes do Google Cloud, é necessário configurar a variável <code className="bg-zinc-900 text-zinc-300 px-1 py-0.5 rounded font-mono">GOOGLE_TTS_API_KEY</code> no seu arquivo de ambiente <code className="bg-zinc-900 text-zinc-300 px-1 py-0.5 rounded font-mono">.env.local</code>.
                </p>
                <div className="text-[11px] text-zinc-550 border-t border-zinc-800/60 pt-2">
                  Detalhes do erro: <span className="font-mono text-zinc-400">{googleError}</span>
                </div>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-amber-400 hover:text-amber-300 transition-colors font-medium"
                >
                  Obter chave de API no Google Cloud Console ↗
                </a>
              </div>
            ) : (
              <>
                {/* Google Languages */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-zinc-300 text-xs font-medium">
                    <Languages className="h-3.5 w-3.5 text-zinc-505" />
                    <span>Idioma</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setGoogleLang("all"); setGoogleMoreOpen(false); }}
                      className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                        googleLang === "all"
                          ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 font-medium"
                          : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      Todos ({googleVoices.length})
                    </button>
                    {googleTopLangs.map((lang) => {
                      const count = googleVoices.filter((v) => v.languageCodes.includes(lang)).length;
                      const label = GOOGLE_LANG_MAP[lang] || lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => { setGoogleLang(lang); setGoogleMoreOpen(false); }}
                          className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                            googleLang === lang
                              ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 font-medium"
                              : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                          }`}
                        >
                          {label} ({count})
                        </button>
                      );
                    })}
                    {/* Dropdown "Mais" */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setGoogleMoreOpen(!googleMoreOpen)}
                        className={`rounded-xl px-3 py-1.5 text-xs transition-all ${
                          googleMoreLangs.includes(googleLang)
                            ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                            : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        {googleMoreLangs.includes(googleLang)
                          ? `${GOOGLE_LANG_MAP[googleLang] || googleLang} ▾`
                          : `Mais (${googleMoreLangs.length}) ▾`}
                      </button>
                      {googleMoreOpen && (
                        <div className="absolute top-full left-0 mt-1.5 z-50 max-h-[200px] overflow-y-auto rounded-xl border border-zinc-850 bg-zinc-900 shadow-xl min-w-[160px] scrollbar-thin">
                          {googleMoreLangs.map((lang) => {
                            const count = googleVoices.filter((v) => v.languageCodes.includes(lang)).length;
                            const label = GOOGLE_LANG_MAP[lang] || lang;
                            return (
                              <button
                                key={lang}
                                type="button"
                                onClick={() => { setGoogleLang(lang); setGoogleMoreOpen(false); }}
                                className={`w-full text-left px-3.5 py-2 text-xs transition-colors ${
                                  googleLang === lang
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "text-zinc-400 hover:bg-zinc-800/80"
                                }`}
                              >
                                {label} ({count})
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Google Voice grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-zinc-350 text-xs font-medium">Voz</label>
                    <span className="text-[10px] text-zinc-500">{googleFiltered.length} vozes</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Pesquisar voz..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-505 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-1.5 max-h-[240px] overflow-y-auto pr-1 border border-zinc-850 bg-zinc-950/20 rounded-xl p-1.5 scrollbar-thin">
                    {googleFiltered.length === 0 ? (
                      <div className="text-center py-6 text-zinc-500 text-xs">Nenhuma voz encontrada</div>
                    ) : (
                      googleFiltered.map((v) => {
                        const isSelected = googleVoice === v.id;
                        return (
                          <div
                            key={v.id}
                            onClick={() => setGoogleVoice(v.id)}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs cursor-pointer transition-all duration-150 ${
                              isSelected
                                ? "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30"
                                : "bg-zinc-900/40 text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-300"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              {isSelected && <Check className="h-3 w-3 text-blue-400 flex-shrink-0" />}
                              <div className="truncate">
                                <span className="font-medium text-zinc-200">{v.id.replace(v.languageCodes[0] + "-", "")}</span>
                                <span className="text-[10px] text-zinc-505 ml-1.5">({v.languageCodes[0]} · {v.gender === "FEMALE" ? "Fem" : "Masc"})</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); handlePreview(v.id, "google"); }}
                              disabled={previewing !== ""}
                              className="ml-2 flex-shrink-0 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/30"
                              title="Ouvir amostra"
                            >
                              {previewing === `google-${v.id}` ? (
                                <span className="block h-2.5 w-2.5 rounded-full bg-blue-400 animate-pulse" />
                              ) : (
                                <Play className="h-2.5 w-2.5 fill-current" />
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Google Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-355 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Velocidade de Fala</span>
                    </div>
                    <span className="text-[10px] text-blue-400">{googleRate}x</span>
                  </div>
                  <div className="flex gap-1">
                    {[0.75, 1.0, 1.25, 1.5, 1.75].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setGoogleRate(r)}
                        className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                          googleRate === r
                            ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 font-medium"
                            : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850"
                        }`}
                      >
                        {r === 1.0 ? "Normal" : `${r}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Google Pitch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-zinc-355 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <Sliders className="h-3.5 w-3.5 text-zinc-505" />
                      <span>Tom (Pitch)</span>
                    </div>
                    <span className="text-[10px] text-blue-400">{googlePitch > 0 ? `+${googlePitch}` : googlePitch}</span>
                  </div>
                  <div className="flex gap-1">
                    {[-6.0, -3.0, 0.0, 3.0, 6.0].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setGooglePitch(p)}
                        className={`flex-1 rounded-xl py-2 text-xs transition-all ${
                          googlePitch === p
                            ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30 font-medium"
                            : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-850"
                        }`}
                      >
                        {p === 0.0 ? "Normal" : p > 0 ? `+${p}` : p}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ==================== RIGHT COLUMN: EDITOR & PLAYER ==================== */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        
        {/* Editor Area */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/20 p-5 flex flex-col flex-1 gap-4 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/2 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200 font-medium text-sm">
              <AudioLines className="h-4 w-4 text-emerald-500" />
              <span>Texto para Conversão</span>
            </div>
            <span className="text-zinc-650 text-xs">{text.length} / 5000 caracteres</span>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite ou cole aqui o seu texto. Para melhores resultados, certifique-se de que a pontuação esteja correta e use parágrafos curtos..."
            className="flex-1 min-h-[220px] lg:min-h-[300px] w-full rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/10 resize-none transition-all duration-200 leading-relaxed"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-450 text-zinc-950 px-6 py-3 font-semibold text-sm transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-emerald-500/10`}
              >
                {loading ? (
                  <>
                    <Waves className="h-4 w-4 animate-bounce" />
                    <span>Processando áudio...</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="h-4 w-4 fill-current" />
                    <span>Gerar Áudio</span>
                  </>
                )}
              </button>

              {audioUrl && (
                <button
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/80 text-zinc-350 hover:text-zinc-100 px-5 py-3 font-medium text-xs transition-colors"
                  title="Fazer download do arquivo de áudio"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Baixar MP3/WAV</span>
                </button>
              )}
            </div>

            {/* Active Voice summary info indicator */}
            <div className="text-[10px] text-zinc-500 text-right self-center hidden md:block">
              Provedor: <span className="text-zinc-300 font-medium capitalize">{provider}</span> · 
              {provider === "edge" && " Voz: Microsoft"}
              {provider === "openrouter" && ` Kokoro (${orModel})`}
              {provider === "google" && " Google Cloud"}
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`rounded-2xl border px-4 py-3.5 text-xs flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-300 ${feedbackColors[feedbackType]}`}>
            <HelpCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{feedback}</span>
          </div>
        )}

        {/* Audio Player Card */}
        {audioUrl && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-4.5 backdrop-blur-md shadow-lg flex flex-col gap-3 animate-in fade-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-emerald-500" />
            <div className="flex items-center justify-between px-1.5">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Waves className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
                <span className="font-medium text-zinc-300">Player de Áudio</span>
              </div>
              <span className="text-[10px] text-emerald-500 bg-emerald-950/60 border border-emerald-900/50 px-2 py-0.5 rounded-full font-bold">
                PRONTO
              </span>
            </div>
            <audio controls src={audioUrl} className="w-full h-11 border-none focus:outline-none" />
          </div>
        )}
      </div>

    </div>
  );
}
