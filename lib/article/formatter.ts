import type { GeneratedArticle } from "@/lib/article/types";
import { toMarkdown } from "@/lib/article/markdown";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeHref(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {}

  return "#";
}

export function formatGeneratedArticle(article: GeneratedArticle) {
  const markdown = toMarkdown(article);
  const sections = article.sections
    .map((section) => `<section><h2>${escapeHtml(section.heading)}</h2><p>${escapeHtml(section.body)}</p></section>`)
    .join("");
  const sources = article.sources
    .map((source) => `<li><a href="${sanitizeHref(source.url)}">${escapeHtml(source.title)}</a></li>`)
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
