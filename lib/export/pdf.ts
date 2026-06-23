import { toMarkdown } from "@/lib/article/markdown";
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";

export class PdfExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    const content = new TextEncoder().encode(toMarkdown(article));

    return {
      fileName: `${article.slug}.pdf`,
      content,
      mimeType: "application/pdf",
    };
  }
}
