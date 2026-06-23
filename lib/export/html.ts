import { formatGeneratedArticle } from "@/lib/article/formatter";
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";

export class HtmlExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    const { html } = formatGeneratedArticle(article);

    return {
      fileName: `${article.slug}.html`,
      content: `<!DOCTYPE html><html lang="${article.language}"><head><meta charset="utf-8"><title>${article.title}</title></head><body>${html}</body></html>`,
      mimeType: "text/html",
    };
  }
}
