import { describe, expect, it } from "vitest";
import { rankSources } from "@/lib/search/rank";
import type { SearchResult } from "@/lib/search/search-provider";

describe("rankSources", () => {
  it("prioritizes results containing query terms in title", () => {
    const results: SearchResult[] = [
      {
        title: "Guia de IA editorial",
        snippet: "",
        url: "https://a.com",
        domain: "a.com",
        provider: "duckduckgo",
        relevanceScore: 0,
      },
      {
        title: "Outro assunto",
        snippet: "",
        url: "https://b.com",
        domain: "b.com",
        provider: "searxng",
        relevanceScore: 0,
      },
    ];

    const ranked = rankSources("ia editorial", results);

    expect(ranked[0]?.domain).toBe("a.com");
  });
});
