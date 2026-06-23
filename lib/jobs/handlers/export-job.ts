import { HtmlExporter } from "@/lib/export/html";
import { MarkdownExporter } from "@/lib/export/markdown";
import { PdfExporter } from "@/lib/export/pdf";

export async function runExportJob(payload: Record<string, unknown>) {
  const format = String(payload.format);
  const exporters = {
    markdown: new MarkdownExporter(),
    html: new HtmlExporter(),
    pdf: new PdfExporter(),
  };

  const exporter = exporters[format as keyof typeof exporters];
  if (!exporter) {
    throw new Error(`Unsupported export format: ${format}`);
  }
}
