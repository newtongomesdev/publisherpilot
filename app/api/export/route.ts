import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

const exportRequestSchema = z.object({
  articleProjectId: z.string().min(1),
  format: z.enum(["markdown", "html", "pdf"]),
});

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    let workspace;
    try {
      workspace = await requireCurrentWorkspace();
    } catch {
      // fallback
    }
    if (!workspace) {
      const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
      workspace = await getDefaultWorkspaceByUser(user.id);
    }
    if (!workspace) {
      return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = exportRequestSchema.parse(body);
    const { createExportHistory, getArticleProjectById, getGeneratedArticleByProjectId } = await import("@/lib/db/queries");
  const { HtmlExporter } = await import("@/lib/export/html");
  const { MarkdownExporter } = await import("@/lib/export/markdown");
  const { PdfExporter } = await import("@/lib/export/pdf");
  const project = await getArticleProjectById(parsed.articleProjectId, user.id, workspace.id);
  if (!project) {
    return NextResponse.json({ ok: false, error: "Article project not found" }, { status: 404 });
  }

  const article = await getGeneratedArticleByProjectId(parsed.articleProjectId);

  if (!article) {
    return NextResponse.json({ ok: false, error: "Generated article not found" }, { status: 404 });
  }

  const materializedArticle = {
    title: article.title,
    slug: article.slug,
    language: article.language,
    niche: article.niche,
    excerpt: article.excerpt,
    metaDescription: article.metaDescription,
    tags: JSON.parse(article.tagsJson) as string[],
    outline: JSON.parse(article.outlineJson) as string[],
    intro: article.intro,
    sections: JSON.parse(article.sectionsJson) as Array<{ heading: string; body: string; sourceUrls: string[] }>,
    facts: JSON.parse(article.factsJson) as string[],
    faq: JSON.parse(article.faqJson) as Array<{ question: string; answer: string }>,
    conclusion: article.conclusion,
    sources: JSON.parse(article.sourcesJson) as Array<{ title: string; url: string; domain: string }>,
  };

  const exporters = {
    markdown: new MarkdownExporter(),
    html: new HtmlExporter(),
    pdf: new PdfExporter(),
  };
  const exporter = exporters[parsed.format];
  const result = await exporter.export(materializedArticle);

  const history = await createExportHistory({
    articleProjectId: parsed.articleProjectId,
    generatedArticleId: article.id,
    format: parsed.format,
    status: "completed",
    fileName: result.fileName,
    filePath: null,
    errorMessage: null,
  });

  const content =
    typeof result.content === "string" ? result.content : Buffer.from(result.content).toString("base64");

  // Index exported article in ChromaDB
  try {
    const { indexExport } = await import("@/lib/ai/chromadb");
    await indexExport({
      id: `export_${parsed.articleProjectId}_${Date.now()}`,
      content: `${materializedArticle.title}\n${materializedArticle.excerpt}\n${materializedArticle.intro}\n${materializedArticle.sections.map((s) => `${s.heading}\n${s.body}`).join("\n")}\n${materializedArticle.conclusion}`,
      metadata: {
        projectId: parsed.articleProjectId,
        format: parsed.format,
        title: materializedArticle.title,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    history,
    artifact: {
      fileName: result.fileName,
      mimeType: result.mimeType,
      encoding: typeof result.content === "string" ? "utf8" : "base64",
      content,
    },
  });
  } catch (err: any) {
    console.error("[export] Error:", err?.message, err?.stack);
    return NextResponse.json(
      { ok: false, error: err?.message || "Export failed" },
      { status: 500 }
    );
  }
}
