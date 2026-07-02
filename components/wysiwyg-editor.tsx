"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import { Node, mergeAttributes } from "@tiptap/core";
import { Sparkles, Search, Link as LinkIcon, Loader2, X } from "lucide-react";

// ─── Proxy helper ────────────────────────────────────────────
function proxyUrl(url: string): string {
  if (!url || url.startsWith("/api/") || url.startsWith("data:")) return url;
  try {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return url;
  } catch {
    return url;
  }
  return `/api/images/proxy?url=${encodeURIComponent(url)}`;
}

// ─── Resizable Image Extension ─────────────────────────────────

type SearchResult = {
  src: string;
  thumbnail: string;
  title: string;
  source: string;
  pageUrl: string;
};

function ResizableImageComponent({
  node,
  updateAttributes,
  selected,
}: {
  node: { attrs: Record<string, string | number> };
  updateAttributes: (attrs: Record<string, string | number>) => void;
  selected: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState<"left" | "right" | null>(null);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  function handleMouseDown(e: React.MouseEvent, side: "left" | "right") {
    e.preventDefault();
    e.stopPropagation();
    setDragging(side);
    startX.current = e.clientX;
    startWidth.current = imgRef.current?.width ?? 300;
  }

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: MouseEvent) {
      const dx = e.clientX - startX.current;
      const newWidth = dragging === "left"
        ? Math.max(80, startWidth.current - dx)
        : Math.max(80, startWidth.current + dx);
      if (imgRef.current) {
        imgRef.current.style.width = `${newWidth}px`;
      }
    }

    function onUp() {
      setDragging(null);
      if (imgRef.current) {
        updateAttributes({ width: imgRef.current.style.width });
      }
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, updateAttributes]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch(`/api/images/search?q=${encodeURIComponent(searchQuery)}&limit=15`);
      const data = await resp.json();
      if (data.ok) setSearchResults(data.results);
    } catch {
      // silently fail
    } finally {
      setSearching(false);
    }
  }

  return (
    <NodeViewWrapper
      ref={containerRef}
      className="relative my-3 group"
      draggable={true}
      data-drag-handle=""
    >
      <div
        className={`relative inline-block max-w-full rounded-lg overflow-hidden ${
          selected ? "ring-2 ring-emerald-500" : "ring-1 ring-zinc-700 hover:ring-zinc-500"
        }`}
      >
        <img
          ref={imgRef}
          src={proxyUrl(node.attrs.src as string)}
          alt={(node.attrs.alt as string) || ""}
          width={node.attrs.width as string}
          className="block max-w-full h-auto pointer-events-none"
          style={{ width: (node.attrs.width as string) || "auto" }}
          contentEditable={false}
        />

        {/* Resize handles */}
        {selected && (
          <>
            <div
              className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500 cursor-ew-resize opacity-80 hover:opacity-100"
              onMouseDown={(e) => handleMouseDown(e, "left")}
            />
            <div
              className="absolute right-0 top-0 bottom-0 w-2 bg-emerald-500 cursor-ew-resize opacity-80 hover:opacity-100"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
          </>
        )}
      </div>

      {/* Caption + actions */}
      {selected && (
        <div className="mt-2 flex flex-col items-center gap-2">
          <input
            type="text"
            placeholder="Adicionar legenda..."
            value={(node.attrs.alt as string) || ""}
            onChange={(e) => updateAttributes({ alt: e.target.value })}
            className="w-full bg-transparent text-center text-sm text-zinc-400 outline-none placeholder:text-zinc-600"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                const url = prompt("URL da nova imagem:", node.attrs.src as string);
                if (url) updateAttributes({ src: proxyUrl(url) });
              }}
              className="text-xs px-3 py-1 rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
            >
              Trocar imagem
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowSearch(!showSearch);
              }}
              className="text-xs px-3 py-1 rounded-full bg-emerald-700 text-white hover:bg-emerald-600 transition-colors"
            >
              Buscar imagem
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                updateAttributes({ width: "100%" });
              }}
              className="text-xs px-3 py-1 rounded-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-colors"
            >
              Largura total
            </button>
          </div>
        </div>
      )}

      {/* Search panel */}
      {selected && showSearch && (
        <div className="mt-2 p-3 rounded-xl border border-zinc-700 bg-zinc-950">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Buscar imagens no SearXNG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 outline-none focus:border-emerald-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={searching}
              className="px-4 py-1.5 text-sm rounded-lg bg-emerald-500 text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {searching ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="grid grid-cols-5 gap-2 max-h-[360px] overflow-y-auto">
              {searchResults.map((result, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    updateAttributes({ src: result.src });
                    setShowSearch(false);
                    setSearchResults([]);
                  }}
                  className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-emerald-500 transition-colors group/img"
                  title={result.title}
                >
                  <img
                    src={result.thumbnail}
                    alt={result.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-xs text-white font-medium">Usar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          {searching && (
            <div className="text-center py-4 text-sm text-zinc-500">Buscando imagens...</div>
          )}
          {!searching && searchResults.length === 0 && searchQuery && (
            <div className="text-center py-4 text-sm text-zinc-500">Nenhuma imagem encontrada</div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}

const ResizableImage = Node.create({
  name: "resizableImage",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: null },
      width: { default: "100%" },
    };
  },

  parseHTML() {
    return [
      { tag: 'img[data-resizable]' },
      { tag: 'figure img', getAttrs: (element) => {
        if (typeof element === "string") return false;
        const img = element as HTMLImageElement;
        const figure = img.closest("figure");
        const caption = figure?.querySelector("figcaption")?.textContent ?? "";
        return { src: img.getAttribute("src"), alt: caption || img.getAttribute("alt") || "" };
      }},
      { tag: 'img[src]', getAttrs: (element) => {
        if (typeof element === "string") return false;
        const el = element as HTMLElement;
        if (el.closest("figure")) return false;
        return {};
      }},
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { "data-resizable": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; width?: string }) =>
        ({ commands }: any) => {
          return commands.insertContent({
            type: this.name,
            attrs: { src: options.src, alt: options.alt ?? "", width: options.width ?? "100%" },
          });
        },
    } as any;
  },
});

// ─── Toolbar ─────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-emerald-500/20 text-emerald-400"
          : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Proxy all images in HTML string ────────────────────────

function proxyHtmlImages(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  for (const img of Array.from(div.querySelectorAll("img"))) {
    const src = img.getAttribute("src");
    if (src) img.setAttribute("src", proxyUrl(src));
  }
  return div.innerHTML;
}

// ─── Main Component ─────────────────────────────────────────

type WysiwygEditorProps = {
  initialHtml: string;
  onSave: (html: string, markdown: string) => void;
  onCancel: () => void;
};

import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

export function WysiwygEditor({ initialHtml, onSave, onCancel }: WysiwygEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState<"search" | "ai" | "url">("search");
  
  // Search tab states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ src: string; thumbnail: string; title: string }>>([]);
  const [searching, setSearching] = useState(false);
  
  // AI tab states
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("fal-ai/flux/schnell");
  const [aiAspectRatio, setAiAspectRatio] = useState("1:1");
  const [generating, setGenerating] = useState(false);
  const [aiModels, setAiModels] = useState<Array<{ modelId: string; name: string }>>([
    { modelId: "fal-ai/flux/schnell", name: "Flux Schnell (Rápido)" },
    { modelId: "fal-ai/flux/dev", name: "Flux Dev (Alta Qualidade)" },
    { modelId: "fal-ai/flux-realism", name: "Flux Realism (Realista)" },
    { modelId: "fal-ai/stable-diffusion-v3-medium", name: "SD3 Medium" },
  ]);

  // URL tab states
  const [imageUrl, setImageUrl] = useState("");

  // Load models from API
  useEffect(() => {
    if (showImageDialog) {
      fetch("/api/images/fal/models")
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && data.models) {
            setAiModels(data.models);
          }
        })
        .catch((err) => console.error("Error fetching Fal.ai models in editor:", err));
    }
  }, [showImageDialog]);

  const handleSearxngSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const resp = await fetch(`/api/images/search?q=${encodeURIComponent(searchQuery)}&limit=15`);
      const data = await resp.json();
      if (data.ok) {
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateAiImage = async () => {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt.trim(),
          model: aiModel,
          aspectRatio: aiAspectRatio,
        }),
      });
      const data = await response.json();
      if (response.ok && data.ok && data.image?.url) {
        if (editor) {
          editor.chain().focus().insertContent({
            type: "resizableImage",
            attrs: { src: data.image.url, alt: aiPrompt, width: "100%" },
          }).run();
        }
        setShowImageDialog(false);
        setAiPrompt("");
      } else {
        alert(data.error || "Falha ao gerar imagem.");
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao conectar com o gerador de imagem.");
    } finally {
      setGenerating(false);
    }
  };

  const handleInsertUrl = () => {
    if (imageUrl && editor) {
      editor.chain().focus().insertContent({
        type: "resizableImage",
        attrs: { src: imageUrl, alt: "", width: "100%" },
      }).run();
      setShowImageDialog(false);
      setImageUrl("");
    }
  };

  // Proxy all external image URLs in the initial HTML
  const proxiedHtml = proxyHtmlImages(initialHtml);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ResizableImage,
      Placeholder.configure({ placeholder: "Comece a editar..." }),
      Dropcursor.configure({ color: "#22c55e", width: 2 }),
      Gapcursor,
    ],
    content: proxiedHtml || "<p></p>",
    editorProps: {
      attributes: {
        class: "tiptap max-w-none min-h-[400px] px-4 py-3 text-zinc-100 focus:outline-none",
      },
    },
  });

  const handleSave = useCallback(() => {
    if (!editor) return;
    setIsSaving(true);
    try {
      // Convert resizable images back to regular images for HTML
      const tempEditor = editor;
      const json = tempEditor.getJSON();
      const html = jsonToCleanHtml(json);
      const markdown = turndownService.turndown(html);
      onSave(html, markdown);
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave]);

  const addImage = useCallback(() => {
    setShowImageDialog(true);
  }, []);

  if (!editor) return null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="Negrito (Ctrl+B)"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="Itálico (Ctrl+I)"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="Tachado"
        >
          <s>S</s>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive("code")}
          title="Código inline"
        >
          {"</>"}
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive("heading", { level: 1 })}
          title="Título 1"
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="Título 2"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="Título 3"
        >
          H3
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="Lista com marcadores"
        >
          • Lista
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="Lista numerada"
        >
          1. Lista
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="Citação"
        >
          &ldquo; Citação
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          active={editor.isActive("codeBlock")}
          title="Bloco de código"
        >
          {"{ }"} Código
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton onClick={addImage} title="Inserir imagem">
          🖼 Imagem
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
        >
          ─ Linha
        </ToolbarButton>

        <div className="mx-1 h-6 w-px bg-zinc-700" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          title="Desfazer (Ctrl+Z)"
        >
          ↩
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          title="Refazer (Ctrl+Shift+Z)"
        >
          ↪
        </ToolbarButton>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <EditorContent editor={editor} />
      </div>

      {/* Help */}
      <p className="text-xs text-zinc-600">
        Clique na imagem para selecionar • Arraste pelas bordas verdes para redimensionar • Use / para inserir blocos
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-full bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar alterações"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-zinc-700 px-6 py-2 font-medium text-zinc-300 hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>

      {/* Image Insertion Dialog (Modal) */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 w-[540px] max-w-full text-zinc-100 flex flex-col gap-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowImageDialog(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Inserir Imagem
            </h3>

            {/* Tab selector */}
            <div className="flex border-b border-zinc-800/80">
              <button
                onClick={() => setDialogTab("search")}
                className={`flex-1 py-2 text-sm font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  dialogTab === "search" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Search className="h-4 w-4" /> Buscar (SearXNG)
              </button>
              <button
                onClick={() => setDialogTab("ai")}
                className={`flex-1 py-2 text-sm font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  dialogTab === "ai" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Sparkles className="h-4 w-4" /> Gerar com IA
              </button>
              <button
                onClick={() => setDialogTab("url")}
                className={`flex-1 py-2 text-sm font-semibold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                  dialogTab === "url" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <LinkIcon className="h-4 w-4" /> Inserir URL
              </button>
            </div>

            {/* Tab content */}
            <div className="min-h-[280px]">
              {dialogTab === "search" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Buscar imagens no SearXNG..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearxngSearch()}
                      className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleSearxngSearch}
                      disabled={searching}
                      className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-400 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {searching ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Buscando
                        </>
                      ) : (
                        "Buscar"
                      )}
                    </button>
                  </div>

                  {/* Results grid */}
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1">
                      {searchResults.map((result, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (editor) {
                              editor.chain().focus().insertContent({
                                type: "resizableImage",
                                attrs: { src: result.src, alt: result.title, width: "100%" },
                              }).run();
                            }
                            setShowImageDialog(false);
                          }}
                          className="relative aspect-video rounded-xl overflow-hidden border border-zinc-800 hover:border-emerald-500 transition group/img"
                        >
                          <img
                            src={result.thumbnail}
                            alt={result.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center">
                            <span className="text-xs text-white font-semibold">Inserir</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    !searching && (
                      <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                        <Search className="h-8 w-8 text-zinc-700" />
                        <p className="text-sm">Digite uma palavra-chave para buscar</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {dialogTab === "ai" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Prompt da Imagem</label>
                    <textarea
                      placeholder="Descreva a imagem que deseja gerar..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full h-20 p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none resize-none placeholder:text-zinc-650 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Modelo de IA</label>
                      <select
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none focus:border-emerald-500"
                      >
                        {aiModels.map((m) => (
                          <option key={m.modelId} value={m.modelId}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-400">Proporção (Aspect Ratio)</label>
                      <select
                        value={aiAspectRatio}
                        onChange={(e) => setAiAspectRatio(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none focus:border-emerald-500"
                      >
                        <option value="1:1">1:1 Quadrado</option>
                        <option value="16:9">16:9 Paisagem</option>
                        <option value="9:16">9:16 Retrato</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerateAiImage}
                    disabled={generating || !aiPrompt.trim()}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm hover:from-emerald-400 hover:to-teal-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Gerando imagem com IA...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" /> Gerar Imagem
                      </>
                    )}
                  </button>
                </div>
              )}

              {dialogTab === "url" && (
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-400">Endereço da Imagem (URL)</label>
                    <input
                      type="url"
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm outline-none focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={handleInsertUrl}
                    disabled={!imageUrl.trim()}
                    className="w-full py-2.5 rounded-full bg-zinc-800 border border-zinc-700 hover:bg-zinc-750 text-zinc-200 hover:text-white font-semibold text-sm transition-all"
                  >
                    Inserir Imagem
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

// Strip proxy prefix to store original URL
function unproxyUrl(url: string): string {
  if (!url) return url;
  try {
    if (url.startsWith("/api/images/proxy?url=")) {
      return decodeURIComponent(url.slice("/api/images/proxy?url=".length));
    }
  } catch {}
  return url;
}

function jsonToCleanHtml(json: { content?: Array<Record<string, unknown>> }): string {
  if (!json.content) return "<p></p>";
  return json.content.map((block) => blockToCleanHtml(block)).join("\n");
}

function blockToCleanHtml(block: Record<string, unknown>): string {
  const type = block.type as string;
  const content = (block.content as Array<Record<string, unknown>>) ?? [];
  const attrs = (block.attrs as Record<string, string>) ?? {};

  const inlineText = content.map((c) => {
    const t = (c.text as string) ?? "";
    const marks = (c.marks as Array<Record<string, string>>) ?? [];
    let html = t;
    for (const mark of marks) {
      if (mark.type === "bold") html = `<strong>${html}</strong>`;
      if (mark.type === "italic") html = `<em>${html}</em>`;
      if (mark.type === "strike") html = `<s>${html}</s>`;
      if (mark.type === "code") html = `<code>${html}</code>`;
    }
    return html;
  }).join("");

  switch (type) {
    case "heading": {
      const level = (attrs.level as string) || "2";
      return `<h${level}>${inlineText}</h${level}>`;
    }
    case "bulletList":
      return `<ul>${content.map((c) => `<li>${(c.content as Array<Record<string, unknown>>)?.map((ic) => (ic.text as string) ?? "").join("")}</li>`).join("")}</ul>`;
    case "orderedList":
      return `<ol>${content.map((c) => `<li>${(c.content as Array<Record<string, unknown>>)?.map((ic) => (ic.text as string) ?? "").join("")}</li>`).join("")}</ol>`;
    case "listItem": {
      const inner = (content[0] as Record<string, unknown>) ?? {};
      const innerContent = (inner.content as Array<Record<string, unknown>>) ?? [];
      return `<li>${innerContent.map((ic) => (ic.text as string) ?? "").join("")}</li>`;
    }
    case "blockquote":
      return `<blockquote><p>${inlineText}</p></blockquote>`;
    case "codeBlock":
      return `<pre><code>${content.map((c) => (c.text as string) ?? "").join("")}</code></pre>`;
    case "resizableImage":
      return `<img src="${unproxyUrl(attrs.src || "")}" alt="${attrs.alt || ""}" />`;
    case "horizontalRule":
      return "<hr />";
    case "paragraph":
      return `<p>${inlineText}</p>`;
    default:
      return `<p>${inlineText}</p>`;
  }
}
