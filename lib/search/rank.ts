import type { SearchResult } from "@/lib/search/search-provider";

export function rankSources(query: string, results: SearchResult[]) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return [...results]
    .map((result) => ({
      ...result,
      relevanceScore: terms.reduce((score, term) => {
        const haystack = `${result.title} ${result.snippet}`.toLowerCase();
        return haystack.includes(term) ? score + 10 : score;
      }, result.relevanceScore ?? 0),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
