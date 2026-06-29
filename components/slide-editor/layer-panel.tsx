"use client";

import { useSlideEditorStore } from "@/lib/slide-editor/store";

export function LayerPanel({ onRegenerateSlide }: { onRegenerateSlide?: (index: number) => void }) {
  const { slides, activeSlideIndex, setActiveSlide, removeSlide } = useSlideEditorStore();

  return (
    <div className="w-48 bg-zinc-900 border-r border-zinc-800 overflow-y-auto p-3 shrink-0">
      <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3">
        Slides
      </h3>
      <div className="space-y-2">
        {slides.map((slide, i) => (
          <button
            key={slide.id}
            onClick={() => setActiveSlide(i)}
            className={`w-full aspect-[4/5] rounded-lg border-2 overflow-hidden transition-all relative group ${
              i === activeSlideIndex
                ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
                : "border-zinc-700 hover:border-zinc-500"
            }`}
            style={{ background: slide.background }}
          >
            {slide.backgroundImage && (
              <img
                src={slide.backgroundImage}
                className="absolute inset-0 w-full h-full object-cover"
                alt=""
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/60 font-mono bg-black/20">
              {i + 1}
            </div>
            {/* Action buttons on hover */}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateSlide?.(i);
                }}
                className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-emerald-600/80 hover:bg-emerald-500 rounded cursor-pointer"
                title="Regenerar imagem"
              >
                ↻
              </span>
              {slides.length > 1 && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSlide(i);
                  }}
                  className="w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500/60 hover:bg-red-500 rounded cursor-pointer"
                  title="Excluir slide"
                >
                  ✕
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
