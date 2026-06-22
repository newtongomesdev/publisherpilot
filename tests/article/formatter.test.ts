import { describe, expect, it } from "vitest";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import type { GeneratedArticle } from "@/lib/article/types";

const article: GeneratedArticle = {
  title: "Titulo",
  slug: "titulo",
  language: "pt-BR",
  niche: "tecnologia",
  excerpt: "Resumo",
  metaDescription: "Meta",
  tags: ["tag"],
  outline: ["Intro"],
  intro: "Introducao",
  sections: [{ heading: "Secao", body: "Texto", sourceUrls: ["https://example.com"] }],
  facts: ["Fato"],
  faq: [{ question: "Q?", answer: "A." }],
  conclusion: "Conclusao",
  sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
};

describe("formatGeneratedArticle", () => {
  it("renders markdown and html output", () => {
    const result = formatGeneratedArticle(article);

    expect(result.markdown).toContain("# Titulo");
    expect(result.markdown).toContain("## Secao");
    expect(result.markdown).toContain("https://example.com");
    expect(result.html).toContain("<h1>Titulo</h1>");
    expect(result.html).toContain("<h2>Secao</h2>");
    expect(result.html).toContain("<p>- [Fonte](https://example.com)</p>");
  });
});
