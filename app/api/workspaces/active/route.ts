import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";
import { getWorkspaceById } from "@/lib/db/queries";
import { setActiveWorkspaceCookie } from "@/lib/workspaces/session";

const activeWorkspaceSchema = z.object({
  workspaceId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = activeWorkspaceSchema.parse(body);
  const workspace = await getWorkspaceById(parsed.workspaceId, user.id);

  if (!workspace) {
    return NextResponse.json({ ok: false, error: "Workspace not found" }, { status: 404 });
  }

  await setActiveWorkspaceCookie(workspace.id);
  return NextResponse.json({ ok: true, workspace });
}
