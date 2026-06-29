import type { GeneratedArticle, ArticleSection } from "@/lib/article/types";
import { sanitizeArticleUrl } from "@/lib/article/url";

function escapeMarkdownText(value: string) {
  return value.replaceAll("\\", "\\\\").replace(/([\[\]\(\)])/g, "\\$1");
}

function formatSectionImages(images: NonNullable<ArticleSection["images"]>) {
  return images
    .map((img) => `![${escapeMarkdownText(img.alt)}](${img.url} "${escapeMarkdownText(img.source)}")`)
    .join("\n\n");
}

export function toMarkdown(article: GeneratedArticle) {
  const sections = article.sections
    .map((section) => {
      const images = section.images && section.images.length > 0
        ? `\n\n${formatSectionImages(section.images)}`
        : "";
      return `## ${section.heading}\n\n${section.body}${images}`;
    })
    .join("\n\n");

  const sources = article.sources
    .map((source) => `- [${escapeMarkdownText(source.title)}](${sanitizeArticleUrl(source.url)})`)
    .join("\n");

  return [
    `# ${article.title}`,
    article.excerpt,
    article.intro,
    sections,
    `## Conclusao\n\n${article.conclusion}`,
    `## Fontes\n\n${sources}`,
  ].join("\n\n");
}
