import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { urls, niche } = await request.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ ok: false, error: "Lista de URLs obrigatória" }, { status: 400 });
    }

    const { indexCompetitorBatch } = await import("@/lib/ai/chromadb");

    const items: { id: string; text: string; metadata: Record<string, string> }[] = [];

    // Fetch each URL and extract text content
    for (const url of urls.slice(0, 20)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const resp = await fetch(url, {
          signal: controller.signal,
          headers: { "User-Agent": "Mozilla/5.0 (compatible; AtlasForgeBot/1.0)" },
        });
        clearTimeout(timeout);

        if (!resp.ok) continue;

        const html = await resp.text();

        // Extract text from HTML (basic extraction)
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 10000);

        if (text.length > 100) {
          const domain = new URL(url).hostname;
          items.push({
            id: `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            text,
            metadata: {
              url,
              domain,
              niche: niche || "",
              scrapedAt: new Date().toISOString(),
            },
          });
        }
      } catch {
        // Skip failed URLs
      }
    }

    if (items.length === 0) {
      return NextResponse.json({ ok: false, error: "Nenhum conteúdo extraído" }, { status: 422 });
    }

    const indexed = await indexCompetitorBatch(items);

    return NextResponse.json({
      ok: true,
      indexed,
      total: urls.length,
      failed: urls.length - indexed,
    });
  } catch (error: any) {
    console.error("[api/search/competitors] Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Falha ao analisar concorrentes" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit") || "10"), 20);

    if (!q) {
      return NextResponse.json({ ok: false, error: "Query obrigatória" }, { status: 400 });
    }

    const { searchCompetitors } = await import("@/lib/ai/chromadb");
    const results = await searchCompetitors(q, limit);

    return NextResponse.json({
      ok: true,
      query: q,
      totalResults: results.length,
      results: results.map((r) => ({
        id: r.id,
        content: r.content.slice(0, 500),
        url: r.metadata.url || "",
        domain: r.metadata.domain || "",
        niche: r.metadata.niche || "",
        similarity: Math.round((1 - r.distance) * 100),
        scrapedAt: r.metadata.scrapedAt || null,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
