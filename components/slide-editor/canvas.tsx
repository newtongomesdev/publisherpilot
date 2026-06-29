"use client";

import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { ElementWrapper } from "./element-wrapper";

export function SlideCanvas() {
  const { slides, activeSlideIndex, activeElementId, setActiveElement, canvasFormat } =
    useSlideEditorStore();
  const slide = slides[activeSlideIndex];

  // Calculate scale to fit canvas in available viewport area
  // Reserve ~550px wide and ~650px tall for the canvas area
  const availableW = 550;
  const availableH = 650;
  const scaleW = availableW / canvasFormat.width;
  const scaleH = availableH / canvasFormat.height;
  const scale = Math.min(scaleW, scaleH, 1);

  const displayW = Math.round(canvasFormat.width * scale);
  const displayH = Math.round(canvasFormat.height * scale);

  if (!slide) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600">
        <div className="text-center">
          <p className="text-sm mb-2">Adicione um slide para começar</p>
          <p className="text-[10px] text-zinc-700">
            {canvasFormat.width}×{canvasFormat.height}px — {canvasFormat.label}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 flex items-center justify-center overflow-auto p-4 bg-zinc-900/50"
      onClick={() => setActiveElement(null)}
    >
      {/* Outer wrapper: sized to the scaled display dimensions */}
      <div
        style={{
          width: displayW,
          height: displayH,
          position: "relative",
        }}
      >
        {/* Inner canvas: full resolution, scaled down */}
        <div
          style={{
            width: canvasFormat.width,
            height: canvasFormat.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            background: slide.backgroundGradient || slide.background || "#1B1714",
            overflow: "hidden",
            position: "absolute",
            top: 0,
            left: 0,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {slide.backgroundImage && (
            <img
              src={slide.backgroundImage}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
            />
          )}
          {slide.elements.map((el) => (
            <ElementWrapper
              key={el.id}
              element={el}
              isSelected={activeElementId === el.id}
              onSelect={() => setActiveElement(el.id)}
              slideIndex={activeSlideIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
