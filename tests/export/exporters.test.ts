import { describe, expect, it } from "vitest";
import { HtmlExporter } from "@/lib/export/html";
import { MarkdownExporter } from "@/lib/export/markdown";
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
  intro: "Intro",
  sections: [{ heading: "Secao", body: "Texto", sourceUrls: [] }],
  facts: ["Fato"],
  faq: [{ question: "Q?", answer: "A." }],
  conclusion: "Fim",
  sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
};

describe("exporters", () => {
  it("exports markdown", async () => {
    const exporter = new MarkdownExporter();
    const output = await exporter.export(article);

    expect(output.fileName).toBe("titulo.md");
  });

  it("exports html", async () => {
    const exporter = new HtmlExporter();
    const output = await exporter.export(article);

    expect(output.content).toContain("<html");
  });
});
