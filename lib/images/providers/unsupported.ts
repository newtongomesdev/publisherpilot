import type { ImageProvider } from "@/lib/images/image-provider";

export function createUnsupportedImageProvider(name: string, label: string): ImageProvider {
  return {
    name,
    label,
    async generateImage(options) {
      throw new Error(`${label} image provider ainda nao foi implementado. Prompt recebido: ${options.prompt}`);
    },
  };
}
