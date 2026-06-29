import { describe, expect, it } from "vitest";
import { assignUniqueImagesToSections, buildImageSearchQueries } from "@/lib/images/assignment";
import type { ArticleSection } from "@/lib/article/types";

describe("image assignment helpers", () => {
  it("nao repete imagens quando ha menos imagens do que secoes", () => {
    const sections: ArticleSection[] = [
      { heading: "A", body: "a", sourceUrls: [] },
      { heading: "B", body: "b", sourceUrls: [] },
      { heading: "C", body: "c", sourceUrls: [] },
    ];

    const images = [
      { url: "https://img.example.com/1.jpg", alt: "1", source: "Example", provider: "wikimedia" as const },
      { url: "https://img.example.com/2.jpg", alt: "2", source: "Example", provider: "wikimedia" as const },
    ];

    const assigned = assignUniqueImagesToSections(sections, images);

    expect(assigned[0].images).toHaveLength(1);
    expect(assigned[1].images).toHaveLength(1);
    expect(assigned[2].images ?? []).toHaveLength(0);
    expect(assigned[0].images?.[0].url).not.toBe(assigned[1].images?.[0].url);
  });

  it("gera queries amplas e sem duplicacao para buscar imagens", () => {
    const queries = buildImageSearchQueries("The Smiths", "musica");

    expect(queries[0]).toBe("The Smiths");
    expect(queries).toContain("The Smiths musica");
    expect(new Set(queries).size).toBe(queries.length);
  });
});
