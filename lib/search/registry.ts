import type { SearchProvider } from "@/lib/search/search-provider";

const registry = new Map<string, SearchProvider>();

export function registerSearchProvider(provider: SearchProvider) {
  registry.set(provider.name, provider);
}

export function getSearchProvider(name: string) {
  return registry.get(name);
}

export function listSearchProviders() {
  return [...registry.values()];
}
