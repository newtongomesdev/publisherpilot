import type { AiProvider } from "@/lib/ai/ai-provider";

const registry = new Map<string, AiProvider>();

export function registerAiProvider(provider: AiProvider) {
  registry.set(provider.name, provider);
}

export function getAiProvider(name: string) {
  return registry.get(name);
}

export function listAiProviders() {
  return [...registry.values()];
}
