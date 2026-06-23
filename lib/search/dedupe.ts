import type { SearchResult } from "@/lib/search/search-provider";

export function dedupeSources(results: SearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = new URL(result.url).toString().toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}
