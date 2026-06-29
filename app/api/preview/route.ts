import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";

function proxyImage(url: string) {
  return `/api/images/proxy?url=${encodeURIComponent(url)}`;
}

function esc(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Convert basic Markdown inline formatting to HTML */
function mdInline(text: string) {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')  // [text](url)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
    .replace(/\*(.+?)\*/g, '<em>$1</em>')  // *italic*
    .replace(/`(.+?)`/g, '<code>$1</code>');  // `code`
}

/** Convert Markdown body (paragraphs with inline formatting) to HTML */
function mdBody(text: string) {
  return text
    .split("\n\n")
    .filter((p) => p.trim())
    .map((p) => `<p>${mdInline(esc(p.trim()))}</p>`)
    .join("\n");
}

function safeUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return url;
  } catch {}
  return "#";
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get("id");
    if (!projectId) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const { getDefaultWorkspaceByUser, getArticleProjectById, getGeneratedArticleByProjectId } = await import("@/lib/db/queries");
    const workspace = await getDefaultWorkspaceByUser(user.id);
    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const project = await getArticleProjectById(projectId, user.id, workspace.id);
    if (!project) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const article = await getGeneratedArticleByProjectId(projectId);
    if (!article) {
      return NextResponse.json({ error: "Article content not found" }, { status: 404 });
    }

    const tags = JSON.parse(article.tagsJson) as string[];
    const outline = JSON.parse(article.outlineJson) as string[];
    const sections = JSON.parse(article.sectionsJson) as Array<{ heading: string; body: string; sourceUrls: string[]; images?: Array<{ url: string; alt: string; source: string; provider: string }> }>;
    const facts = JSON.parse(article.factsJson) as string[];
    const faq = JSON.parse(article.faqJson) as Array<{ question: string; answer: string }>;
    const sources = JSON.parse(article.sourcesJson) as Array<{ title: string; url: string; domain: string }>;

    // Legacy flat images from rawJson (fallback for old articles)
    type ArticleImage = { url: string; alt: string; source: string };
    let legacyImages: ArticleImage[] = [];
    try {
      const raw = JSON.parse(article.rawJson);
      legacyImages = raw.images ?? [];
    } catch {}

    const sectionsHtml = sections.map((s, i) => {
      const bodyHtml = mdBody(s.body);

      // Prefer images embedded in sections (new format), fall back to legacy flat array
      let sectionImages = s.images && s.images.length > 0
        ? s.images
        : (i > 0 && i % 2 === 1 && legacyImages.length > 0 ? [legacyImages[i % legacyImages.length]] : []);

      const imagesHtml = sectionImages
        .map((img) => `<figure class="article-image"><img src="${proxyImage(img.url)}" alt="${esc(img.alt)}" loading="lazy" referrerpolicy="no-referrer" /><figcaption>${esc(img.source)}</figcaption></figure>`)
        .join("");

      return `<section id="${encodeURIComponent(s.heading)}"><h2>${esc(s.heading)}</h2>${bodyHtml}${imagesHtml}</section>`;
    }).join("\n");

    const tocHtml = outline.map((item) =>
      `<li><a href="#${encodeURIComponent(item)}">${esc(item)}</a></li>`
    ).join("\n");

    const introHtml = mdBody(article.intro);
    const conclusionHtml = mdBody(article.conclusion);
    const factsHtml = facts.map((f) => `<li>${mdInline(esc(f))}</li>`).join("\n");
    const faqHtml = faq.map((item) => `<details class="faq-item"><summary>${esc(item.question)}</summary><p>${mdBody(item.answer)}</p></details>`).join("\n");
    const sourcesHtml = sources.map((s) => `<li><a href="${safeUrl(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> <span class="domain">(${esc(s.domain)})</span></li>`).join("\n");
    const tagsHtml = tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(" ");

    const html = `<!DOCTYPE html>
<html lang="${esc(article.language)}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="referrer" content="no-referrer" />
<title>${esc(article.title)}</title>
<meta name="description" content="${esc(article.metaDescription)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Merriweather:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Merriweather',Georgia,'Times New Roman',serif;font-size:17px;line-height:1.8;color:#1a1a2e;background:#fff;-webkit-font-smoothing:antialiased}
.header{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;padding:80px 24px 60px;text-align:center}
.header .niche{font-family:'Inter',sans-serif;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#34d399;margin-bottom:16px}
.header h1{font-family:'Inter',sans-serif;font-size:clamp(28px,5vw,44px);font-weight:800;line-height:1.2;max-width:800px;margin:0 auto 16px}
.header .excerpt{font-size:18px;color:#94a3b8;max-width:600px;margin:0 auto 24px;line-height:1.6}
.header .tags{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.container{max-width:720px;margin:0 auto;padding:48px 24px 80px}
.toc{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px 32px;margin-bottom:48px}
.toc h3{font-family:'Inter',sans-serif;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:12px}
.toc ol{list-style:none;counter-reset:toc}
.toc li{counter-increment:toc;padding:4px 0}
.toc li::before{content:counter(toc) ".";font-family:'Inter',sans-serif;font-weight:600;color:#059669;margin-right:8px}
.toc a{color:#334155;text-decoration:none;font-size:15px}
.toc a:hover{color:#059669;text-decoration:underline}
.intro{font-size:19px;color:#334155;margin-bottom:48px}
section{margin-bottom:40px}
section h2{font-family:'Inter',sans-serif;font-size:24px;font-weight:700;color:#0f172a;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #e2e8f0}
section p{margin-bottom:16px;color:#374151}
.facts-box{background:linear-gradient(135deg,#ecfdf5 0%,#f0fdf4 100%);border-left:4px solid #059669;border-radius:0 12px 12px 0;padding:24px 28px;margin:32px 0}
.facts-box h3{font-family:'Inter',sans-serif;font-size:16px;font-weight:600;color:#065f46;margin-bottom:12px}
.facts-box ul{list-style:none;padding:0}
.facts-box li{padding:6px 0 6px 24px;position:relative;color:#374151;font-size:15px}
.facts-box li::before{content:"\\2713";position:absolute;left:0;color:#059669;font-weight:700}
.faq-section{margin:48px 0}
.faq-section h3{font-family:'Inter',sans-serif;font-size:20px;font-weight:700;color:#0f172a;margin-bottom:16px}
.faq-item{border:1px solid #e2e8f0;border-radius:10px;margin-bottom:8px;overflow:hidden}
.faq-item summary{font-family:'Inter',sans-serif;font-size:15px;font-weight:600;padding:16px 20px;cursor:pointer;color:#1e293b;background:#f8fafc;list-style:none}
.faq-item summary::-webkit-details-marker{display:none}
.faq-item summary::before{content:"+";font-weight:700;color:#059669;margin-right:12px}
.faq-item[open] summary::before{content:"\\2212"}
.faq-item p{padding:0 20px 16px;color:#475569;font-size:15px;line-height:1.7}
.conclusion{background:#f8fafc;border-radius:16px;padding:32px;margin:48px 0}
.conclusion h2{font-family:'Inter',sans-serif;font-size:22px;font-weight:700;color:#0f172a;margin-bottom:16px;border:none;padding:0}
.conclusion p{color:#475569}
.sources-section{margin-top:48px;padding-top:32px;border-top:2px solid #e2e8f0}
.sources-section h3{font-family:'Inter',sans-serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#64748b;margin-bottom:16px}
.sources-section ol{list-style:decimal;padding-left:20px}
.sources-section li{padding:4px 0;font-size:14px;color:#475569}
.sources-section a{color:#059669;text-decoration:none}
.sources-section a:hover{text-decoration:underline}
.sources-section .domain{color:#94a3b8;font-size:13px}
.article-image{margin:32px 0;border-radius:12px;overflow:hidden}
.article-image img{width:100%;height:auto;display:block;border-radius:8px}
.article-image figcaption{font-family:'Inter',sans-serif;font-size:12px;color:#94a3b8;padding:8px 0;text-align:center}
.tag{display:inline-block;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#cbd5e1;padding:4px 12px;border-radius:20px;font-family:'Inter',sans-serif;font-size:12px}
.header .tags .tag{background:rgba(255,255,255,0.1);border-color:rgba(255,255,255,0.2);color:#cbd5e1}
.footer{text-align:center;padding:32px 24px;font-family:'Inter',sans-serif;font-size:13px;color:#94a3b8;border-top:1px solid #e2e8f0}
@media print{.header{padding:40px 24px 30px}.container{padding:24px 16px 40px}body{font-size:14px}}
</style>
</head>
<body>
<div class="header">
  <div class="niche">${esc(article.niche)}</div>
  <h1>${esc(article.title)}</h1>
  <p class="excerpt">${esc(article.excerpt)}</p>
  <div class="tags">${tagsHtml}</div>
</div>
<div class="container">
  ${outline.length > 0 ? `<nav class="toc"><h3>Sumario</h3><ol>${tocHtml}</ol></nav>` : ""}
  <div class="intro">${introHtml}</div>
  ${sectionsHtml}
  ${facts.length > 0 ? `<div class="facts-box"><h3>Fatos importantes</h3><ul>${factsHtml}</ul></div>` : ""}
  ${faq.length > 0 ? `<div class="faq-section"><h3>Perguntas Frequentes</h3>${faqHtml}</div>` : ""}
  <div class="conclusion"><h2>Conclusao</h2>${conclusionHtml}</div>
  ${sources.length > 0 ? `<div class="sources-section"><h3>Fontes</h3><ol>${sourcesHtml}</ol></div>` : ""}
</div>
<div class="footer">Gerado por PublisherPilot &middot; ${new Date().toLocaleDateString("pt-BR")}</div>
</body>
</html>`;

    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("[preview] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Preview failed" },
      { status: 500 },
    );
  }
}
