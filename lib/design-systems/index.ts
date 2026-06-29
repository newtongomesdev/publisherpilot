import { DESIGN_SYSTEMS } from "./definitions";
import { DesignSystemCategory } from "./types";

export { DESIGN_SYSTEMS } from "./definitions";
export type { DesignSystem, DesignSystemCategory } from "./types";

export function getDesignSystemsByCategory(category: DesignSystemCategory) {
  return DESIGN_SYSTEMS.filter((ds) => ds.category === category);
}

export function getDesignSystemById(id: string) {
  return DESIGN_SYSTEMS.find((ds) => ds.id === id);
}

export const CATEGORIES: { id: DesignSystemCategory; label: string }[] = [
  { id: "tech", label: "Tech" },
  { id: "minimal", label: "Minimal" },
  { id: "bold", label: "Bold" },
  { id: "corporativo", label: "Corporativo" },
  { id: "editorial", label: "Editorial" },
  { id: "criativo", label: "Criativo" },
  { id: "dark", label: "Dark Mode" },
  { id: "colorido", label: "Colorido" },
  { id: "premium", label: "Premium" },
];
