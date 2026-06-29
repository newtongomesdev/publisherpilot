"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  FileJson,
  Sliders,
  Check,
  Eye
} from "lucide-react";

type ChartType = "bar" | "horizontalBar" | "line" | "pie" | "doughnut" | "radar" | "polarArea" | "scatter" | "bubble" | "mixed" | "gauge" | "funnel";

const COLOR_PALETTES = {
  emerald: { label: "Esmeralda", colors: ["#10b981", "#059669", "#047857", "#064e3b"] },
  ocean: { label: "Oceano", colors: ["#3b82f6", "#2563eb", "#1d4ed8", "#1e40af"] },
  sunset: { label: "Pôr do Sol", colors: ["#f97316", "#ea580c", "#ef4444", "#dc2626"] },
  neon: { label: "Neon", colors: ["#a855f7", "#ec4899", "#22d3ee", "#facc15"] },
  mono: { label: "Monocromático", colors: ["#a1a1aa", "#717172", "#52525b", "#3f3f46"] },
  fire: { label: "Fogo", colors: ["#ef4444", "#f97316", "#f59e0b", "#a1a1aa"] },
};

const PRESET_COLORS = [
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#a855f7", // Purple
  "#ec4899", // Pink
  "#14b8a6", // Teal
  "#6366f1", // Indigo
  "#64748b", // Slate
  "#eab308"  // Yellow
];

// Shared styling for professional-looking charts
const PRO: Record<string, unknown> = {
  font: { family: "'Segoe UI', 'Inter', system-ui, sans-serif", size: 12, weight: "500" },
  color: "#71717a",
  padding: { top: 20, right: 20, bottom: 10, left: 10 },
  title: { display: true, font: { size: 16, weight: "700", family: "'Segoe UI', 'Inter', system-ui, sans-serif" }, color: "#27272a", padding: { bottom: 16 } },
  legend: { labels: { usePointStyle: true, padding: 16, font: { size: 11, family: "'Segoe UI', 'Inter', system-ui, sans-serif" } } },
  scales: {
    x: { grid: { color: "rgba(228,228,231,0.5)", drawBorder: false }, ticks: { font: { size: 11 }, color: "#a1a1aa" } },
    y: { grid: { color: "rgba(228,228,231,0.5)", drawBorder: false }, ticks: { font: { size: 11 }, color: "#a1a1aa" }, beginAtZero: true },
  },
};

const CHART_PRESETS: Record<ChartType, { label: string; config: string }> = {
  bar: {
    label: "Barras",
    config: JSON.stringify({
      type: "bar",
      data: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], datasets: [{ label: "Vendas 2025", data: [65,59,80,81,56,55], backgroundColor: ["#10b981","#34d399","#6ee7b7","#a7f3d0","#34d399","#10b981"], borderColor: "#059669", borderWidth: 0, borderRadius: 8, borderSkipped: false }] },
      options: { ...PRO, title: { ...PRO.title as object, text: "Vendas Mensais" }, plugins: { datalabels: { display: true, anchor: "end", align: "top", color: "#27272a", font: { weight: "bold", size: 11 } } } },
    }, null, 2),
  },
  horizontalBar: {
    label: "Barras Horiz.",
    config: JSON.stringify({
      type: "horizontalBar",
      data: { labels: ["Produto A","Produto B","Produto C","Produto D","Produto E"], datasets: [{ label: "Unidades vendidas", data: [120,190,170,140,110], backgroundColor: ["#10b981","#3b82f6","#f59e0b","#a855f7","#ef4444"], borderRadius: 6, borderSkipped: false }] },
      options: { ...PRO, indexAxis: "y", title: { ...PRO.title as object, text: "Vendas por Produto" }, legend: { display: false }, scales: { x: { grid: { color: "rgba(228,228,231,0.5)", drawBorder: false }, ticks: { font: { size: 11 }, color: "#a1a1aa" }, beginAtZero: true }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: "600" }, color: "#3f3f46" } } } },
    }, null, 2),
  },
  line: {
    label: "Linha",
    config: JSON.stringify({
      type: "line",
      data: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], datasets: [
        { label: "Receita", data: [12,19,3,5,2,3], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.08)", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#fff", pointBorderColor: "#10b981", pointBorderWidth: 2, pointHoverRadius: 7 },
        { label: "Despesas", data: [7,11,5,8,3,7], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.05)", fill: true, tension: 0.4, pointRadius: 5, pointBackgroundColor: "#fff", pointBorderColor: "#ef4444", pointBorderWidth: 2, pointHoverRadius: 7 },
      ]},
      options: { ...PRO, title: { ...PRO.title as object, text: "Receita vs Despesas" } },
    }, null, 2),
  },
  pie: {
    label: "Pizza",
    config: JSON.stringify({
      type: "pie",
      data: { labels: ["Produto A","Produto B","Produto C","Produto D"], datasets: [{ data: [40,25,20,15], backgroundColor: ["#10b981","#3b82f6","#f59e0b","#a855f7"], borderWidth: 3, borderColor: "#fff", hoverOffset: 8 }] },
      options: { ...PRO, title: { ...PRO.title as object, text: "Participação por Produto" }, plugins: { legend: { position: "right", labels: { usePointStyle: true, padding: 12, font: { size: 12 } } } } },
    }, null, 2),
  },
  doughnut: {
    label: "Rosca",
    config: JSON.stringify({
      type: "doughnut",
      data: { labels: ["Desktop","Mobile","Tablet"], datasets: [{ data: [55,35,10], backgroundColor: ["#10b981","#3b82f6","#f59e0b"], borderWidth: 3, borderColor: "#fff", hoverOffset: 6, cutout: "65%" }] },
      options: { ...PRO, title: { ...PRO.title as object, text: "Tráfego por Dispositivo" }, plugins: { legend: { position: "right", labels: { usePointStyle: true, padding: 12, font: { size: 12 } } } } },
    }, null, 2),
  },
  radar: {
    label: "Radar",
    config: JSON.stringify({
      type: "radar",
      data: { labels: ["Velocidade","Força","Defesa","Magia","Resistência"], datasets: [
        { label: "Nosso", data: [65,59,90,81,56], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.15)", pointBackgroundColor: "#10b981", pointBorderColor: "#fff", pointBorderWidth: 2, borderWidth: 2 },
        { label: "Concorrente", data: [28,48,40,19,96], borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)", pointBackgroundColor: "#3b82f6", pointBorderColor: "#fff", pointBorderWidth: 2, borderWidth: 2 },
      ]},
      options: { ...PRO, title: { ...PRO.title as object, text: "Comparação de Atributos" }, scales: { r: { beginAtZero: true, max: 100, grid: { color: "rgba(228,228,231,0.5)" }, angleLines: { color: "rgba(228,228,231,0.5)" }, pointLabels: { font: { size: 11, weight: "600" }, color: "#52525b" }, ticks: { display: false } } } },
    }, null, 2),
  },
  polarArea: {
    label: "Polar",
    config: JSON.stringify({
      type: "polarArea",
      data: { labels: ["Red","Green","Yellow","Blue","Purple"], datasets: [{ data: [11,16,7,14,10], backgroundColor: ["rgba(239,68,68,0.65)","rgba(16,185,129,0.65)","rgba(245,158,11,0.65)","rgba(59,130,246,0.65)","rgba(168,85,247,0.65)"], borderWidth: 2, borderColor: "#fff" }] },
      options: { ...PRO, title: { ...PRO.title as object, text: "Área Polar" }, scales: { r: { grid: { color: "rgba(228,228,231,0.4)" }, ticks: { display: false } } } },
    }, null, 2),
  },
  scatter: {
    label: "Dispersão",
    config: JSON.stringify({
      type: "scatter",
      data: { datasets: [
        { label: "Grupo A", data: [{ x:10,y:20 },{ x:15,y:25 },{ x:20,y:30 },{ x:25,y:35 }], backgroundColor: "rgba(16,185,129,0.7)", borderColor: "#10b981", pointRadius: 7, pointHoverRadius: 10 },
        { label: "Grupo B", data: [{ x:5,y:15 },{ x:12,y:22 },{ x:18,y:28 },{ x:30,y:40 }], backgroundColor: "rgba(59,130,246,0.7)", borderColor: "#3b82f6", pointRadius: 7, pointHoverRadius: 10 },
      ]},
      options: { ...PRO, title: { ...PRO.title as object, text: "Dispersão de Dados" } },
    }, null, 2),
  },
  bubble: {
    label: "Bolhas",
    config: JSON.stringify({
      type: "bubble",
      data: { datasets: [
        { label: "Startup A", data: [{ x:20,y:30,r:15 }], backgroundColor: "rgba(16,185,129,0.5)", borderColor: "#10b981", borderWidth: 2 },
        { label: "Startup B", data: [{ x:40,y:10,r:25 }], backgroundColor: "rgba(59,130,246,0.5)", borderColor: "#3b82f6", borderWidth: 2 },
      ]},
      options: { ...PRO, title: { ...PRO.title as object, text: "Startup Comparativo" } },
    }, null, 2),
  },
  mixed: {
    label: "Misto",
    config: JSON.stringify({
      type: "bar",
      data: { labels: ["Jan","Fev","Mar","Abr","Mai","Jun"], datasets: [
        { type: "bar", label: "Vendas", data: [65,59,80,81,56,55], backgroundColor: "rgba(16,185,129,0.6)", borderRadius: 6, borderSkipped: false, yAxisID: "y" },
        { type: "line", label: "Meta", data: [70,65,75,80,60,60], borderColor: "#ef4444", borderWidth: 2, pointRadius: 4, pointBackgroundColor: "#fff", pointBorderColor: "#ef4444", pointBorderWidth: 2, fill: false, tension: 0.3, yAxisID: "y" },
      ]},
      options: { ...PRO, title: { ...PRO.title as object, text: "Vendas vs Meta" } },
    }, null, 2),
  },
  gauge: {
    label: "Medidor",
    config: JSON.stringify({
      type: "doughnut",
      data: { labels: ["Completado","Restante"], datasets: [{ data: [75,25], backgroundColor: ["#10b981","rgba(228,228,231,0.25)"], borderWidth: 0, cutout: "75%" }] },
      options: { rotation: -90, circumference: 180, title: { ...PRO.title as object, text: "Progresso: 75%", font: { size: 20, weight: "800" } }, legend: { display: false } },
    }, null, 2),
  },
  funnel: {
    label: "Funil",
    config: JSON.stringify({
      type: "bar",
      data: { labels: ["Visitantes","Leads","Oportunidades","Vendas"], datasets: [{ data: [10000,4500,2200,800], backgroundColor: ["#10b981","#3b82f6","#f59e0b","#a855f7"], borderRadius: 6, borderSkipped: false, borderWidth: 0 }] },
      options: { ...PRO, indexAxis: "y", title: { ...PRO.title as object, text: "Funil de Conversão" }, legend: { display: false }, scales: { x: { grid: { color: "rgba(228,228,231,0.5)", drawBorder: false }, ticks: { font: { size: 11 }, color: "#a1a1aa" } }, y: { grid: { display: false }, ticks: { font: { size: 12, weight: "600" }, color: "#3f3f46" } } } },
    }, null, 2),
  },
};

const CHART_TYPES: { key: ChartType; label: string; icon: string }[] = [
  { key: "bar", label: "Barras", icon: "📊" },
  { key: "horizontalBar", label: "Horiz.", icon: "📶" },
  { key: "line", label: "Linha", icon: "📈" },
  { key: "pie", label: "Pizza", icon: "🥧" },
  { key: "doughnut", label: "Rosca", icon: "🍩" },
  { key: "radar", label: "Radar", icon: "🕸" },
  { key: "polarArea", label: "Polar", icon: "🎯" },
  { key: "scatter", label: "Dispersão", icon: "⚬" },
  { key: "bubble", label: "Bolhas", icon: "🫧" },
  { key: "mixed", label: "Misto", icon: "🔀" },
  { key: "gauge", label: "Medidor", icon: "⏱" },
  { key: "funnel", label: "Funil", icon: "🔽" },
];

const SUGGESTED_PROMPTS = [
  "Crie um gráfico de pizza mostrando a participação de mercado: Chrome 65%, Safari 18%, Edge 8%, Firefox 5%, Outros 4%",
  "Um gráfico de linhas elegante comparando as receitas trimestrais de 2024 e 2025",
  "Gráfico de barras de satisfação do cliente para 5 departamentos diferentes com notas de 1 a 10",
  "Gráfico de rosca simples de progresso de meta de vendas batendo 85%"
];

interface DatasetState {
  id: string;
  label: string;
  dataStr: string;
  color: string;
  type?: string;
}

export function QuickChartPanel() {
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [config, setConfig] = useState(CHART_PRESETS.bar.config);
  
  // Visual Form States
  const [visualTitle, setVisualTitle] = useState("Vendas Mensais");
  const [visualLabels, setVisualLabels] = useState("Jan, Fev, Mar, Abr, Mai, Jun");
  const [visualDatasets, setVisualDatasets] = useState<DatasetState[]>([
    { id: "1", label: "Vendas 2025", dataStr: "65, 59, 80, 81, 56, 55", color: "#10b981" }
  ]);

  // UI Modes & States
  const [editorTab, setEditorTab] = useState<"visual" | "code">("visual");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Configuration States
  const [width, setWidth] = useState(600);
  const [height, setHeight] = useState(350);
  const [bgColor, setBgColor] = useState("#ffffff");
  const [devicePixelRatio, setDevicePixelRatio] = useState(2);
  const [palette, setPalette] = useState<keyof typeof COLOR_PALETTES>("emerald");
  const [animate] = useState(true);
  const [watermark, setWatermark] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [history, setHistory] = useState<{ url: string; config: string; time: string }[]>([]);
  const [format, setFormat] = useState<"png" | "svg">("png");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Parse Hex / HSL Color shifts for slice items (Pie/Doughnut)
  function getSliceColor(baseColor: string, index: number, total: number): string {
    const defaultColors = ["#10b981", "#3b82f6", "#f59e0b", "#a855f7", "#ef4444", "#ec4899", "#14b8a6", "#6366f1", "#64748b", "#eab308"];
    if (baseColor.startsWith("#")) {
      const hex = baseColor.replace('#', '');
      if (hex.length !== 6) return baseColor;
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      let rRatio = r / 255;
      let gRatio = g / 255;
      let bRatio = b / 255;
      let max = Math.max(rRatio, gRatio, bRatio), min = Math.min(rRatio, gRatio, bRatio);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rRatio: h = (gRatio - bRatio) / d + (gRatio < bRatio ? 6 : 0); break;
          case gRatio: h = (bRatio - rRatio) / d + 2; break;
          case bRatio: h = (rRatio - gRatio) / d + 4; break;
        }
        h /= 6;
      }
      
      const newHue = (h * 360 + (index * (360 / Math.max(total, 1)))) % 360;
      return `hsl(${Math.round(newHue)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    return defaultColors[index % defaultColors.length];
  }

  // Parse JSON string to Visual state
  const syncJsonToVisual = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const type = parsed.type === "bar" && parsed.options?.indexAxis === "y" ? "horizontalBar" : parsed.type || "bar";
      setChartType(type);

      const title = parsed.options?.title?.text || parsed.options?.plugins?.title?.text || "";
      setVisualTitle(title);

      const labels = parsed.data?.labels || [];
      setVisualLabels(labels.join(", "));

      const datasets = (parsed.data?.datasets || []).map((ds: any, idx: number) => {
        const dataValues = Array.isArray(ds.data)
          ? ds.data.map((v: any) => typeof v === 'object' ? JSON.stringify(v) : v).join(", ")
          : "";
        
        let color = PRESET_COLORS[idx % PRESET_COLORS.length];
        if (typeof ds.backgroundColor === 'string') {
          color = ds.backgroundColor;
        } else if (Array.isArray(ds.backgroundColor) && ds.backgroundColor.length > 0) {
          color = ds.backgroundColor[0];
        }

        return {
          id: String(idx + 1),
          label: ds.label || `Dataset ${idx + 1}`,
          dataStr: dataValues,
          color: color,
          type: ds.type || undefined
        };
      });

      if (datasets.length > 0) {
        setVisualDatasets(datasets);
      }
    } catch {
      // Ignore parse issues during typing
    }
  };

  // Compile Visual state to JSON string
  const syncVisualToJson = () => {
    if (isSyncing) return;
    setIsSyncing(true);

    try {
      const labels = visualLabels.split(",").map(s => s.trim()).filter(Boolean);
      const compiledDatasets = visualDatasets.map(ds => {
        const data = ds.dataStr.split(",").map((s: string) => {
          const trimmed = s.trim();
          if (!trimmed) return null;
          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try { return JSON.parse(trimmed); } catch { return trimmed; }
          }
          const num = Number(trimmed);
          return isNaN(num) ? trimmed : num;
        }).filter((v: any) => v !== null);

        let bgCol: string | string[] = ds.color;
        if (["pie", "doughnut", "polarArea"].includes(chartType) && labels.length > 1) {
          bgCol = labels.map((_, idx) => getSliceColor(ds.color, idx, labels.length));
        }

        const dsObj: any = {
          label: ds.label || "Dataset",
          data: data,
          backgroundColor: bgCol,
          borderColor: ds.color,
          borderWidth: chartType === 'line' ? 2 : 0,
        };

        if (chartType === 'line') {
          dsObj.fill = true;
          dsObj.tension = 0.4;
          dsObj.pointRadius = 4;
          dsObj.pointBackgroundColor = "#ffffff";
        }

        if (ds.type) {
          dsObj.type = ds.type;
        }

        return dsObj;
      });

      const optionsObj: any = {
        ...PRO,
        title: {
          ...PRO.title as object,
          display: !!visualTitle,
          text: visualTitle
        }
      };

      if (chartType === "horizontalBar") {
        optionsObj.indexAxis = "y";
      }

      const chartObj = {
        type: chartType === "horizontalBar" ? "bar" : chartType,
        data: {
          labels: labels,
          datasets: compiledDatasets
        },
        options: optionsObj
      };

      setConfig(JSON.stringify(chartObj, null, 2));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync visual -> json when visual fields change
  useEffect(() => {
    if (editorTab === "visual") {
      syncVisualToJson();
    }
  }, [chartType, visualTitle, visualLabels, visualDatasets, editorTab, syncVisualToJson]);

  // Sync json -> visual when json config tab is selected or preset clicked
  const handleConfigChange = (newVal: string) => {
    setConfig(newVal);
    syncJsonToVisual(newVal);
  };

  function getChartUrl(): string {
    const parsed = JSON.parse(config);
    if (animate && parsed.options) parsed.options.animation = { duration: 500 };
    else if (parsed.options) delete parsed.options.animation;
    const finalConfig = JSON.stringify(parsed);
    const url = new URL("https://quickchart.io/chart");
    url.searchParams.set("c", finalConfig);
    url.searchParams.set("w", String(width));
    url.searchParams.set("h", String(height));
    url.searchParams.set("bkg", bgColor);
    url.searchParams.set("devicePixelRatio", String(devicePixelRatio));
    if (format === "svg") url.searchParams.set("fmt", "svg");
    if (watermark) url.searchParams.set("wtr", watermark);
    return url.toString();
  }

  function handleTypeChange(type: ChartType) {
    setChartType(type);
    const preset = CHART_PRESETS[type].config;
    setConfig(preset);
    syncJsonToVisual(preset);
    setGeneratedUrl("");
  }

  function handleGenerate() {
    try {
      JSON.parse(config);
      const url = getChartUrl();
      setGeneratedUrl(url);
      setHistory((prev) => [{ url, config: config.slice(0, 80) + "...", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
      setFeedback("Gráfico gerado com sucesso!");
      setFeedbackType("success");
    } catch {
      setFeedback("JSON inválido. Verifique a configuração.");
      setFeedbackType("error");
    }
  }

  function handleCopyUrl() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setFeedback("URL copiada!");
    setFeedbackType("success");
  }

  function handleFormatJson() {
    try {
      const parsed = JSON.parse(config);
      setConfig(JSON.stringify(parsed, null, 2));
      setFeedback("JSON formatado!");
      setFeedbackType("success");
    } catch {
      setFeedback("JSON inválido para formatar.");
      setFeedbackType("error");
    }
  }

  function handleApplyPalette() {
    try {
      const parsed = JSON.parse(config);
      const colors = COLOR_PALETTES[palette].colors;
      if (parsed.data?.datasets) {
        parsed.data.datasets.forEach((ds: { backgroundColor?: string | string[]; borderColor?: string }, i: number) => {
          ds.backgroundColor = colors[i % colors.length];
          if (ds.borderColor) ds.borderColor = colors[i % colors.length];
        });
      }
      const newConfigStr = JSON.stringify(parsed, null, 2);
      setConfig(newConfigStr);
      syncJsonToVisual(newConfigStr);
      setFeedback("Paleta aplicada!");
      setFeedbackType("success");
    } catch {
      setFeedback("JSON inválido.");
      setFeedbackType("error");
    }
  }

  // AI Chart Generator Call
  const handleAiGenerate = async (promptText = aiPrompt) => {
    if (!promptText.trim()) return;
    setIsAiGenerating(true);
    setFeedback("");
    
    let currentParsed = null;
    try {
      currentParsed = JSON.parse(config);
    } catch {}

    try {
      const response = await fetch("/api/charts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          currentConfig: currentParsed
        })
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Erro ao conectar-se à IA.");
      }

      const generatedStr = JSON.stringify(data.config, null, 2);
      setConfig(generatedStr);
      syncJsonToVisual(generatedStr);
      
      // Auto-trigger chart rendering
      setTimeout(() => {
        try {
          const url = getChartUrl();
          setGeneratedUrl(url);
          setHistory((prev) => [{ url, config: generatedStr.slice(0, 80) + "...", time: new Date().toLocaleTimeString() }, ...prev].slice(0, 10));
          setFeedback("Gráfico criado pela IA com sucesso!");
          setFeedbackType("success");
        } catch {}
      }, 100);

    } catch (error: any) {
      console.error(error);
      setFeedback(error.message || "Erro ao gerar gráfico com IA.");
      setFeedbackType("error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Add dataset helper
  const handleAddDataset = () => {
    const newId = String(visualDatasets.length + 1);
    const randomColor = PRESET_COLORS[visualDatasets.length % PRESET_COLORS.length];
    setVisualDatasets([
      ...visualDatasets,
      { id: newId, label: `Dataset ${newId}`, dataStr: "50, 60, 70, 80, 90, 100", color: randomColor }
    ]);
  };

  // Remove dataset helper
  const handleRemoveDataset = (id: string) => {
    if (visualDatasets.length <= 1) {
      setFeedback("Você precisa manter ao menos 1 dataset.");
      setFeedbackType("error");
      return;
    }
    setVisualDatasets(visualDatasets.filter(d => d.id !== id));
  };

  // Edit dataset helper
  const handleUpdateDataset = (id: string, field: keyof DatasetState, val: string) => {
    setVisualDatasets(visualDatasets.map(ds => {
      if (ds.id === id) {
        return { ...ds, [field]: val };
      }
      return ds;
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Configuration Column (Left) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* 🤖 AI Generator Panel */}
        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/20 to-zinc-900/50 p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full filter blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Assistente de Gráficos IA</h3>
              <p className="text-xs text-zinc-500">Descreva o gráfico em português e deixe a IA configurá-lo para você.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ex: Crie um gráfico de barras moderno mostrando as vendas de 2024 (120, 150, 180) e 2025 (140, 190, 240) para os meses de Jan, Fev e Mar..."
              rows={2}
              className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 resize-none transition-all"
            />
            <button
              onClick={() => handleAiGenerate()}
              disabled={isAiGenerating || !aiPrompt.trim()}
              className="flex items-center justify-center rounded-xl bg-emerald-500 text-white font-medium text-xs px-4 hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-auto self-stretch min-w-[90px]"
            >
              {isAiGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span>Gerar</span>
                </div>
              )}
            </button>
          </div>

          {/* Prompt Presets */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setAiPrompt(p);
                  handleAiGenerate(p);
                }}
                className="text-[10px] text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 max-w-[280px] truncate text-left transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Tabs & Panel */}
        <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl overflow-hidden shadow-md">
          
          {/* Tab Header */}
          <div className="flex border-b border-zinc-800 bg-zinc-950/40 p-2">
            <button
              onClick={() => setEditorTab("visual")}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                editorTab === "visual"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Editar Visualmente
            </button>
            <button
              onClick={() => {
                setEditorTab("code");
                handleFormatJson();
              }}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                editorTab === "code"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <FileJson className="h-3.5 w-3.5" />
              Editar Código (JSON)
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5 space-y-5">
            {editorTab === "visual" ? (
              <div className="space-y-4">
                
                {/* Chart Type */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Tipo de Gráfico</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {CHART_TYPES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => handleTypeChange(t.key)}
                        className={`rounded-xl border p-2 text-center text-[10px] transition-all flex flex-col items-center justify-center gap-1 ${
                          chartType === t.key
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <span className="text-lg leading-none">{t.icon}</span>
                        <span className="truncate max-w-full font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title and Labels Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Título do Gráfico</label>
                    <input
                      type="text"
                      value={visualTitle}
                      onChange={(e) => setVisualTitle(e.target.value)}
                      placeholder="Ex: Vendas Anuais"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Rótulos do Eixo X (Categorias)</label>
                    <input
                      type="text"
                      value={visualLabels}
                      onChange={(e) => setVisualLabels(e.target.value)}
                      placeholder="Separados por vírgula. Ex: Jan, Fev, Mar"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>

                {/* Datasets List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500">Dados (Datasets)</label>
                    <button
                      type="button"
                      onClick={handleAddDataset}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      <Plus className="h-3 w-3" /> Adicionar Dataset
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {visualDatasets.map((ds) => (
                      <div key={ds.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 relative group space-y-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveDataset(ds.id)}
                          className="absolute top-3 right-3 text-zinc-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pr-6">
                          {/* Label input */}
                          <div className="sm:col-span-4">
                            <input
                              type="text"
                              value={ds.label}
                              onChange={(e) => handleUpdateDataset(ds.id, "label", e.target.value)}
                              placeholder="Nome do conjunto"
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                            />
                          </div>

                          {/* Data numbers input */}
                          <div className="sm:col-span-8">
                            <input
                              type="text"
                              value={ds.dataStr}
                              onChange={(e) => handleUpdateDataset(ds.id, "dataStr", e.target.value)}
                              placeholder="Valores. Ex: 10, 20, 30, 40"
                              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Color Selector */}
                        <div className="flex items-center gap-2 pt-1 border-t border-zinc-900">
                          <span className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">Cor:</span>
                          <div className="flex flex-wrap gap-1.5 items-center flex-1">
                            {PRESET_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                onClick={() => handleUpdateDataset(ds.id, "color", c)}
                                className={`h-4.5 w-4.5 rounded-full border transition-all ${
                                  ds.color === c ? "ring-2 ring-emerald-500 border-white scale-110" : "border-zinc-800 hover:scale-105"
                                }`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                            {/* Hex input */}
                            <input
                              type="text"
                              value={ds.color}
                              onChange={(e) => handleUpdateDataset(ds.id, "color", e.target.value)}
                              className="w-16 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] text-zinc-300 font-mono focus:border-emerald-500 outline-none ml-2"
                              placeholder="#hex"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-zinc-500">Modifique a configuração livremente usando a sintaxe do Chart.js v2.</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleFormatJson}
                      className="text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-950 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Formatar
                    </button>
                  </div>
                </div>
                <textarea
                  ref={textareaRef}
                  value={config}
                  onChange={(e) => handleConfigChange(e.target.value)}
                  className="min-h-[280px] w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-200 outline-none focus:border-emerald-500 resize-y"
                  spellCheck={false}
                />

                {/* Palettes section */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Paletas Rápidas</label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {Object.entries(COLOR_PALETTES).map(([key, pal]) => (
                      <button
                        key={key}
                        onClick={() => setPalette(key as keyof typeof COLOR_PALETTES)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-all ${
                          palette === key
                            ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                            : "bg-zinc-950 text-zinc-400 hover:bg-zinc-800/50 border border-zinc-800"
                        }`}
                      >
                        <span className="text-[11px]">{pal.label}</span>
                        <span className="flex gap-0.5">
                          {pal.colors.map((c, i) => (
                            <span key={i} className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
                          ))}
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={handleApplyPalette}
                      className="rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-xs px-3 py-1.5 transition-colors ml-auto"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Design & API Parameters Panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Configurações de Exportação</h4>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Largura (px)</label>
              <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Altura (px)</label>
              <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Resolução (DPI)</label>
              <select value={devicePixelRatio} onChange={(e) => setDevicePixelRatio(Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500">
                <option value={1}>1x (Normal)</option>
                <option value={2}>2x (Retina)</option>
                <option value={3}>3x (Ultra HD)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Formato</label>
              <div className="flex gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                {(["png","svg"] as const).map((f) => (
                  <button key={f} onClick={() => setFormat(f)}
                    className={`flex-1 rounded-lg py-1 text-[10px] font-semibold transition-all uppercase ${
                      format === f ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
                    }`}>{f}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Fundo do Gráfico</label>
              <div className="flex gap-2">
                {["#ffffff","#18181b","#000000","#f0fdf4"].map((c) => (
                  <button key={c} onClick={() => setBgColor(c)}
                    className={`h-7 w-7 rounded-lg border transition-all relative ${
                      bgColor === c ? "ring-2 ring-emerald-500 border-emerald-400" : "border-zinc-800 hover:scale-105"
                    }`} style={{ backgroundColor: c }}>
                      {bgColor === c && <Check className={`h-3 w-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${c === '#ffffff' || c === '#f0fdf4' ? 'text-zinc-900' : 'text-white'}`} />}
                  </button>
                ))}
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 text-[11px] text-zinc-300 font-mono w-20 focus:border-emerald-500 outline-none"
                  placeholder="#hex"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Marca d&apos;água (opcional)</label>
              <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value)}
                placeholder="Ex: atlasforge.ai"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-200 outline-none focus:border-emerald-500" />
            </div>
          </div>
        </div>

      </div>

      {/* Preview Column (Right) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Render Action and Status */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-emerald-400" /> Visualização Real-time
            </h3>
            <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400 uppercase">
              QuickChart API
            </span>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div className={`p-2.5 rounded-xl text-xs font-medium border ${
              feedbackType === "success" 
                ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-950/20 text-rose-400 border-rose-500/20"
            }`}>
              {feedback}
            </div>
          )}

          {/* Generated Image Box */}
          {generatedUrl ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 overflow-hidden relative group">
              <img
                src={generatedUrl}
                alt="Gráfico Gerado"
                className="w-full h-auto object-contain transition-transform duration-300 max-h-[380px] p-2 bg-white"
                style={{ backgroundColor: bgColor }}
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={handleCopyUrl}
                  className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Copy className="h-3.5 w-3.5" /> Copiar URL
                </button>
                <a
                  href={generatedUrl}
                  download={`chart.${format}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-emerald-500 p-2 text-white hover:bg-emerald-400 transition-all flex items-center gap-1.5 text-xs font-semibold"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>
          ) : (
            <div className="h-[220px] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/10 flex flex-col items-center justify-center text-center p-6">
              <Sliders className="h-8 w-8 text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-500 max-w-[200px]">Nenhum gráfico gerado ainda. Configure ao lado e clique abaixo.</p>
            </div>
          )}

          {/* Main Action Trigger */}
          <div className="flex gap-2.5">
            <button
              onClick={handleGenerate}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs py-3 px-5 transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Atualizar / Renderizar Gráfico
            </button>
          </div>
        </div>

        {/* Saved History */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Histórico de Sessão</h4>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {history.map((h, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-950 border border-zinc-900 px-3 py-2 text-[11px]">
                  <span className="text-zinc-500 font-mono text-[10px]">{h.time}</span>
                  <span className="text-zinc-300 truncate flex-1 font-mono text-[10px]">{h.config}</span>
                  <button
                    onClick={() => {
                      setGeneratedUrl(h.url);
                      setFeedback("Carregado do histórico");
                      setFeedbackType("success");
                    }}
                    className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
