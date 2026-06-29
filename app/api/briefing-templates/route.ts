import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

const briefingTemplateSchema = z.object({
  name: z.string().min(2),
  topicHint: z.string().optional(),
  niche: z.string().min(1),
  subtitle: z.string().optional(),
  keywords: z.array(z.string()).default([]),
  structureNotes: z.string().optional(),
  language: z.string().min(1),
  editorialTone: z.string().min(1),
  desiredLength: z.string().min(1),
  articleType: z.string().min(1),
  sourceCount: z.number().int().min(1).max(20),
  searchProvider: z.string().min(1),
  aiProvider: z.string().min(1),
  aiModelId: z.string().min(1),
});

async function getWorkspace(user: { id: string }) {
  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}
  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
    workspace = await getDefaultWorkspaceByUser(user.id);
  }
  return workspace;
}

export async function GET() {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspace(user);
  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  const { listBriefingTemplatesByWorkspace } = await import("@/lib/db/queries");
  const templates = await listBriefingTemplatesByWorkspace(workspace.id);

  return NextResponse.json({
    ok: true,
    templates: templates.map((template) => ({
      ...template,
      keywords: template.keywordsJson ? JSON.parse(template.keywordsJson) : [],
    })),
  });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const workspace = await getWorkspace(user);
  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = briefingTemplateSchema.parse(body);
  const { createBriefingTemplate } = await import("@/lib/db/queries");

  const template = await createBriefingTemplate({
    workspaceId: workspace.id,
    name: parsed.name,
    topicHint: parsed.topicHint ?? null,
    niche: parsed.niche,
    subtitle: parsed.subtitle ?? null,
    keywordsJson: JSON.stringify(parsed.keywords),
    structureNotes: parsed.structureNotes ?? null,
    language: parsed.language,
    editorialTone: parsed.editorialTone,
    desiredLength: parsed.desiredLength,
    articleType: parsed.articleType,
    sourceCount: parsed.sourceCount,
    searchProvider: parsed.searchProvider,
    aiProvider: parsed.aiProvider,
    aiModelId: parsed.aiModelId,
  });

  // Index template in ChromaDB for semantic search
  try {
    const { indexSlide } = await import("@/lib/ai/chromadb");
    await indexSlide({
      id: `template_${template.id}`,
      content: [
        parsed.name,
        parsed.niche,
        parsed.topicHint,
        parsed.subtitle,
        parsed.structureNotes,
        parsed.keywords.join(", "),
      ].filter(Boolean).join("\n"),
      metadata: {
        type: "briefing-template",
        niche: parsed.niche,
        language: parsed.language,
        articleType: parsed.articleType,
        editorialTone: parsed.editorialTone,
        createdAt: new Date().toISOString(),
      },
    });
  } catch {}

  return NextResponse.json({ ok: true, template }, { status: 201 });
}
