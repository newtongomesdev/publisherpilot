import { describe, expect, it } from "vitest";
import { toMarkdown } from "@/lib/article/markdown";

describe("toMarkdown", () => {
  it("renders title, sections, and sources", () => {
    const result = toMarkdown({
      title: "Titulo",
      excerpt: "Resumo",
      intro: "Introducao",
      conclusion: "Conclusao",
      sections: [{ heading: "Secao", body: "Texto", sourceUrls: [] }],
      sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
    } as never);

    expect(result).toContain("# Titulo");
    expect(result).toContain("## Secao");
    expect(result).toContain("https://example.com");
  });
});
