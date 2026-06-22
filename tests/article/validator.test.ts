import { describe, expect, it } from "vitest";
import { generatedArticleSchema } from "@/lib/article/validator";

const validArticle = {
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
};

describe("generatedArticleSchema", () => {
  it("accepts valid generated article JSON", () => {
    const parsed = generatedArticleSchema.safeParse(validArticle);

    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid source URL", () => {
    const parsed = generatedArticleSchema.safeParse({
      ...validArticle,
      sources: [{ title: "Fonte", url: "nota-url", domain: "example.com" }],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects a missing required content string", () => {
    const parsed = generatedArticleSchema.safeParse({
      ...validArticle,
      intro: "",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid nested section source URL", () => {
    const parsed = generatedArticleSchema.safeParse({
      ...validArticle,
      sections: [{ heading: "Secao", body: "Corpo", sourceUrls: ["nota-url"] }],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects disallowed source URL schemes", () => {
    const javascriptSource = generatedArticleSchema.safeParse({
      ...validArticle,
      sources: [{ title: "Fonte", url: "javascript:alert(1)", domain: "example.com" }],
    });
    const dataSource = generatedArticleSchema.safeParse({
      ...validArticle,
      sources: [{ title: "Fonte", url: "data:text/html,boom", domain: "example.com" }],
    });

    expect(javascriptSource.success).toBe(false);
    expect(dataSource.success).toBe(false);
  });

  it("rejects disallowed nested section source URL schemes", () => {
    const javascriptSource = generatedArticleSchema.safeParse({
      ...validArticle,
      sections: [{ heading: "Secao", body: "Corpo", sourceUrls: ["javascript:alert(1)"] }],
    });
    const dataSource = generatedArticleSchema.safeParse({
      ...validArticle,
      sections: [{ heading: "Secao", body: "Corpo", sourceUrls: ["data:text/html,boom"] }],
    });

    expect(javascriptSource.success).toBe(false);
    expect(dataSource.success).toBe(false);
  });
});
