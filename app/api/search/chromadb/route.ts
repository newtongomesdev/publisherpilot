import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { checkChromaHealth, searchPastSearches } = await import("@/lib/ai/chromadb");

    const health = await checkChromaHealth();

    // Get recent searches
    const recentSearches = await searchPastSearches("", 20).catch(() => []);

    return NextResponse.json({
      ok: health.ok,
      collections: health.collections,
      recentSearches: recentSearches.map((s) => ({
        query: s.content,
        categories: s.metadata.categories,
        searchedAt: s.metadata.searchedAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
