import { toMarkdown } from "@/lib/article/markdown";
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";

export class MarkdownExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    return {
      fileName: `${article.title.toLowerCase().replace(/\s+/g, "-")}.md`,
      content: toMarkdown(article),
      mimeType: "text/markdown",
    };
  }
}
