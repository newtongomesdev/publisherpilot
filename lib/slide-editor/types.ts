export type SlideType = "cover" | "content" | "list" | "quote" | "stat" | "image" | "cta" | "comparison";

export type CanvasFormat = {
  id: string;
  label: string;
  width: number;
  height: number;
  category: string;
};

export const CANVAS_FORMATS: CanvasFormat[] = [
  // Instagram
  { id: "ig-portrait", label: "Instagram Portrait (4:5)", width: 1080, height: 1350, category: "Instagram" },
  { id: "ig-square", label: "Instagram Square (1:1)", width: 1080, height: 1080, category: "Instagram" },
  { id: "ig-story", label: "Instagram Story (9:16)", width: 1080, height: 1920, category: "Instagram" },
  { id: "ig-carousel", label: "Instagram Carrossel (4:5)", width: 1080, height: 1350, category: "Instagram" },
  // Facebook
  { id: "fb-post", label: "Facebook Post (1200x630)", width: 1200, height: 630, category: "Facebook" },
  { id: "fb-story", label: "Facebook Story (9:16)", width: 1080, height: 1920, category: "Facebook" },
  { id: "fb-event", label: "Facebook Event (1920x1080)", width: 1920, height: 1080, category: "Facebook" },
  // LinkedIn
  { id: "li-post", label: "LinkedIn Post (1200x628)", width: 1200, height: 628, category: "LinkedIn" },
  { id: "li-carousel", label: "LinkedIn Carrossel (1080x1080)", width: 1080, height: 1080, category: "LinkedIn" },
  { id: "li-cover", label: "LinkedIn Cover (1584x396)", width: 1584, height: 396, category: "LinkedIn" },
  // Twitter/X
  { id: "x-post", label: "X/Twitter Post (1600x900)", width: 1600, height: 900, category: "X/Twitter" },
  { id: "x-card", label: "X Summary Card (1200x628)", width: 1200, height: 628, category: "X/Twitter" },
  // Pinterest
  { id: "pin-standard", label: "Pinterest Standard (1000x1500)", width: 1000, height: 1500, category: "Pinterest" },
  { id: "pin-long", label: "Pinterest Long (1000x2100)", width: 1000, height: 2100, category: "Pinterest" },
  // YouTube
  { id: "yt-thumb", label: "YouTube Thumbnail (1280x720)", width: 1280, height: 720, category: "YouTube" },
  { id: "yt-community", label: "YouTube Community (1200x675)", width: 1200, height: 675, category: "YouTube" },
  // TikTok
  { id: "tiktok", label: "TikTok (1080x1920)", width: 1080, height: 1920, category: "TikTok" },
  // Genérico
  { id: "landscape-16-9", label: "Landscape (16:9)", width: 1920, height: 1080, category: "Genérico" },
  { id: "landscape-4-3", label: "Landscape (4:3)", width: 1280, height: 960, category: "Genérico" },
  { id: "custom", label: "Personalizado", width: 1080, height: 1080, category: "Genérico" },
];

export type TextTransform = "none" | "uppercase" | "lowercase";

export type HeadingElement = {
  type: "heading";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: number;
    letterSpacing: number;
    textTransform: TextTransform;
  };
};

export type SubheadingElement = {
  type: "subheading";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    lineHeight: number;
  };
};

export type BodyElement = {
  type: "body";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    lineHeight: number;
    maxWidth: number;
  };
};

export type KickerElement = {
  type: "kicker";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    letterSpacing: number;
    textTransform: TextTransform;
  };
};

export type StatElement = {
  type: "stat";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    value: string;
    fontSize: number;
    fontFamily: string;
    color: string;
  };
};

export type QuoteElement = {
  type: "quote";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    author: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    fontStyle: "normal" | "italic";
  };
};

export type ImageElement = {
  type: "image";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    src: string;
    objectFit: "cover" | "contain" | "fill";
    borderRadius: number;
    overlay: string;
    opacity: number;
  };
};

export type ShapeElement = {
  type: "shape";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    shapeType: "rect" | "circle" | "line";
    color: string;
    borderRadius: number;
    opacity: number;
  };
};

export type IconElement = {
  type: "icon";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    emoji: string;
    size: number;
    color: string;
  };
};

export type OverlayElement = {
  type: "overlay";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    overlayType: "glass" | "gradient" | "blur";
    intensity: number;
    color: string;
    opacity: number;
  };
};

export type LogoElement = {
  type: "logo";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    src: string;
    width: number;
  };
};

export type HandleElement = {
  type: "handle";
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  props: {
    text: string;
    position: "bottom-left" | "bottom-right";
    fontFamily: string;
    color: string;
  };
};

export type SlideElement =
  | HeadingElement
  | SubheadingElement
  | BodyElement
  | KickerElement
  | StatElement
  | QuoteElement
  | ImageElement
  | ShapeElement
  | IconElement
  | OverlayElement
  | LogoElement
  | HandleElement;

export type Slide = {
  id: string;
  type: SlideType;
  elements: SlideElement[];
  background: string;
  backgroundGradient?: string;
  backgroundImage?: string;
};

export type DesignSystemCategory =
  | "tech"
  | "minimal"
  | "bold"
  | "corporativo"
  | "editorial"
  | "criativo"
  | "dark"
  | "colorido"
  | "premium";

export type DesignSystem = {
  id: string;
  name: string;
  category: DesignSystemCategory;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
  };
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  borderRadius: string;
  shadows: string;
  borders: string;
};
