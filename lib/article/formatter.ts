import type { GeneratedArticle } from "@/lib/article/types";
import { toMarkdown } from "@/lib/article/markdown";

export function formatGeneratedArticle(article: GeneratedArticle) {
  const markdown = toMarkdown(article);
  const html = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      return line ? `<p>${line}</p>` : "";
    })
    .join("");

  return { markdown, html };
}
