import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";

/**
 * Exports the article as a styled HTML file that can be opened in a browser
 * and printed to PDF via Ctrl+P / Cmd+P.
 */
export class PdfExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    const sections = article.sections
      .map(
        (s) => `
      <section style="margin-bottom:32px;">
        <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:8px;">${escapeHtml(s.heading)}</h2>
        ${s.body.split("\n\n").map((p) => `<p style="margin-bottom:12px;color:#374151;line-height:1.8;">${escapeHtml(p)}</p>`).join("\n")}
      </section>`,
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="${article.language}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(article.title)}</title>
  <meta name="description" content="${escapeHtml(article.metaDescription)}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Merriweather', Georgia, serif; font-size: 16px; line-height: 1.8; color: #1a1a2e; max-width: 720px; margin: 0 auto; padding: 40px 24px; }
    h1 { font-family: 'Inter', sans-serif; font-size: 32px; font-weight: 800; margin-bottom: 16px; }
    h2 { font-family: 'Inter', sans-serif; }
    .meta { font-family: 'Inter', sans-serif; font-size: 13px; color: #64748b; margin-bottom: 24px; }
    .excerpt { font-size: 18px; color: #334155; margin-bottom: 32px; font-style: italic; }
    p { margin-bottom: 16px; color: #374151; }
    .sources { font-family: 'Inter', sans-serif; font-size: 13px; color: #64748b; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .sources a { color: #059669; }
    @media print { body { padding: 20px; font-size: 14px; } }
  </style>
</head>
<body>
  <div class="meta">${escapeHtml(article.niche)} &middot; ${escapeHtml(article.language)}</div>
  <h1>${escapeHtml(article.title)}</h1>
  <div class="excerpt">${escapeHtml(article.excerpt)}</div>
  <p>${escapeHtml(article.intro)}</p>
  ${sections}
  <p><strong>Conclusao:</strong> ${escapeHtml(article.conclusion)}</p>
  <div class="sources">
    <strong>Fontes:</strong>
    <ul style="list-style:decimal;padding-left:20px;margin-top:8px;">
      ${article.sources.map((s) => `<li><a href="${escapeHtml(s.url)}" target="_blank">${escapeHtml(s.title)}</a></li>`).join("\n")}
    </ul>
  </div>
</body>
</html>`;

    return {
      fileName: `${article.slug}-print.html`,
      content: html,
      mimeType: "text/html",
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
