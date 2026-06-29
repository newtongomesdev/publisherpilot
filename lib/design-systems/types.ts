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
