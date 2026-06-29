"use client";

import { useState, useEffect } from "react";
import { SimilarImagesSection } from "@/components/similar-images-section";
import {
  Sparkles,
  Download,
  Copy,
  Image as ImageIcon,
  Loader2,
  Check,
  ExternalLink,
  Trash2,
  X
} from "lucide-react";

interface FalModelInfo {
  modelId: string;
  name: string;
  cost: string;
  description: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: string;
  aspectRatio: string;
  timestamp: number;
}

const aspectRatios = [
  { value: "16:9", label: "16:9 Landscape", dims: "1024x576", iconClass: "w-8 h-5 border-2 rounded" },
  { value: "1:1", label: "1:1 Square", dims: "1024x1024", iconClass: "w-6 h-6 border-2 rounded" },
  { value: "9:16", label: "9:16 Portrait", dims: "576x1024", iconClass: "w-5 h-8 border-2 rounded" },
];

export function ImageGeneratorPanel() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("fal-ai/flux/schnell");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  
  // Advanced configuration states
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const [enableSafetyChecker, setEnableSafetyChecker] = useState(true);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  
  const [models, setModels] = useState<FalModelInfo[]>([]);
  const [loadingModels, setLoadingModels] = useState(true);
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);


  // Load models from API
  useEffect(() => {
    fetch("/api/images/fal/models")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok && data.models) {
          setModels(data.models);
        }
      })
      .catch((err) => console.error("Error fetching Fal.ai models:", err))
      .finally(() => setLoadingModels(false));
  }, []);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("atlas_forge_generated_images");
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading image history:", e);
    }
  }, []);

  const saveHistory = (newHistory: GeneratedImage[]) => {
    setHistory(newHistory);
    try {
      localStorage.setItem("atlas_forge_generated_images", JSON.stringify(newHistory));
    } catch (e) {
      console.error("Error saving image history:", e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          aspectRatio,
          negativePrompt: showAdvanced && negativePrompt ? negativePrompt.trim() : undefined,
          outputFormat: showAdvanced ? outputFormat : undefined,
          enableSafetyChecker: showAdvanced ? enableSafetyChecker : undefined,
          numInferenceSteps: showAdvanced ? numInferenceSteps : undefined,
          guidanceScale: showAdvanced ? guidanceScale : undefined,
        }),
      });


      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro desconhecido na geração");
      }

      if (data.image && data.image.url) {
        const newImg: GeneratedImage = {
          id: Math.random().toString(36).slice(2, 11),
          url: data.image.url,
          prompt: prompt.trim(),
          model: data.image.model || model,
          aspectRatio,
          timestamp: Date.now(),
        };

        const updatedHistory = [newImg, ...history];
        saveHistory(updatedHistory);
        setPrompt(""); // Clear input on success
      } else {
        throw new Error("API não retornou a URL da imagem.");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao gerar a imagem.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const deleteImage = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja remover esta imagem do seu histórico?")) return;
    const updated = history.filter((img) => img.id !== id);
    saveHistory(updated);
  };

  const selectedModelInfo = models.find((m) => m.modelId === model);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr] min-h-[500px]">
      
      {/* Configuration Column */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Criar Nova Imagem</h2>
          <p className="text-xs text-zinc-500 mt-1">Configure o modelo e descreva sua imagem.</p>
        </div>

        {/* Prompt Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Prompt da Imagem</label>
          <textarea
            className="w-full min-h-28 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500/50 focus:bg-zinc-900/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
            placeholder="Ex: Uma foto cinematográfica de uma xícara de café quente em cima de uma mesa de madeira rústica, luz do sol da manhã vazando pela janela, fumaça sutil, hiper detalhado, 8k..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={generating}
          />
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Modelo de IA (Fal.ai)</label>
          <select
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-100 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={generating || loadingModels}
          >
            {loadingModels ? (
              <option>Carregando modelos do Fal.ai...</option>
            ) : (
              models.map((m) => (
                <option key={m.modelId} value={m.modelId}>
                  {m.name} ({m.cost})
                </option>
              ))
            )}
          </select>
          {selectedModelInfo && (
            <p className="text-[10px] text-zinc-500 italic mt-1 leading-relaxed px-1">
              {selectedModelInfo.description}
            </p>
          )}
        </div>

        {/* Aspect Ratio */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">Proporção (Aspect Ratio)</label>
          <div className="grid grid-cols-3 gap-3">
            {aspectRatios.map((ar) => (
              <button
                key={ar.value}
                type="button"
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                  aspectRatio === ar.value
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700/60 hover:bg-zinc-900/40"
                }`}
                onClick={() => setAspectRatio(ar.value)}
                disabled={generating}
              >
                <div className={`${ar.iconClass} ${aspectRatio === ar.value ? "border-emerald-400" : "border-zinc-700"} mb-2`} />
                <span className="text-[11px] font-medium">{ar.label}</span>
                <span className="text-[9px] text-zinc-500 mt-0.5">{ar.dims}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Advanced Settings */}
        <div className="space-y-3 pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <span className="transform transition-transform duration-200 inline-block" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'rotate(0deg)' }}>
              ▶
            </span>
            <span>Configurações Avançadas</span>
          </button>

          {showAdvanced && (
            <div className="space-y-4 rounded-2xl border border-zinc-800/80 bg-zinc-950/20 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
              
              {/* Negative Prompt */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-400">Prompt Negativo (O que excluir)</label>
                <textarea
                  className="w-full min-h-16 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3 text-xs text-zinc-200 placeholder:text-zinc-700 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all resize-y"
                  placeholder="Ex: blurry, low quality, distorted, bad hands, extra limbs, ugly..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  disabled={generating}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Output Format */}
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-zinc-400">Formato de Saída</label>
                  <select
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 p-2.5 text-xs text-zinc-200 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 transition-all"
                    value={outputFormat}
                    onChange={(e) => setOutputFormat(e.target.value)}
                    disabled={generating}
                  >
                    <option value="jpeg">JPEG (.jpg)</option>
                    <option value="png">PNG (.png)</option>
                    <option value="webp">WEBP (.webp)</option>
                  </select>
                </div>

                {/* Safety Checker */}
                <div className="space-y-2 flex flex-col justify-between py-1">
                  <span className="text-[11px] font-semibold text-zinc-400">Filtro de Segurança</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEnableSafetyChecker(!enableSafetyChecker)}
                      disabled={generating}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        enableSafetyChecker ? "bg-emerald-500" : "bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          enableSafetyChecker ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-[11px] text-zinc-300">{enableSafetyChecker ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </div>

              {/* Inference Steps */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span>Passos de Inferência (Inference Steps)</span>
                  <span className="text-emerald-400 font-mono">{numInferenceSteps}</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  value={numInferenceSteps}
                  onChange={(e) => setNumInferenceSteps(Number(e.target.value))}
                  disabled={generating}
                />
                <span className="text-[9px] text-zinc-600 block">
                  Maior número melhora detalhes, mas aumenta o tempo e custo de processamento.
                </span>
              </div>

              {/* Guidance Scale */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
                  <span>Aderência ao Prompt (Guidance Scale)</span>
                  <span className="text-emerald-400 font-mono">{guidanceScale.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  value={guidanceScale}
                  onChange={(e) => setGuidanceScale(Number(e.target.value))}
                  disabled={generating}
                />
                <span className="text-[9px] text-zinc-600 block">
                  Determina o quanto o modelo segue estritamente seu texto descritivo.
                </span>
              </div>

            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}


        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 py-4 font-semibold text-zinc-950 shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
        >
          {generating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Gerando Imagem...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Gerar Imagem</span>
            </>
          )}
        </button>
      </div>

      {/* Results / History Column */}
      <div className="space-y-6 lg:border-l lg:border-zinc-800/60 lg:pl-8">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100">Galeria de Geração</h2>
          <p className="text-xs text-zinc-500 mt-1">Veja e salve suas criações recentes.</p>
        </div>

        {/* Empty State */}
        {history.length === 0 && !generating && (
          <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-zinc-800 p-12 text-center min-h-[360px] bg-zinc-950/10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900/60 text-zinc-500 mb-4">
              <ImageIcon className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">Nenhuma imagem criada</h3>
            <p className="text-xs text-zinc-500 max-w-[260px] mt-1.5 leading-relaxed">
              Escreva um prompt e clique em gerar para ver sua primeira criação aqui.
            </p>
          </div>
        )}

        {/* Loading Skeleton */}
        {generating && (
          <div className="rounded-[2rem] border border-zinc-800/80 bg-zinc-900/10 p-4 animate-pulse space-y-4">
            <div className="aspect-video w-full rounded-2xl bg-zinc-900/80 flex items-center justify-center">
              <div className="flex flex-col items-center text-zinc-500 gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                <span className="text-xs">Fal.ai criando sua obra...</span>
              </div>
            </div>
            <div className="space-y-2 h-14 bg-zinc-950/40 rounded-xl p-3">
              <div className="h-3 w-1/4 bg-zinc-900 rounded" />
              <div className="h-3.5 w-3/4 bg-zinc-900 rounded" />
            </div>
          </div>
        )}

        {/* Similar Images from ChromaDB */}
        {prompt.length > 10 && (
          <SimilarImagesSection prompt={prompt} />
        )}

        {/* History Grid */}
        {history.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 max-h-[580px] overflow-y-auto pr-1 pb-4">
            {history.map((img) => (
              <div
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group relative rounded-2xl border border-zinc-800/60 bg-zinc-950/40 overflow-hidden cursor-pointer hover:border-zinc-700/80 transition-all shadow-md shadow-black/10 hover:shadow-lg hover:shadow-black/20"
              >
                {/* Image Wrap */}
                <div className={`relative w-full overflow-hidden bg-zinc-900 ${
                  img.aspectRatio === "9:16" ? "aspect-[9/16]" : img.aspectRatio === "1:1" ? "aspect-square" : "aspect-video"
                }`}>
                  <img
                    src={img.url}
                    alt={img.prompt}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-medium truncate max-w-[120px]">
                        {img.model.split("/").pop()}
                      </span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(img.url, "_blank");
                          }}
                          className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white"
                          title="Abrir em nova aba"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => deleteImage(img.id, e)}
                          className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-400 hover:text-red-200"
                          title="Remover"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prompt Details */}
                <div className="p-3 border-t border-zinc-900/60 bg-zinc-950/20">
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {img.prompt}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-900/30">
                    <span className="text-[9px] text-zinc-500">
                      {new Date(img.timestamp).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(img.url, img.id);
                      }}
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-emerald-400"
                    >
                      {copiedId === img.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copiar link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox / Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-300">
          <button
            type="button"
            className="absolute top-6 right-6 p-2 rounded-full bg-zinc-900/60 text-zinc-400 hover:text-white"
            onClick={() => setSelectedImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          
          <div className="max-w-4xl w-full flex flex-col md:flex-row gap-6 bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Image display */}
            <div className="flex-1 max-h-[80vh] flex items-center justify-center bg-black/40">
              <img
                src={selectedImage.url}
                alt={selectedImage.prompt}
                className="max-w-full max-h-[60vh] md:max-h-[80vh] object-contain"
              />
            </div>

            {/* Image Details */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800/80">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-emerald-500 font-bold">Especificações</h3>
                  <div className="mt-2 space-y-1.5">
                    <p className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Modelo:</strong> {selectedImage.model}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Proporção:</strong> {selectedImage.aspectRatio}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      <strong className="text-zinc-300">Data:</strong> {new Date(selectedImage.timestamp).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold">Prompt Completo</h3>
                  <p className="text-xs text-zinc-300 mt-2 bg-zinc-900/40 rounded-xl p-3 border border-zinc-900 leading-relaxed max-h-48 overflow-y-auto">
                    {selectedImage.prompt}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = selectedImage.url;
                    link.download = `fal-generation-${selectedImage.id}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 py-3 text-sm font-medium text-zinc-200 border border-zinc-800 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Imagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedImage.url, selectedImage.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-zinc-950 transition-all"
                >
                  {copiedId === selectedImage.id ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>URL Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
