"use client";

import { useSlideEditorStore } from "@/lib/slide-editor/store";
import { uid, createCoverSlide } from "@/lib/slide-editor/slide-utils";
import { SlideElement } from "@/lib/slide-editor/types";

const ELEMENTS = [
  { type: "heading" as const, label: "H1", icon: "T" },
  { type: "subheading" as const, label: "H2", icon: "t" },
  { type: "body" as const, label: "Body", icon: "¶" },
  { type: "kicker" as const, label: "Kicker", icon: "K" },
  { type: "stat" as const, label: "Stat", icon: "#" },
  { type: "quote" as const, label: "Quote", icon: "\u201C" },
  { type: "image" as const, label: "Img", icon: "\uD83D\uDDBC" },
  { type: "shape" as const, label: "Shape", icon: "\u25A1" },
  { type: "icon" as const, label: "Icon", icon: "\u2728" },
];

function createElement(type: (typeof ELEMENTS)[number]["type"]): SlideElement {
  const base = { id: uid(), x: 96, y: 400, width: 800, height: 100 };
  switch (type) {
    case "heading":
      return {
        ...base,
        type: "heading",
        props: {
          text: "Novo Título",
          fontSize: 100,
          fontFamily: "Anton",
          color: "#FFFFFF",
          fontWeight: 800,
          letterSpacing: -1,
          textTransform: "none",
        },
      };
    case "subheading":
      return {
        ...base,
        type: "subheading",
        props: {
          text: "Novo subtítulo",
          fontSize: 40,
          fontFamily: "Inter",
          color: "#AAAAAA",
          lineHeight: 1.35,
        },
      };
    case "body":
      return {
        ...base,
        type: "body",
        props: {
          text: "Texto aqui...",
          fontSize: 36,
          fontFamily: "Inter",
          color: "#FFFFFF",
          lineHeight: 1.4,
          maxWidth: 800,
        },
      };
    case "kicker":
      return {
        ...base,
        type: "kicker",
        props: {
          text: "KICKER",
          fontSize: 24,
          fontFamily: "monospace",
          color: "#BE4D2E",
          letterSpacing: 4,
          textTransform: "uppercase",
        },
      };
    case "stat":
      return {
        ...base,
        type: "stat",
        props: {
          value: "0",
          fontSize: 200,
          fontFamily: "Anton",
          color: "#BE4D2E",
        },
      };
    case "quote":
      return {
        ...base,
        type: "quote",
        props: {
          text: "Citação...",
          author: "Autor",
          fontSize: 60,
          fontFamily: "Georgia",
          color: "#FFFFFF",
          fontStyle: "italic",
        },
      };
    case "image":
      return {
        ...base,
        type: "image",
        props: {
          src: "",
          objectFit: "cover",
          borderRadius: 0,
          overlay: "",
          opacity: 1,
        },
      };
    case "shape":
      return {
        ...base,
        type: "shape",
        props: {
          shapeType: "rect",
          color: "#BE4D2E",
          borderRadius: 12,
          opacity: 0.8,
        },
      };
    case "icon":
      return {
        ...base,
        type: "icon",
        props: {
          emoji: "✨",
          size: 64,
          color: "#FFFFFF",
        },
      };
  }
}

export function ElementToolbar() {
  const { activeSlideIndex, addElement, addSlide } = useSlideEditorStore();

  const handleAdd = (type: (typeof ELEMENTS)[number]["type"]) => {
    addElement(activeSlideIndex, createElement(type));
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-b border-zinc-800 bg-zinc-900/50 shrink-0 overflow-x-auto">
      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mr-1 shrink-0">
        Elementos
      </span>
      {ELEMENTS.map((el) => (
        <button
          key={el.type}
          onClick={() => handleAdd(el.type)}
          className="px-1.5 py-0.5 text-[10px] font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition-colors shrink-0"
          title={el.label}
        >
          <span className="mr-0.5">{el.icon}</span>
          {el.label}
        </button>
      ))}
      <div className="flex-1 min-w-2" />
      <button
        onClick={() => addSlide(createCoverSlide())}
        className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors shrink-0"
      >
        + Slide
      </button>
    </div>
  );
}
