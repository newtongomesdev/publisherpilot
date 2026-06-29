"use client";

import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { SLIDE_TEMPLATES } from "@/lib/slide-editor/slide-utils";

export function SlideTimeline({ onRegenerateSlide }: { onRegenerateSlide?: (index: number) => void }) {
  const { slides, activeSlideIndex, setActiveSlide, addSlide, removeSlide } =
    useSlideEditorStore();

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-zinc-800 bg-zinc-900/80 shrink-0 overflow-x-auto">
      {slides.map((slide, i) => (
        <button
          key={slide.id}
          onClick={() => setActiveSlide(i)}
          className={`relative w-16 h-20 rounded-lg border-2 overflow-hidden shrink-0 transition-all ${
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
          <span className="absolute top-1 left-1.5 text-[9px] font-bold text-white/70 bg-black/40 px-1 rounded z-10">
            {i + 1}
          </span>
          {slides.length > 1 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                removeSlide(i);
              }}
              className="absolute top-1 right-1 text-[9px] font-bold text-white/70 bg-red-500/60 px-1 rounded cursor-pointer hover:bg-red-500 z-10"
            >
              ✕
            </span>
          )}
          {/* Regenerate image button */}
          <span
            onClick={(e) => {
              e.stopPropagation();
              onRegenerateSlide?.(i);
            }}
            className="absolute bottom-0.5 left-0.5 text-[10px] font-bold text-white bg-emerald-600/80 hover:bg-emerald-500 w-5 h-5 flex items-center justify-center rounded cursor-pointer z-10"
            title="Regenerar imagem"
          >
            ↻
          </span>
        </button>
      ))}
      <div className="relative group shrink-0">
        <button className="w-16 h-20 rounded-lg border-2 border-dashed border-zinc-700 hover:border-emerald-500 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors text-lg">
          +
        </button>
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-zinc-800 border border-zinc-700 rounded-lg p-2 shadow-xl z-50 min-w-[140px]">
          {Object.keys(SLIDE_TEMPLATES).map((key) => (
            <button
              key={key}
              onClick={() => addSlide(SLIDE_TEMPLATES[key]())}
              className="block w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 rounded capitalize"
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
