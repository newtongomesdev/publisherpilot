import { describe, expect, it } from "vitest";
import { dedupeSources } from "@/lib/search/dedupe";
import type { SearchResult } from "@/lib/search/search-provider";

describe("dedupeSources", () => {
  it("removes duplicate URLs", () => {
    const results: SearchResult[] = [
      {
        title: "A",
        url: "https://example.com/a",
        domain: "example.com",
        snippet: "",
        provider: "duckduckgo",
        relevanceScore: 0,
      },
      {
        title: "A again",
        url: "https://example.com/a",
        domain: "example.com",
        snippet: "",
        provider: "searxng",
        relevanceScore: 0,
      },
    ];

    expect(dedupeSources(results)).toHaveLength(1);
  });
});
