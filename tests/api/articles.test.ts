import { describe, expect, it } from "vitest";
import { createArticleProjectSchema } from "@/app/api/articles/route";

describe("createArticleProjectSchema", () => {
  it("accepts a valid article project payload", () => {
    const parsed = createArticleProjectSchema.safeParse({
      topic: "IA no jornalismo",
      niche: "tecnologia",
      language: "pt-BR",
      editorialTone: "Jornalistico",
      desiredLength: "1500-2000 palavras",
      articleType: "Artigo informativo",
      sourceCount: 5,
      searchProvider: "both",
      aiProvider: "openrouter",
      aiModelId: "openai/gpt-4o-mini",
    });

    expect(parsed.success).toBe(true);
  });
});
