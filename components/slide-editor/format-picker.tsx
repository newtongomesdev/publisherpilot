"use client";

import { useState } from "react";
import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { CANVAS_FORMATS, CanvasFormat } from "@/lib/slide-editor/types";

export function FormatPicker() {
  const { canvasFormat, setCanvasFormat } = useSlideEditorStore();
  const [isOpen, setIsOpen] = useState(false);
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);

  const categories = [...new Set(CANVAS_FORMATS.map((f) => f.category))];

  const handleSelect = (format: CanvasFormat) => {
    setCanvasFormat(format);
    setIsOpen(false);
  };

  const handleCustom = () => {
    if (customW > 0 && customH > 0) {
      setCanvasFormat({
        id: "custom",
        label: `Personalizado (${customW}×${customH})`,
        width: customW,
        height: customH,
        category: "Genérico",
      });
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 rounded-md border border-zinc-700 transition-colors flex items-center gap-1.5"
      >
        <span className="text-zinc-100">
          {canvasFormat.width}×{canvasFormat.height}
        </span>
        <svg className={`w-2.5 h-2.5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-[320px] max-h-[400px] overflow-hidden">
            <div className="p-3 border-b border-zinc-800">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                Formato da Imagem
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[300px] p-2">
              {categories.map((cat) => (
                <div key={cat} className="mb-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 px-2 py-1">
                    {cat}
                  </div>
                  {CANVAS_FORMATS.filter((f) => f.category === cat && f.id !== "custom").map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleSelect(format)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        canvasFormat.id === format.id
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span>{format.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {format.width}×{format.height}
                      </span>
                    </button>
                  ))}
                </div>
              ))}

              {/* Custom format */}
              <div className="border-t border-zinc-800 mt-1 pt-2 px-2">
                <div className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 mb-2">
                  Personalizado
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={customW}
                    onChange={(e) => setCustomW(Number(e.target.value))}
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 text-center"
                    min={100}
                    max={4000}
                  />
                  <span className="text-zinc-500 text-xs">×</span>
                  <input
                    type="number"
                    value={customH}
                    onChange={(e) => setCustomH(Number(e.target.value))}
                    className="w-20 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 text-center"
                    min={100}
                    max={4000}
                  />
                  <button
                    onClick={handleCustom}
                    className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
