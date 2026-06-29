import { env } from "@/lib/env";
import { resolveProviderConfig } from "@/lib/integrations/provider-config";
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
    const config = await resolveProviderConfig(this.name, options.userId);
    const baseUrl = config.baseUrl ?? env.SEARXNG_URL;

    if (!baseUrl) {
      return [];
    }

    const response = await fetch(
      `${baseUrl}/search?q=${encodeURIComponent(query)}&format=json`,
      {
        headers: config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : undefined,
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
