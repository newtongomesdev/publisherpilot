import type { SearchOptions, SearchProvider, SearchResult } from "@/lib/search/search-provider";

function decodeDuckDuckGoUrl(value: string) {
  try {
    const parsed = new URL(value, "https://duckduckgo.com");
    return parsed.searchParams.get("uddg") ?? value;
  } catch {
    return value;
  }
}

function extractDomain(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "";
  }
}

export class DuckDuckGoSearchProvider implements SearchProvider {
  name = "duckduckgo";

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await response.text();

    return html
      .split('result__a"')
      .slice(1, options.limit + 1)
      .map((chunk, index) => {
        const hrefMatch = chunk.match(/href="([^"]+)"/);
        const titleMatch = chunk.match(/>([^<]+)<\/a>/);
        const rawUrl = hrefMatch?.[1] ?? "";
        const url = decodeDuckDuckGoUrl(rawUrl);
        const domain = extractDomain(url);

        return {
          title: titleMatch?.[1]?.trim() ?? `Resultado ${index + 1}`,
          url,
          domain,
          snippet: "",
          provider: this.name,
          relevanceScore: 0,
        } satisfies SearchResult;
      })
      .filter((item) => Boolean(item.url && item.domain))
      .filter((item) => !options.blockedDomains?.includes(item.domain));
  }
}
