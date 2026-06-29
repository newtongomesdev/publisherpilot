import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";

export async function DELETE(request: Request) {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const ids = body.ids as string[];

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No IDs provided" }, { status: 400 });
    }

    const { getArticleProjectById, deleteArticleProjectsByIds } = await import("@/lib/db/queries");

    // Verify ownership of all projects
    // Doing it sequentially is fine for small numbers, or we can use Promise.all
    const ownershipChecks = await Promise.all(
      ids.map(id => getArticleProjectById(id, user.id))
    );

    const validIds = ids.filter((_, index) => ownershipChecks[index] != null);

    if (validIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Not found or unauthorized" }, { status: 404 });
    }

    await deleteArticleProjectsByIds(validIds);

    // Remove from ChromaDB
    try {
      const { removeArticle } = await import("@/lib/ai/chromadb");
      await Promise.all(validIds.map((id) => removeArticle(id)));
    } catch {}

    return NextResponse.json({ ok: true, deletedCount: validIds.length });
  } catch (err: any) {
    console.error("[articles/bulk] DELETE error:", err?.message);
    return NextResponse.json({ ok: false, error: err?.message || "Internal error" }, { status: 500 });
  }
}
