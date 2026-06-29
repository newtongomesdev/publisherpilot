import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") || "10"), 20);

    if (!q) {
      return NextResponse.json({ ok: false, error: "Query obrigatória" }, { status: 400 });
    }

    const { searchArticles } = await import("@/lib/ai/chromadb");

    console.log(`[api/search/semantic] q="${q}" limit=${limit}`);

    const results = await searchArticles(q, limit);

    return NextResponse.json({
      ok: true,
      query: q,
      totalResults: results.length,
      results: results.map((r) => ({
        id: r.id,
        content: r.content.slice(0, 500),
        title: r.metadata.title || "Sem título",
        niche: r.metadata.niche || "",
        language: r.metadata.language || "",
        projectId: r.metadata.projectId || r.id,
        distance: r.distance,
        similarity: Math.round((1 - r.distance) * 100),
        createdAt: r.metadata.createdAt || null,
      })),
    });
  } catch (error: any) {
    console.error("[api/search/semantic] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Falha na busca semântica" },
      { status: 500 }
    );
  }
}
