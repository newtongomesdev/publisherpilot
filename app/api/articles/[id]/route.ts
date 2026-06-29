import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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

    const { getArticleProjectById, getGeneratedArticleByProjectId, listProjectSources } = await import("@/lib/db/queries");
    const { id } = await params;
    const project = await getArticleProjectById(id, user.id, workspace.id);
    if (!project) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const [article, sources] = await Promise.all([
      getGeneratedArticleByProjectId(id),
      listProjectSources(id),
    ]);

    return NextResponse.json({ ok: true, project, article, sources });
  } catch (err: any) {
    console.error("[articles/id] GET error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const { getArticleProjectById } = await import("@/lib/db/queries");
  const project = workspace
    ? await getArticleProjectById(id, user.id, workspace.id)
    : await getArticleProjectById(id, user.id);
  if (!project) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  if (body.action === "regenerate") {
    const { deleteGeneratedArticlesByProjectId, updateArticleProjectStatus, createJob } = await import("@/lib/db/queries");
    const { createJobRecord } = await import("@/lib/jobs/queue");
    const { FREE_PROVIDERS } = await import("@/lib/images/providers");

    await deleteGeneratedArticlesByProjectId(project.id);
    await updateArticleProjectStatus(project.id, "draft", null);
    await createJob(
      createJobRecord("search", {
        articleProjectId: project.id,
        query: `${project.topic} ${project.niche}`,
        provider: project.searchProvider,
        limit: project.sourceCount,
        imageProviders: FREE_PROVIDERS,
      }),
    );

    const siteUrl = process.env.OPENROUTER_SITE_URL || "http://localhost:3000";
    fetch(`${siteUrl}/api/jobs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  }

  if (body.action === "update-content") {
    const { generatedArticles } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");
    const { db } = await import("@/lib/db/client");

    const htmlContent = body.htmlContent as string | undefined;
    const markdownContent = body.markdownContent as string | undefined;

    if (!htmlContent && !markdownContent) {
      return NextResponse.json({ ok: false, error: "No content provided" }, { status: 400 });
    }

    const [article] = await db
      .select()
      .from(generatedArticles)
      .where(eq(generatedArticles.articleProjectId, project.id))
      .orderBy(generatedArticles.createdAt)
      .limit(1);

    if (!article) {
      return NextResponse.json({ ok: false, error: "No generated article found" }, { status: 404 });
    }

    const updates: Record<string, string> = {};
    if (htmlContent) updates.htmlContent = htmlContent;
    if (markdownContent) updates.markdownContent = markdownContent;

    await db
      .update(generatedArticles)
      .set(updates)
      .where(eq(generatedArticles.id, article.id));

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true, id, updates: body });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { getArticleProjectById, deleteArticleProjectById } = await import("@/lib/db/queries");
    
    // Attempt to verify ownership
    const project = await getArticleProjectById(id, user.id);
    if (!project) {
      return NextResponse.json({ ok: false, error: "Not found or unauthorized" }, { status: 404 });
    }

    await deleteArticleProjectById(id);

    // Remove from ChromaDB
    try {
      const { removeArticle } = await import("@/lib/ai/chromadb");
      await removeArticle(id);
    } catch {}

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[articles/id] DELETE error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
