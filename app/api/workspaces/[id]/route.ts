import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { listWorkspacesByUser, updateWorkspaceName } = await import("@/lib/db/queries");
    
    // Verify ownership
    const workspaces = await listWorkspacesByUser(user.id);
    const workspace = workspaces.find((w) => w.id === id);
    if (!workspace) {
      return NextResponse.json({ ok: false, error: "Not found or unauthorized" }, { status: 404 });
    }

    const body = await request.json();
    if (!body.name || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ ok: false, error: "Invalid name" }, { status: 400 });
    }

    await updateWorkspaceName(id, body.name.trim());
    
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[workspaces/id] PATCH error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
