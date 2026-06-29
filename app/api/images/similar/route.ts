import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") || "6"), 20);

    if (!q) {
      return NextResponse.json({ ok: false, error: "Query obrigatória" }, { status: 400 });
    }

    const { searchSimilarImages } = await import("@/lib/ai/chromadb");
    const results = await searchSimilarImages(q, limit);

    return NextResponse.json({
      ok: true,
      query: q,
      totalResults: results.length,
      results: results.map((r) => ({
        id: r.id,
        content: r.content,
        metadata: r.metadata,
        similarity: Math.round((1 - r.distance) * 100),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
