import { describe, expect, it } from "vitest";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import type { GeneratedArticle } from "@/lib/article/types";

const article: GeneratedArticle = {
  title: "Titulo <b>unsafe</b>",
  slug: "titulo",
  language: "pt-BR",
  niche: "tecnologia",
  excerpt: "Resumo",
  metaDescription: "Meta",
  tags: ["tag"],
  outline: ["Intro"],
  intro: "Introducao",
  sections: [{ heading: "Secao <script>", body: "Texto <em>livre</em>", sourceUrls: ["https://example.com"] }],
  facts: ["Fato"],
  faq: [{ question: "Q?", answer: "A." }],
  conclusion: "Conclusao",
  sources: [{ title: "Fonte <img>", url: "https://example.com", domain: "example.com" }],
};

describe("formatGeneratedArticle", () => {
  it("renders markdown and html output", () => {
    const result = formatGeneratedArticle(article);

    expect(result.markdown).toContain("# Titulo <b>unsafe</b>");
    expect(result.markdown).toContain("## Secao <script>");
    expect(result.markdown).toContain("https://example.com");
    expect(result.html).toContain("<h1>Titulo &lt;b&gt;unsafe&lt;/b&gt;</h1>");
    expect(result.html).toContain("<h2>Secao &lt;script&gt;</h2>");
    expect(result.html).toContain("<p>Texto &lt;em&gt;livre&lt;/em&gt;</p>");
    expect(result.html).toContain('<h2>Fontes</h2><ul><li><a href="https://example.com">Fonte &lt;img&gt;</a></li></ul>');
    expect(result.html).not.toContain("<script>");
    expect(result.html).not.toContain("<img>");
    expect(result.html).not.toContain("<em>livre</em>");
  });
});
