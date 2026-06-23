import { DuckDuckGoSearchProvider } from "@/lib/search/providers/duckduckgo";
import { SearxngSearchProvider } from "@/lib/search/providers/searxng";
import { listSearchProviders, registerSearchProvider } from "@/lib/search/registry";

let initialized = false;

export function ensureSearchProvidersRegistered() {
  if (initialized) {
    return;
  }

  const existing = new Set(listSearchProviders().map((provider) => provider.name));
  const providers = [new DuckDuckGoSearchProvider(), new SearxngSearchProvider()];

  for (const provider of providers) {
    if (!existing.has(provider.name)) {
      registerSearchProvider(provider);
    }
  }

  initialized = true;
}
