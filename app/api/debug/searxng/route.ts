import { NextResponse } from "next/server";
import { searxngFetch } from "@/lib/searxng-client";

/**
 * Diagnostic endpoint to test SearXNG connectivity.
 * GET /api/debug/searxng
 */
export async function GET() {
  const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8080";
  const diagnostics: Record<string, unknown> = {
    searxngUrl,
    timestamp: new Date().toISOString(),
  };

  // Test 1: Can we reach SearXNG at all?
  try {
    const healthResp = await fetch(`${searxngUrl}/`, {
      signal: AbortSignal.timeout(5000),
    });
    diagnostics.healthStatus = healthResp.status;
    diagnostics.healthOk = healthResp.ok;
  } catch (err: any) {
    diagnostics.healthError = err?.message || String(err);
  }

  // Test 2: JSON search via session-aware client
  try {
    const searchResp = await searxngFetch("/search?q=test&categories=general&format=json&pageno=1");
    diagnostics.searchStatus = searchResp.status;
    diagnostics.searchOk = searchResp.ok;

    if (searchResp.ok) {
      const data = await searchResp.json();
      diagnostics.searchResultCount = data.results?.length ?? 0;
      diagnostics.searchEngines = [...new Set((data.results ?? []).map((r: any) => r.engine))];
      diagnostics.firstResult = data.results?.[0]
        ? { title: data.results[0].title, url: data.results[0].url }
        : null;
    } else {
      diagnostics.searchErrorBody = (await searchResp.text()).slice(0, 500);
    }
  } catch (err: any) {
    diagnostics.searchError = err?.message || String(err);
  }

  // Test 3: Image search via session-aware client
  try {
    const imgResp = await searxngFetch("/search?q=nature&categories=images&format=json&pageno=1");
    diagnostics.imageSearchStatus = imgResp.status;
    diagnostics.imageSearchOk = imgResp.ok;

    if (imgResp.ok) {
      const data = await imgResp.json();
      diagnostics.imageResultCount = data.results?.length ?? 0;
      diagnostics.firstImage = data.results?.[0]
        ? { title: data.results[0].title, img_src: data.results[0].img_src }
        : null;
    } else {
      diagnostics.imageSearchErrorBody = (await imgResp.text()).slice(0, 500);
    }
  } catch (err: any) {
    diagnostics.imageSearchError = err?.message || String(err);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
