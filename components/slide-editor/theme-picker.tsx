"use client";

import { useState } from "react";
import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { DESIGN_SYSTEMS, CATEGORIES, DesignSystemCategory } from "@/lib/design-systems";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function ThemePicker({ isOpen, onClose }: Props) {
  const { setTheme, theme } = useSlideEditorStore();
  const [activeCategory, setActiveCategory] = useState<DesignSystemCategory | "all">("all");
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filtered = DESIGN_SYSTEMS.filter((ds) => {
    const matchCategory = activeCategory === "all" || ds.category === activeCategory;
    const matchSearch = ds.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const handleSelect = (ds: (typeof DESIGN_SYSTEMS)[0]) => {
    setTheme(ds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-[900px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Design Systems</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {DESIGN_SYSTEMS.length} estilos disponíveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-lg text-zinc-300 transition-colors"
          >
            Fechar
          </button>
        </div>

        <div className="px-6 py-3 border-b border-zinc-800">
          <input
            type="text"
            placeholder="Buscar estilo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500"
          />
          <div className="flex gap-1 mt-3 flex-wrap">
            <button
              onClick={() => setActiveCategory("all")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${
                activeCategory === "all"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors ${
                  activeCategory === cat.id
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-4 gap-4">
            {filtered.map((ds) => (
              <button
                key={ds.id}
                onClick={() => handleSelect(ds)}
                className={`group relative rounded-xl border-2 overflow-hidden transition-all ${
                  theme?.id === ds.id
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                    : "border-zinc-800 hover:border-zinc-600"
                }`}
              >
                <div
                  className="aspect-[4/5] p-3 flex flex-col justify-end"
                  style={{ background: ds.colors.background }}
                >
                  <div
                    className="text-[10px] font-bold mb-1"
                    style={{ color: ds.colors.primary }}
                  >
                    Heading
                  </div>
                  <div
                    className="text-[8px] leading-tight"
                    style={{ color: ds.colors.text }}
                  >
                    Subtítulo aqui
                  </div>
                  <div className="flex gap-1 mt-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: ds.colors.primary }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: ds.colors.accent }}
                    />
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: ds.colors.secondary }}
                    />
                  </div>
                </div>
                <div className="bg-zinc-900 px-2 py-1.5">
                  <div className="text-[10px] font-semibold text-zinc-300">
                    {ds.name}
                  </div>
                  <div className="text-[8px] text-zinc-500 capitalize">
                    {ds.category}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
