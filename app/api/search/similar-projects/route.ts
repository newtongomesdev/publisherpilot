import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") || "5"), 10);

    if (!q) {
      return NextResponse.json({ ok: false, error: "Query obrigatória" }, { status: 400 });
    }

    const { getRelatedArticles } = await import("@/lib/ai/chromadb");
    const results = await getRelatedArticles(q, limit);

    return NextResponse.json({
      ok: true,
      query: q,
      results: results.map((r) => ({
        projectId: r.id,
        title: r.title,
        niche: r.niche,
        similarity: r.similarity,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
