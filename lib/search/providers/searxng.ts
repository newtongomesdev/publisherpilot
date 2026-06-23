import { env } from "@/lib/env";
import type { SearchOptions, SearchProvider, SearchResult } from "@/lib/search/search-provider";

type SearxngResult = {
  title?: string;
  url?: string;
  content?: string;
  publishedDate?: string;
};

function extractDomain(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

export class SearxngSearchProvider implements SearchProvider {
  name = "searxng";

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!env.SEARXNG_URL) {
      return [];
    }

    const response = await fetch(
      `${env.SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json`,
      {
        headers: env.SEARXNG_API_KEY ? { Authorization: `Bearer ${env.SEARXNG_API_KEY}` } : undefined,
      },
    );

    const payload = (await response.json()) as { results?: SearxngResult[] };

    return (payload.results ?? [])
      .slice(0, options.limit)
      .map((item) => {
        const url = String(item.url ?? "");
        const domain = extractDomain(url);

        return {
          title: String(item.title ?? ""),
          url,
          domain,
          snippet: String(item.content ?? ""),
          publishedAt: item.publishedDate ? String(item.publishedDate) : null,
          provider: this.name,
          relevanceScore: 0,
        } satisfies SearchResult;
      })
      .filter((item) => Boolean(item.url && item.domain))
      .filter((item) => !options.blockedDomains?.includes(item.domain));
  }
}
