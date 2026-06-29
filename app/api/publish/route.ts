import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

const publishRequestSchema = z.object({
  articleProjectId: z.string().min(1),
  targetType: z.string().min(1).default("wordpress"),
});

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}
  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
    workspace = await getDefaultWorkspaceByUser(user.id);
  }
  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = publishRequestSchema.parse(body);
  const { getArticleProjectById, getGeneratedArticleByProjectId } = await import("@/lib/db/queries");

  const project = await getArticleProjectById(parsed.articleProjectId, user.id, workspace.id);
  if (!project) {
    return NextResponse.json({ ok: false, error: "Article project not found" }, { status: 404 });
  }

  const article = await getGeneratedArticleByProjectId(parsed.articleProjectId);
  if (!article) {
    return NextResponse.json({ ok: false, error: "Generated article not found" }, { status: 404 });
  }

  const { getPublisher } = await import("@/lib/publishers/registry");
  const publisher = getPublisher(parsed.targetType);
  if (!publisher) {
    return NextResponse.json({ ok: false, error: `Unsupported publish target: ${parsed.targetType}` }, { status: 400 });
  }

  const validation = await publisher.validateConfig(user.id);
  if (!validation.ok) {
    return NextResponse.json({ ok: false, error: validation.reason }, { status: 400 });
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

  const result = await publisher.publish(materializedArticle, user.id);

  // Index exported article in ChromaDB
  try {
    const { indexExport } = await import("@/lib/ai/chromadb");
    await indexExport({
      id: `export_${parsed.articleProjectId}_${Date.now()}`,
      content: `${materializedArticle.title}\n${materializedArticle.excerpt}\n${materializedArticle.intro}\n${materializedArticle.sections.map((s) => `${s.heading}\n${s.body}`).join("\n")}\n${materializedArticle.conclusion}`,
      metadata: {
        projectId: parsed.articleProjectId,
        platform: parsed.targetType,
        platformUrl: result.url || "",
        title: materializedArticle.title,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch {}

  return NextResponse.json({
    ok: true,
    publish: result,
  });
}

export async function GET() {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}
  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
    workspace = await getDefaultWorkspaceByUser(user.id);
  }
  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  const { listPublishTargetsByWorkspace } = await import("@/lib/db/queries");
  const { listPublishers } = await import("@/lib/publishers/registry");
  const targets = await listPublishTargetsByWorkspace(user.id, workspace.id);
  const publishers = listPublishers();

  return NextResponse.json({
    ok: true,
    targets: targets.map((target) => ({
      id: target.id,
      targetType: target.targetType,
      name: target.name,
      isEnabled: target.isEnabled,
      notes: target.notes,
      connectorLabel: publishers.find((publisher) => publisher.name === target.targetType)?.label ?? target.targetType,
    })),
  });
}
