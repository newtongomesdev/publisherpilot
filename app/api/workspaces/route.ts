import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { setActiveWorkspaceCookie } from "@/lib/workspaces/session";

const createWorkspaceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export async function GET() {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { listWorkspacesByUser } = await import("@/lib/db/queries");
  const workspaces = await listWorkspacesByUser(user.id);
  return NextResponse.json({ ok: true, workspaces });
}

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createWorkspaceSchema.parse(body);
  const { createWorkspace, upsertWorkspaceSettings } = await import("@/lib/db/queries");

  const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "workspace";
  const workspace = await createWorkspace({
    ownerUserId: user.id,
    name: parsed.name,
    slug,
    description: parsed.description ?? null,
    isDefault: false,
  });

  await upsertWorkspaceSettings({
    id: workspace.id,
    defaultLanguage: "pt-BR",
    defaultTone: "Especialista claro e convincente",
    defaultArticleType: "blog-post",
    blockedDomainsJson: JSON.stringify([]),
    preferredSearchProvider: "both",
    preferredAiProvider: "openrouter",
    preferredModelId: "",
  });

  await setActiveWorkspaceCookie(workspace.id);
  return NextResponse.json({ ok: true, workspace }, { status: 201 });
}
