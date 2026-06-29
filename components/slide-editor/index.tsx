"use client";

import { useState, useEffect } from "react";
import { useSlideEditorStore, setupKeyboardShortcuts, hydrateStore, saveProject, listProjects, loadProject, deleteProject, SavedProject } from "@/lib/slide-editor/store";
import { SlideCanvas } from "./canvas";
import { LayerPanel } from "./layer-panel";
import { PropertyPanel } from "./property-panel";
import { SlideTimeline } from "./timeline";
import { ElementToolbar } from "./element-toolbar";
import { ThemePicker } from "./theme-picker";
import { FormatPicker } from "./format-picker";
import { Slide, SlideElement } from "@/lib/slide-editor/types";
import { createCoverSlide } from "@/lib/slide-editor/slide-utils";

function isValidHex(color: string): boolean {
  return typeof color === "string" && /^#[0-9A-Fa-f]{6}$/.test(color);
}

function getContrastColor(bgHex: string): string {
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#1B1714" : "#FFFFFF";
}

function buildElements(rawElements: any[], bg: string, slideIdx: number, ts: number): SlideElement[] {
  const fallback = getContrastColor(bg);

  if (!rawElements || rawElements.length === 0) {
    return [
      {
        type: "heading", id: `el_ai_${ts}_${slideIdx}_0`, x: 96, y: 400, width: 880, height: 200,
        props: { text: "Título", fontSize: 100, fontFamily: "Anton", color: fallback, fontWeight: 800, letterSpacing: -2, textTransform: "none" },
      },
    ];
  }

  return rawElements.map((el: any, j: number) => {
    const type = el.type || "heading";
    const x = typeof el.x === "number" ? el.x : 96;
    const y = typeof el.y === "number" ? el.y : 150 + j * 180;
    const width = typeof el.width === "number" ? el.width : 880;
    const height = typeof el.height === "number" ? el.height : 120;
    const id = `el_ai_${ts}_${slideIdx}_${j}`;
    const color = isValidHex(el.props?.color) ? el.props.color : fallback;

    switch (type) {
      case "heading":
        return {
          type: "heading" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "Título"),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 100,
            fontFamily: el.props?.fontFamily || "Anton",
            color,
            fontWeight: typeof el.props?.fontWeight === "number" ? el.props.fontWeight : 800,
            letterSpacing: typeof el.props?.letterSpacing === "number" ? el.props.letterSpacing : -2,
            textTransform: el.props?.textTransform || "none",
          },
        };
      case "subheading":
        return {
          type: "subheading" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "Subtítulo"),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 40,
            fontFamily: el.props?.fontFamily || "Inter",
            color,
            lineHeight: typeof el.props?.lineHeight === "number" ? el.props.lineHeight : 1.35,
          },
        };
      case "body":
        return {
          type: "body" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "Conteúdo"),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 36,
            fontFamily: el.props?.fontFamily || "Inter",
            color,
            lineHeight: typeof el.props?.lineHeight === "number" ? el.props.lineHeight : 1.5,
            maxWidth: typeof el.props?.maxWidth === "number" ? el.props.maxWidth : 880,
          },
        };
      case "kicker":
        return {
          type: "kicker" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "KICKER"),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 24,
            fontFamily: el.props?.fontFamily || "monospace",
            color: isValidHex(el.props?.color) ? el.props.color : "#BE4D2E",
            letterSpacing: typeof el.props?.letterSpacing === "number" ? el.props.letterSpacing : 4,
            textTransform: el.props?.textTransform || "uppercase",
          },
        };
      case "stat":
        return {
          type: "stat" as const, id, x, y, width, height,
          props: {
            value: String(el.props?.value || "0"),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 240,
            fontFamily: el.props?.fontFamily || "Anton",
            color: isValidHex(el.props?.color) ? el.props.color : "#BE4D2E",
          },
        };
      case "quote":
        return {
          type: "quote" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "Citação"),
            author: String(el.props?.author || ""),
            fontSize: typeof el.props?.fontSize === "number" ? el.props.fontSize : 64,
            fontFamily: el.props?.fontFamily || "Georgia",
            color,
            fontStyle: el.props?.fontStyle || "italic",
          },
        };
      default:
        return {
          type: "heading" as const, id, x, y, width, height,
          props: {
            text: String(el.props?.text || el.text || "Texto"),
            fontSize: 80,
            fontFamily: "Anton",
            color,
            fontWeight: 800,
            letterSpacing: -1,
            textTransform: "none",
          },
        };
    }
  });
}

// Slice a panoramic image into N equal pieces using client-side Canvas API
async function slicePanoramicImage(
  imageUrl: string,
  sliceCount: number,
  isPortrait: boolean,
): Promise<(string | null)[]> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const sliceW = img.naturalWidth / (isPortrait ? 1 : sliceCount);
      const sliceH = img.naturalHeight / (isPortrait ? sliceCount : 1);
      const slices: string[] = [];

      for (let i = 0; i < sliceCount; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(sliceW);
        canvas.height = Math.round(sliceH);
        const ctx = canvas.getContext("2d");
        if (!ctx) { slices.push(null as any); continue; }

        const sx = isPortrait ? 0 : Math.round(sliceW * i);
        const sy = isPortrait ? Math.round(sliceH * i) : 0;
        ctx.drawImage(img, sx, sy, Math.round(sliceW), Math.round(sliceH), 0, 0, canvas.width, canvas.height);
        slices.push(canvas.toDataURL("image/jpeg", 0.92));
      }

      console.log(`[slicePanoramic] Sliced into ${slices.length} pieces (${Math.round(sliceW)}x${Math.round(sliceH)} each)`);
      resolve(slices);
    };
    img.onerror = () => {
      console.error("[slicePanoramic] Failed to load panoramic image");
      resolve(Array(sliceCount).fill(null));
    };
    img.src = imageUrl;
  });
}

export function SlideEditor() {
  const { slides, setSlides, updateSlide, canvasFormat } = useSlideEditorStore();

  useEffect(() => {
    hydrateStore();
    setupKeyboardShortcuts();
  }, []);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiWithImages, setAiWithImages] = useState(true);
  const [aiImageModel, setAiImageModel] = useState("fal-ai/flux/schnell");
  const [aiSlideCount, setAiSlideCount] = useState(5);
  const [aiCarouselMode, setAiCarouselMode] = useState<"discrete" | "continuous">("discrete");
  const [aiPanoramic, setAiPanoramic] = useState(false);
  const [aiStyle, setAiStyle] = useState("dark-modern");
  const [aiStatus, setAiStatus] = useState("");
  const [showProjects, setShowProjects] = useState(false);
  const [projectList, setProjectList] = useState<SavedProject[]>([]);

  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);

    try {
      const resp = await fetch("/api/carousel/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `Gere slides de carrossel Instagram em JSON. Retorne SOMENTE JSON puro (sem markdown, sem \`\`\`).

Estrutura OBRIGATÓRIA:
{"slides":[{"type":"cover","background":"#1B1714","elements":[{"type":"heading","x":96,"y":350,"width":880,"height":200,"props":{"text":"Título","fontSize":100,"fontFamily":"Anton","color":"#FFFFFF","fontWeight":800,"letterSpacing":-2,"textTransform":"none"}},{"type":"subheading","x":96,"y":580,"width":800,"height":60,"props":{"text":"Subtítulo","fontSize":40,"fontFamily":"Inter","color":"#CCCCCC","lineHeight":1.35}},{"type":"kicker","x":96,"y":280,"width":600,"height":30,"props":{"text":"KICKER","fontSize":24,"fontFamily":"monospace","color":"#BE4D2E","letterSpacing":4,"textTransform":"uppercase"}},{"type":"handle","x":96,"y":1220,"width":400,"height":30,"props":{"text":"@seuhandle","position":"bottom-left","fontFamily":"monospace","color":"#888888"}}]},{"type":"content","background":"#1B1714","elements":[{"type":"heading","x":96,"y":100,"width":880,"height":120,"props":{"text":"Título","fontSize":72,"fontFamily":"Anton","color":"#FFFFFF","fontWeight":800,"letterSpacing":-1,"textTransform":"none"}},{"type":"body","x":96,"y":280,"width":880,"height":800,"props":{"text":"Conteúdo aqui","fontSize":36,"fontFamily":"Inter","color":"#CCCCCC","lineHeight":1.5,"maxWidth":880}}]},{"type":"list","background":"#1B1714","elements":[{"type":"heading","x":96,"y":100,"width":880,"height":100,"props":{"text":"Lista","fontSize":72,"fontFamily":"Anton","color":"#FFFFFF","fontWeight":800,"letterSpacing":-1,"textTransform":"none"}},{"type":"body","x":96,"y":260,"width":880,"height":800,"props":{"text":"→ Item 1\\n→ Item 2\\n→ Item 3","fontSize":38,"fontFamily":"Inter","color":"#CCCCCC","lineHeight":1.6,"maxWidth":880}}]},{"type":"stat","background":"#1B1714","elements":[{"type":"stat","x":96,"y":350,"width":880,"height":250,"props":{"value":"99%","fontSize":240,"fontFamily":"Anton","color":"#BE4D2E"}},{"type":"subheading","x":96,"y":650,"width":880,"height":60,"props":{"text":"Descrição","fontSize":40,"fontFamily":"Inter","color":"#CCCCCC","lineHeight":1.3}}]},{"type":"cta","background":"#BE4D2E","elements":[{"type":"heading","x":96,"y":400,"width":880,"height":200,"props":{"text":"CTA","fontSize":100,"fontFamily":"Anton","color":"#FFFFFF","fontWeight":800,"letterSpacing":-2,"textTransform":"none"}},{"type":"subheading","x":96,"y":620,"width":800,"height":60,"props":{"text":"Ação desejada","fontSize":36,"fontFamily":"Inter","color":"#FFFFFF","lineHeight":1.35}}]}]}

REGRAS CRÍTICAS:
- Cada slide: 2-5 elementos com x, y, width, height, type, props
- Fundo escuro (ex: #1B1714, #0F0F1A, #1A1A2E) — NUNCA fundo branco
- Texto em cores claras (#FFFFFF, #CCCCCC) — NUNCA texto escuro em fundo claro
- Cores hex sempre com #
- heading: fontSize 72-120, fontFamily "Anton", color "#FFFFFF"
- subheading: fontSize 36-48, fontFamily "Inter", color "#CCCCCC"
- body: fontSize 32-40, fontFamily "Inter", color "#CCCCCC"
- kicker: fontSize 20-28, fontFamily "monospace", color "#BE4D2E"
- stat: fontSize 180-300, fontFamily "Anton", color "#BE4D2E"
- quote: fontSize 56-72, fontFamily "Georgia", color "#FFFFFF", fontStyle "italic"
- ${aiSlideCount} slides: cover, content, content, list, stat, quote, content, cta
- Sempre comece com cover e termine com cta
- Estilo visual: ${aiStyle === "dark-modern" ? "fundo escuro, tipografia bold, cores vibrantes" : aiStyle === "minimal-clean" ? "fundo branco/cinza, tipografia limpa, espaçamento generoso" : aiStyle === "bold-colorful" ? "fundo colorido, contrastes fortes, visual chamativo" : aiStyle === "corporate" ? "fundo neutro, cores sóbrias, visual profissional" : aiStyle === "editorial" ? "fundo cream/bege, serifadas, visual editorial" : aiStyle === "neon-glow" ? "fundo escuro com efeitos neon, cores luminosas, visual futurista" : "fundo escuro, tipografia bold, cores vibrantes"}
- Modo carrossel: ${aiCarouselMode === "continuous" ? "CADA slide deve ter bordas visuais e o conteúdo deve FLUIR de um slide para o outro (sem quebras abruptas). Use transições suaves no conteúdo." : "Cada slide é INDEPENDENTE com conteúdo autocontido, começo e fim claros."}
- NUNCA inclua markdown (\`\`\`json) na resposta, SOMENTE JSON puro`,
            },
            {
              role: "user",
              content: `Crie um carrossel Instagram sobre: ${aiPrompt}`,
            },
          ],
          model: "google/gemini-2.5-flash",
        }),
      });

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || "";

      // Extract JSON from response (may be wrapped in markdown)
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonStr);

      if (parsed.slides && Array.isArray(parsed.slides)) {
        const ts = Date.now();
        const newSlides: Slide[] = parsed.slides.map((s: any, i: number) => {
          const bg = isValidHex(s.background) ? s.background : "#1B1714";
          return {
            id: `slide_ai_${ts}_${i}`,
            type: s.type || "content",
            background: bg,
            elements: buildElements(s.elements || [], bg, i, ts),
          };
        });

        // First, show slides without images
        setSlides(newSlides);

        // Generate background images for each slide
        if (aiWithImages) {
          const slideCount = newSlides.length;

          if (aiPanoramic && slideCount > 1) {
            // PANORAMIC MODE: Generate ONE big image, slice into N pieces
            const isPortrait = canvasFormat.width < canvasFormat.height;
            const panoSize = isPortrait
              ? { width: canvasFormat.width, height: canvasFormat.height * slideCount }
              : { width: canvasFormat.width * slideCount, height: canvasFormat.height };

            setAiStatus(`Gerando imagem panorâmica ${panoSize.width}x${panoSize.height}...`);
            console.log(`[Panoramic] Generating ${panoSize.width}x${panoSize.height} for ${slideCount} slides`);

            const allTexts = newSlides.flatMap((s) =>
              s.elements
                .map((el) => ("text" in el.props ? el.props.text : "value" in el.props ? el.props.value : ""))
                .filter(Boolean)
            );
            const imgPrompt = `seamless panoramic composition, ${allTexts.join(", ")}, professional photography, high quality, ${aiPrompt}`;

            const imgResp = await fetch("/api/images/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: imgPrompt.slice(0, 500),
                model: aiImageModel,
                imageSize: panoSize,
              }),
            });

            const imgData = await imgResp.json();
            if (!imgData.ok || !imgData.image?.url) {
              console.error(`[Panoramic] Generation failed:`, imgData.error);
              setAiStatus("Falha ao gerar imagem panorâmica");
            } else {
              setAiStatus(`Recortando em ${slideCount} fatias...`);
              console.log(`[Panoramic] Image generated, slicing into ${slideCount} pieces`);

              // Slice the panoramic image client-side using Canvas API
              const slices = await slicePanoramicImage(imgData.image.url, slideCount, isPortrait);

              const slidesWithImages = newSlides.map((s, i) =>
                slices[i] ? { ...s, backgroundImage: slices[i] } : s
              );

              console.log(`[Panoramic] Done: ${slices.filter(Boolean).length}/${slideCount} slices`);
              setSlides(slidesWithImages);
              setAiStatus("");
            }
          } else {
            // DISCRETE MODE: Generate one image per slide
            const imgSize = { width: canvasFormat.width, height: canvasFormat.height };
            const imageUrls: (string | null)[] = [];

            for (let i = 0; i < slideCount; i++) {
              try {
                const slideTexts = newSlides[i].elements
                  .map((el) => {
                    if ("text" in el.props) return el.props.text;
                    if ("value" in el.props) return el.props.value;
                    return "";
                  })
                  .filter(Boolean)
                  .join(" ");

                const imgPrompt = `${slideTexts}, professional photography, high quality, ${aiPrompt}`;

                setAiStatus(`Gerando imagem ${i + 1}/${slideCount}...`);
                console.log(`[AI Images] Slide ${i + 1}/${slideCount}: model=${aiImageModel}, size=${imgSize.width}x${imgSize.height}`);

                const imgResp = await fetch("/api/images/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    prompt: imgPrompt.slice(0, 500),
                    model: aiImageModel,
                    imageSize: imgSize,
                  }),
                });

                const imgData = await imgResp.json();
                console.log(`[AI Images] Slide ${i + 1} result:`, imgData.ok ? `OK (${imgData.image?.url?.length} chars)` : imgData.error);

                imageUrls.push(imgData.ok && imgData.image?.url ? imgData.image.url : null);
              } catch (err) {
                console.error(`[AI Images] Slide ${i + 1} error:`, err);
                imageUrls.push(null);
              }
            }

            const slidesWithImages = newSlides.map((s, i) =>
              imageUrls[i] ? { ...s, backgroundImage: imageUrls[i]! } : s
            );

            console.log(`[AI Images] Done: ${imageUrls.filter(Boolean).length}/${slideCount} images generated`);
            setSlides(slidesWithImages);
            setAiStatus("");
          }
        }

        setShowAiModal(false);
        setAiPrompt("");
      }
    } catch (err) {
      console.error("[AI Generation]", err);
    } finally {
      setAiLoading(false);
      setAiStatus("");
    }
  };

  const handleRegenerateSlide = async (slideIndex: number) => {
    const slide = slides[slideIndex];
    if (!slide) return;

    setAiStatus(`Regenerando imagem do slide ${slideIndex + 1}...`);

    try {
      const imgSize = { width: canvasFormat.width, height: canvasFormat.height };
      const slideTexts = slide.elements
        .map((el) => {
          if ("text" in el.props) return el.props.text;
          if ("value" in el.props) return el.props.value;
          return "";
        })
        .filter(Boolean)
        .join(" ");

      const contextPrompt = aiPrompt.trim() || slideTexts;
      const imgPrompt = `${slideTexts}, professional photography, high quality, ${contextPrompt}`;

      const imgResp = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imgPrompt.slice(0, 500),
          model: aiImageModel,
          imageSize: imgSize,
        }),
      });

      const imgData = await imgResp.json();
      if (imgData.ok && imgData.image?.url) {
        updateSlide(slideIndex, { backgroundImage: imgData.image.url });
        console.log(`[Regenerate] Slide ${slideIndex + 1}: OK`);
      } else {
        console.error(`[Regenerate] Slide ${slideIndex + 1}: ${imgData.error}`);
      }
    } catch (err) {
      console.error(`[Regenerate] Slide ${slideIndex + 1} error:`, err);
    } finally {
      setAiStatus("");
    }
  };

  const handleSaveProject = () => {
    const name = prompt("Nome do projeto:");
    if (name === null) return;
    const project = saveProject(name);
    if (project) {
      console.log(`[Save] Project "${project.name}" saved`);
    }
  };

  const handleOpenProjects = () => {
    setProjectList(listProjects());
    setShowProjects(true);
  };

  const handleLoadProject = (id: string) => {
    loadProject(id);
    setShowProjects(false);
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm("Excluir este projeto?")) {
      deleteProject(id);
      setProjectList(listProjects());
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-zinc-950 text-zinc-100">
      <header className="flex items-center gap-1.5 px-2 py-1 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm shrink-0">
        <span className="font-bold text-[11px] text-emerald-400 whitespace-nowrap">EDITOR</span>
        <FormatPicker />
        <div className="flex-1" />
        <button
          onClick={handleSaveProject}
          className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-md text-white transition-colors whitespace-nowrap"
        >
          Salvar
        </button>
        <button
          onClick={handleOpenProjects}
          className="px-2 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors whitespace-nowrap"
        >
          Projetos
        </button>
        <button
          onClick={() => {
            if (window.confirm("Criar novo projeto? Os slides atuais serão perdidos.")) {
              setSlides([createCoverSlide()]);
            }
          }}
          className="px-2 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors whitespace-nowrap"
        >
          Novo
        </button>
        <button
          onClick={() => setShowAiModal(true)}
          className="px-2 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-md text-white transition-colors whitespace-nowrap"
        >
          IA
        </button>
        <button
          onClick={() => setShowThemePicker(true)}
          className="px-2 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors whitespace-nowrap"
        >
          Tema
        </button>
        <button className="px-2 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors whitespace-nowrap">
          PNG
        </button>
      </header>
      <div className="flex flex-1 min-h-0">
        <LayerPanel onRegenerateSlide={handleRegenerateSlide} />
        <div className="flex-1 flex flex-col min-w-0">
          <ElementToolbar />
          <SlideCanvas />
        </div>
        <PropertyPanel />
      </div>
      <SlideTimeline onRegenerateSlide={handleRegenerateSlide} />
      <ThemePicker isOpen={showThemePicker} onClose={() => setShowThemePicker(false)} />

      {/* Projects Modal */}
      {showProjects && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-[480px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-zinc-100">Meus Projetos</h2>
              <button onClick={() => setShowProjects(false)} className="text-zinc-500 hover:text-zinc-300 text-lg">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {projectList.length === 0 ? (
                <div className="text-center py-10 text-zinc-600 text-sm">
                  Nenhum projeto salvo ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  {projectList.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors">
                      {p.thumbnail ? (
                        <img src={p.thumbnail} className="w-10 h-12 rounded object-cover shrink-0" alt="" />
                      ) : (
                        <div className="w-10 h-12 rounded bg-zinc-700 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-zinc-200 truncate">{p.name}</div>
                        <div className="text-[10px] text-zinc-500">
                          {p.slides.length} slides · {new Date(p.savedAt).toLocaleDateString("pt-BR")} {new Date(p.savedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadProject(p.id)}
                        className="px-3 py-1.5 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-md text-white transition-colors"
                      >
                        Abrir
                      </button>
                      <button
                        onClick={() => handleDeleteProject(p.id)}
                        className="px-2 py-1.5 text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-[560px] max-h-[85vh] overflow-y-auto">
            <div className="p-5">
              <h2 className="text-base font-bold text-zinc-100 mb-1">Gerar com IA</h2>
              <p className="text-[11px] text-zinc-500 mb-4">
                Configure e descreva o tema para gerar o carrossel.
              </p>

              {/* Tema */}
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Ex: 5 dicas de produtividade para empreendedores"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-zinc-100 placeholder-zinc-500 min-h-[70px] resize-y mb-4"
              />

              {/* Row 1: Slides + Estilo */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Nº de Slides
                  </label>
                  <div className="flex gap-1">
                    {[3, 5, 7, 10].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAiSlideCount(n)}
                        className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md border transition-colors ${
                          aiSlideCount === n
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Estilo Visual
                  </label>
                  <select
                    value={aiStyle}
                    onChange={(e) => setAiStyle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5 text-[11px] text-zinc-100"
                  >
                    <option value="dark-modern">Dark Modern</option>
                    <option value="minimal-clean">Minimal Clean</option>
                    <option value="bold-colorful">Bold Colorful</option>
                    <option value="corporate">Corporativo</option>
                    <option value="editorial">Editorial</option>
                    <option value="neon-glow">Neon Glow</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Modo Carrossel + Modelo Imagem */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Modo Carrossel
                  </label>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAiCarouselMode("discrete")}
                      className={`flex-1 py-1.5 text-[10px] font-semibold rounded-md border transition-colors ${
                        aiCarouselMode === "discrete"
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      Independente
                    </button>
                    <button
                      onClick={() => setAiCarouselMode("continuous")}
                      className={`flex-1 py-1.5 text-[10px] font-semibold rounded-md border transition-colors ${
                        aiCarouselMode === "continuous"
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      Contínuo
                    </button>
                  </div>
                </div>
                {aiCarouselMode === "continuous" && aiWithImages && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Modo de Imagem
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={aiPanoramic}
                          onChange={(e) => setAiPanoramic(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                      </label>
                      <span className="text-[11px] text-zinc-400">
                        {aiPanoramic ? "Panorâmico (1 imagem → N fatias)" : "Separada (1 imagem por slide)"}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Imagens de Fundo
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aiWithImages}
                        onChange={(e) => setAiWithImages(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-700 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600" />
                    </label>
                    <span className="text-[11px] text-zinc-400">
                      {aiWithImages ? "Ativadas" : "Desativadas"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 3: Modelo de Imagem (só quando imagens ativadas) */}
              {aiWithImages && (
                <div className="mb-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                    Modelo de Imagem
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "fal-ai/flux/schnell", name: "Flux Schnell", cost: "$0.003/MP", provider: "Fal.ai" },
                      { id: "fal-ai/flux/dev", name: "Flux Dev", cost: "$0.025/MP", provider: "Fal.ai" },
                      { id: "fal-ai/flux-pro/v1.1", name: "Flux Pro", cost: "$0.05/MP", provider: "Fal.ai" },
                      { id: "google/gemini-2.5-flash-image", name: "Nano Banana", cost: "~$0.003/img", provider: "OpenRouter" },
                      { id: "google/gemini-3.1-flash-image", name: "Nano Banana 2", cost: "~$0.005/img", provider: "OpenRouter" },
                      { id: "google/gemini-3-pro-image", name: "Nano Banana Pro", cost: "~$0.015/img", provider: "OpenRouter" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setAiImageModel(m.id)}
                        className={`py-2 px-2 text-[10px] rounded-md border transition-colors text-left ${
                          aiImageModel === m.id
                            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        <div className="font-semibold text-[11px]">{m.name}</div>
                        <div className="text-zinc-500 mt-0.5">{m.cost}</div>
                        <div className="text-zinc-600">{m.provider}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              {aiStatus && (
                <div className="mb-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[11px] text-emerald-400">{aiStatus}</span>
                  </div>
                </div>
              )}

              {/* Cost estimate */}
              {aiWithImages && (
                <div className="mb-4 px-3 py-1.5 bg-zinc-800/50 rounded-lg">
                  <span className="text-[10px] text-zinc-500">
                    Custo estimado: ~${(() => {
                      const costs: Record<string, number> = {
                        "fal-ai/flux/schnell": 0.004,
                        "fal-ai/flux/dev": 0.037,
                        "fal-ai/flux-pro/v1.1": 0.073,
                        "google/gemini-2.5-flash-image": 0.003,
                        "google/gemini-3.1-flash-image": 0.005,
                        "google/gemini-3-pro-image": 0.015,
                      };
                      const imgCount = aiPanoramic ? 1 : aiSlideCount;
                      return (imgCount * (costs[aiImageModel] || 0.01)).toFixed(3);
                    })()} ({aiPanoramic ? "1 panorâmica" : `${aiSlideCount} imagens`})
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowAiModal(false); setAiStatus(""); }}
                  className="px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
                  disabled={aiLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGenerateAI}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white transition-colors disabled:opacity-50"
                >
                  {aiLoading ? "Gerando..." : "Gerar Slides"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
