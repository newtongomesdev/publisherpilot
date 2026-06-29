import { Slide } from "./types";

let counter = 0;
export const uid = () => `el_${Date.now()}_${++counter}`;

export function createCoverSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "cover",
    background: "#1B1714",
    elements: [
      {
        type: "kicker", id: uid(), x: 96, y: 300, width: 800, height: 40,
        props: { text: "KICKER", fontSize: 30, fontFamily: "monospace", color: "#BE4D2E", letterSpacing: 5, textTransform: "uppercase" },
      },
      {
        type: "heading", id: uid(), x: 96, y: 380, width: 880, height: 200,
        props: { text: "Título Principal", fontSize: 120, fontFamily: "Anton", color: "#FFFFFF", fontWeight: 800, letterSpacing: -2, textTransform: "none" },
      },
      {
        type: "subheading", id: uid(), x: 96, y: 600, width: 800, height: 60,
        props: { text: "Subtítulo aqui", fontSize: 40, fontFamily: "Inter", color: "#6E6357", lineHeight: 1.35 },
      },
      {
        type: "handle", id: uid(), x: 96, y: 1200, width: 400, height: 30,
        props: { text: "@seuhandle", position: "bottom-left", fontFamily: "monospace", color: "#6E6357" },
      },
    ],
    ...overrides,
  };
}

export function createContentSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "content",
    background: "#F7F2E8",
    elements: [
      {
        type: "heading", id: uid(), x: 96, y: 120, width: 880, height: 140,
        props: { text: "Título do Slide", fontSize: 84, fontFamily: "Anton", color: "#1B1714", fontWeight: 800, letterSpacing: -1, textTransform: "none" },
      },
      {
        type: "body", id: uid(), x: 96, y: 300, width: 880, height: 900,
        props: { text: "Conteúdo do slide aqui...", fontSize: 42, fontFamily: "Inter", color: "#1B1714", lineHeight: 1.4, maxWidth: 880 },
      },
    ],
    ...overrides,
  };
}

export function createListSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "list",
    background: "#1B1714",
    elements: [
      {
        type: "heading", id: uid(), x: 96, y: 100, width: 880, height: 100,
        props: { text: "Lista", fontSize: 84, fontFamily: "Anton", color: "#FFFFFF", fontWeight: 800, letterSpacing: -1, textTransform: "none" },
      },
      {
        type: "body", id: uid(), x: 96, y: 260, width: 880, height: 900,
        props: { text: "→ Item 1\n→ Item 2\n→ Item 3\n→ Item 4", fontSize: 44, fontFamily: "Inter", color: "#FFFFFF", lineHeight: 1.5, maxWidth: 880 },
      },
    ],
    ...overrides,
  };
}

export function createQuoteSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "quote",
    background: "#F7F2E8",
    elements: [
      {
        type: "quote", id: uid(), x: 96, y: 300, width: 880, height: 500,
        props: { text: "Citação inspiradora aqui...", author: "Autor", fontSize: 76, fontFamily: "Georgia", color: "#1B1714", fontStyle: "italic" },
      },
    ],
    ...overrides,
  };
}

export function createStatSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "stat",
    background: "#1B1714",
    elements: [
      {
        type: "stat", id: uid(), x: 96, y: 350, width: 880, height: 300,
        props: { value: "99%", fontSize: 280, fontFamily: "Anton", color: "#BE4D2E" },
      },
      {
        type: "subheading", id: uid(), x: 96, y: 700, width: 880, height: 60,
        props: { text: "Descrição do número", fontSize: 48, fontFamily: "Inter", color: "#FFFFFF", lineHeight: 1.3 },
      },
    ],
    ...overrides,
  };
}

export function createImageSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "image",
    background: "#000000",
    elements: [
      {
        type: "image", id: uid(), x: 0, y: 0, width: 1080, height: 1350,
        props: { src: "", objectFit: "cover", borderRadius: 0, overlay: "rgba(0,0,0,0.3)", opacity: 1 },
      },
      {
        type: "heading", id: uid(), x: 96, y: 1100, width: 880, height: 140,
        props: { text: "Título sobre imagem", fontSize: 84, fontFamily: "Anton", color: "#FFFFFF", fontWeight: 800, letterSpacing: -1, textTransform: "none" },
      },
    ],
    ...overrides,
  };
}

export function createCtaSlide(overrides?: Partial<Slide>): Slide {
  return {
    id: `slide_${Date.now()}_${++counter}`,
    type: "cta",
    background: "#BE4D2E",
    elements: [
      {
        type: "heading", id: uid(), x: 96, y: 400, width: 880, height: 200,
        props: { text: "Call to Action", fontSize: 120, fontFamily: "Anton", color: "#FFFFFF", fontWeight: 800, letterSpacing: -2, textTransform: "none" },
      },
      {
        type: "subheading", id: uid(), x: 96, y: 620, width: 800, height: 60,
        props: { text: "Descreva a ação desejada", fontSize: 40, fontFamily: "Inter", color: "#FFFFFF", lineHeight: 1.35 },
      },
      {
        type: "shape", id: uid(), x: 96, y: 740, width: 300, height: 70,
        props: { shapeType: "rect", color: "#FFFFFF", borderRadius: 14, opacity: 1 },
      },
    ],
    ...overrides,
  };
}

export const SLIDE_TEMPLATES: Record<string, () => Slide> = {
  cover: createCoverSlide,
  content: createContentSlide,
  list: createListSlide,
  quote: createQuoteSlide,
  stat: createStatSlide,
  image: createImageSlide,
  cta: createCtaSlide,
};
