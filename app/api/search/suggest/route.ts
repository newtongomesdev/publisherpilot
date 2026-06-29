import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, limit = 5 } = await request.json();

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ ok: false, error: "Texto muito curto" }, { status: 400 });
    }

    const { searchArticles, searchTranscriptions, searchCompetitors } = await import("@/lib/ai/chromadb");

    // Search across articles, transcriptions, and competitors simultaneously
    const [articles, transcriptions, competitors] = await Promise.all([
      searchArticles(text, limit).catch(() => []),
      searchTranscriptions(text, limit).catch(() => []),
      searchCompetitors(text, limit).catch(() => []),
    ]);

    // Merge and deduplicate by similarity
    const all = [
      ...articles.map((r) => ({ ...r, source: "articles" as const })),
      ...transcriptions.map((r) => ({ ...r, source: "transcriptions" as const })),
      ...competitors.map((r) => ({ ...r, source: "competitors" as const })),
    ]
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const suggestions = all.map((r) => ({
      id: r.id,
      content: r.content.slice(0, 500),
      source: r.source,
      similarity: Math.round((1 - r.distance) * 100),
      title: (r.metadata as any)?.title || (r.metadata as any)?.domain || "",
    }));

    return NextResponse.json({
      ok: true,
      suggestions,
      sources: {
        articles: articles.length,
        transcriptions: transcriptions.length,
        competitors: competitors.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
