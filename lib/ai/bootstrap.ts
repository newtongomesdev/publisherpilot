import { OpenAIProvider } from "@/lib/ai/providers/openai";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouter";
import { listAiProviders, registerAiProvider } from "@/lib/ai/registry";

let initialized = false;

export function ensureAiProvidersRegistered() {
  if (initialized) {
    return;
  }

  const existing = new Set(listAiProviders().map((provider) => provider.name));
  const providers = [new OpenRouterProvider(), new OpenAIProvider()];

  for (const provider of providers) {
    if (!existing.has(provider.name)) {
      registerAiProvider(provider);
    }
  }

  initialized = true;
}
