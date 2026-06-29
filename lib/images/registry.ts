import type { ImageProvider } from "@/lib/images/image-provider";
import { falImageProvider } from "@/lib/images/providers/fal";
import { openaiImageProvider } from "@/lib/images/providers/openai";
import { replicateImageProvider } from "@/lib/images/providers/replicate";

const registry = new Map<string, ImageProvider>(
  [openaiImageProvider, falImageProvider, replicateImageProvider].map((provider) => [provider.name, provider]),
);

export function getImageProvider(name: string) {
  return registry.get(name);
}

export function listImageProviders() {
  return [...registry.values()];
}
