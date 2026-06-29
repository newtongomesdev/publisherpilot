"use client";

import { SlideElement } from "@/lib/slide-editor/types";

type Props = {
  element: SlideElement;
  isSelected: boolean;
  onSelect: () => void;
  slideIndex: number;
};

function renderElementContent(el: SlideElement) {
  switch (el.type) {
    case "heading":
      return (
        <div
          style={{
            fontSize: el.props.fontSize,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
            fontWeight: el.props.fontWeight,
            letterSpacing: el.props.letterSpacing,
            textTransform: el.props.textTransform,
            lineHeight: 1,
            textShadow: (el.props as any).textShadow || undefined,
          }}
        >
          {el.props.text}
        </div>
      );
    case "subheading":
      return (
        <div
          style={{
            fontSize: el.props.fontSize,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
            lineHeight: el.props.lineHeight,
            textShadow: (el.props as any).textShadow || undefined,
          }}
        >
          {el.props.text}
        </div>
      );
    case "body":
      return (
        <div
          style={{
            fontSize: el.props.fontSize,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
            lineHeight: el.props.lineHeight,
            whiteSpace: "pre-wrap",
            textShadow: (el.props as any).textShadow || undefined,
          }}
        >
          {el.props.text}
        </div>
      );
    case "kicker":
      return (
        <div
          style={{
            fontSize: el.props.fontSize,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
            letterSpacing: el.props.letterSpacing,
            textTransform: el.props.textTransform,
            textShadow: (el.props as any).textShadow || undefined,
          }}
        >
          {el.props.text}
        </div>
      );
    case "stat":
      return (
        <div
          style={{
            fontSize: el.props.fontSize,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
            lineHeight: 0.9,
            textShadow: (el.props as any).textShadow || undefined,
          }}
        >
          {el.props.value}
        </div>
      );
    case "quote":
      return (
        <div>
          <div
            style={{
              fontSize: el.props.fontSize,
              fontFamily: el.props.fontFamily,
              color: el.props.color,
              fontStyle: el.props.fontStyle,
              lineHeight: 1.15,
              textShadow: (el.props as any).textShadow || undefined,
            }}
          >
            &ldquo;{el.props.text}&rdquo;
          </div>
          {el.props.author && (
            <div
              style={{
                fontSize: 30,
                fontFamily: "monospace",
                color: "#6E6357",
                marginTop: 20,
              }}
            >
              — {el.props.author}
            </div>
          )}
        </div>
      );
    case "image":
      return el.props.src ? (
        <img
          src={el.props.src}
          className="w-full h-full"
          style={{
            objectFit: el.props.objectFit,
            borderRadius: el.props.borderRadius,
          }}
          alt=""
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-zinc-800/50 border-2 border-dashed border-zinc-600 rounded-lg text-zinc-500 text-sm">
          Clique para adicionar imagem
        </div>
      );
    case "shape":
      return (
        <div
          className="w-full h-full"
          style={{
            background: el.props.color,
            borderRadius:
              el.props.shapeType === "circle" ? "50%" : el.props.borderRadius,
            opacity: el.props.opacity,
          }}
        />
      );
    case "icon":
      return <div style={{ fontSize: el.props.size }}>{el.props.emoji}</div>;
    case "handle":
      return (
        <div
          style={{
            fontSize: 30,
            fontFamily: el.props.fontFamily,
            color: el.props.color,
          }}
        >
          {el.props.text}
        </div>
      );
    case "overlay":
      return (
        <div
          className="w-full h-full"
          style={{
            background:
              el.props.overlayType === "glass"
                ? `rgba(255,255,255,${el.props.intensity * 0.1})`
                : el.props.overlayType === "gradient"
                ? `linear-gradient(180deg, rgba(0,0,0,${el.props.intensity * 0.15}), rgba(0,0,0,${el.props.intensity * 0.6}))`
                : `blur(${el.props.intensity * 10}px)`,
            opacity: el.props.opacity,
            backdropFilter: el.props.overlayType === "blur" ? `blur(${el.props.intensity * 10}px)` : undefined,
          }}
        />
      );
    case "logo":
      return el.props.src ? (
        <img
          src={el.props.src}
          style={{ width: el.props.width }}
          alt="Logo"
        />
      ) : null;
    default:
      return <div className="text-xs text-zinc-500">Elemento</div>;
  }
}

export function ElementWrapper({
  element,
  isSelected,
  onSelect,
}: Props) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`absolute cursor-move ${
        isSelected
          ? "ring-2 ring-emerald-500 ring-offset-2"
          : ""
      }`}
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
    >
      {renderElementContent(element)}
    </div>
  );
}
