import { NextResponse } from "next/server";
import { searxngFetch } from "@/lib/searxng-client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const categories = searchParams.get("categories") || "general";
    const page = searchParams.get("page") || "1";
    const timeRange = searchParams.get("timeRange") || "";
    const language = searchParams.get("language") || "pt-BR";

    if (!q) {
      return NextResponse.json({ ok: false, error: "Query obrigatória" }, { status: 400 });
    }

    const params = new URLSearchParams({
      q,
      categories,
      format: "json",
      pageno: page,
      language,
    });

    if (timeRange) params.set("time_range", timeRange);

    console.log(`[api/search] q="${q}" cat=${categories} page=${page}`);

    // Index search query in ChromaDB for history
    try {
      const { indexSearch } = await import("@/lib/ai/chromadb");
      await indexSearch({
        id: `search_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        query: q.trim(),
        metadata: {
          categories,
          page,
          searchedAt: new Date().toISOString(),
        },
      });
    } catch {}

    const response = await searxngFetch(`/search?${params.toString()}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[api/search] SearXNG error: ${response.status} - ${text}`);
      return NextResponse.json({ ok: false, error: `SearXNG ${response.status}` }, { status: 400 });
    }

    const data = await response.json();

    const results = (data.results || []).map((r: any) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
      engine: r.engine || "",
      score: r.score || 0,
      thumbnail: r.thumbnail || null,
      imgSrc: r.img_src || null,
      publishedDate: r.publishedDate || null,
    }));

    // Collect which engines participated
    const enginesUsed = [...new Set(results.map((r: any) => r.engine))];
    const enginesDown = (data.unresponsive_engines || []).map((u: any) => ({
      engine: u[0],
      reason: u[1],
    }));

    return NextResponse.json({
      ok: true,
      query: q,
      categories,
      page: Number(page),
      totalPages: data.number_of_pages || 1,
      totalResults: data.number_of_results || results.length,
      enginesUsed,
      enginesDown,
      results,
    });
  } catch (error: any) {
    console.error("[api/search] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Falha ao buscar" },
      { status: 400 }
    );
  }
}
