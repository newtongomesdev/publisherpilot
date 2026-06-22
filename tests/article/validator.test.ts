import { describe, expect, it } from "vitest";
import { generatedArticleSchema } from "@/lib/article/validator";

describe("generatedArticleSchema", () => {
  it("accepts valid generated article JSON", () => {
    const parsed = generatedArticleSchema.safeParse({
      title: "Titulo",
      slug: "titulo",
      language: "pt-BR",
      niche: "tecnologia",
      excerpt: "Resumo",
      metaDescription: "Meta",
      tags: ["tag"],
      outline: ["Intro"],
      intro: "Introducao",
      sections: [{ heading: "Secao", body: "Corpo", sourceUrls: ["https://example.com"] }],
      facts: ["Fato"],
      faq: [{ question: "Q?", answer: "A." }],
      conclusion: "Conclusao",
      sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
    });

    expect(parsed.success).toBe(true);
  });
});
