import type { GeneratedArticle, ArticleSection } from "@/lib/article/types";
import { toMarkdown } from "@/lib/article/markdown";
import { sanitizeArticleUrl } from "@/lib/article/url";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatSectionImagesHtml(images: NonNullable<ArticleSection["images"]>) {
  return images
    .map((img) => `<figure><img src="${img.url}" alt="${escapeHtml(img.alt)}" loading="lazy" /><figcaption>${escapeHtml(img.source)}</figcaption></figure>`)
    .join("\n");
}

export function formatGeneratedArticle(article: GeneratedArticle) {
  const markdown = toMarkdown(article);
  const sections = article.sections
    .map((section) => {
      const images = section.images && section.images.length > 0
        ? `\n${formatSectionImagesHtml(section.images)}`
        : "";
      return `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p>${images}</section>`;
    })
    .join("");
  const sources = article.sources
    .map((source) => `<li><a href="${sanitizeArticleUrl(source.url)}">${escapeHtml(source.title)}</a></li>`)
    .join("");
  const html = [
    `<h1>${escapeHtml(article.title)}</h1>`,
    `<p>${escapeHtml(article.excerpt)}</p>`,
    `<p>${escapeHtml(article.intro)}</p>`,
    sections,
    `<h2>Conclusao</h2>`,
    `<p>${escapeHtml(article.conclusion)}</p>`,
    `<h2>Fontes</h2>`,
    `<ul>${sources}</ul>`,
  ].join("");

  return { markdown, html };
}
