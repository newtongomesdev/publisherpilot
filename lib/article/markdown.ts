import type { GeneratedArticle } from "@/lib/article/types";
import { sanitizeArticleUrl } from "@/lib/article/url";

export function toMarkdown(article: GeneratedArticle) {
  const sections = article.sections
    .map((section) => `## ${section.heading}\n\n${section.body}`)
    .join("\n\n");

  const sources = article.sources.map((source) => `- [${source.title}](${sanitizeArticleUrl(source.url)})`).join("\n");

  return [
    `# ${article.title}`,
    article.excerpt,
    article.intro,
    sections,
    `## Conclusao\n\n${article.conclusion}`,
    `## Fontes\n\n${sources}`,
  ].join("\n\n");
}
