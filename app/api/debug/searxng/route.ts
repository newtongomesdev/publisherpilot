import { NextResponse } from "next/server";

/**
 * Diagnostic endpoint to test SearXNG connectivity from within the app container.
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
      headers: {
        "X-Forwarded-For": "127.0.0.1",
        "X-Real-IP": "127.0.0.1",
      },
      signal: AbortSignal.timeout(5000),
    });
    diagnostics.healthStatus = healthResp.status;
    diagnostics.healthOk = healthResp.ok;
    diagnostics.healthContentType = healthResp.headers.get("content-type");
  } catch (err: any) {
    diagnostics.healthError = err?.message || String(err);
  }

  // Test 2: Can we perform a JSON search?
  try {
    const searchUrl = `${searxngUrl}/search?q=test&categories=general&format=json&pageno=1`;
    const searchResp = await fetch(searchUrl, {
      headers: {
        Accept: "application/json",
        "X-Forwarded-For": "127.0.0.1",
        "X-Real-IP": "127.0.0.1",
      },
      signal: AbortSignal.timeout(15000),
    });
    diagnostics.searchStatus = searchResp.status;
    diagnostics.searchOk = searchResp.ok;
    diagnostics.searchContentType = searchResp.headers.get("content-type");

    if (searchResp.ok) {
      const data = await searchResp.json();
      diagnostics.searchResultCount = data.results?.length ?? 0;
      diagnostics.searchEngines = [...new Set((data.results ?? []).map((r: any) => r.engine))];
      diagnostics.unresponsiveEngines = data.unresponsive_engines ?? [];
      diagnostics.firstResult = data.results?.[0]
        ? { title: data.results[0].title, url: data.results[0].url, engine: data.results[0].engine }
        : null;
    } else {
      const text = await searchResp.text();
      diagnostics.searchErrorBody = text.slice(0, 500);
    }
  } catch (err: any) {
    diagnostics.searchError = err?.message || String(err);
  }

  // Test 3: Can we perform an IMAGE search?
  try {
    const imgUrl = `${searxngUrl}/search?q=nature&categories=images&format=json&pageno=1`;
    const imgResp = await fetch(imgUrl, {
      headers: {
        Accept: "application/json",
        "X-Forwarded-For": "127.0.0.1",
        "X-Real-IP": "127.0.0.1",
      },
      signal: AbortSignal.timeout(15000),
    });
    diagnostics.imageSearchStatus = imgResp.status;
    diagnostics.imageSearchOk = imgResp.ok;

    if (imgResp.ok) {
      const data = await imgResp.json();
      diagnostics.imageResultCount = data.results?.length ?? 0;
      diagnostics.imageEngines = [...new Set((data.results ?? []).map((r: any) => r.engine))];
      diagnostics.firstImage = data.results?.[0]
        ? { title: data.results[0].title, img_src: data.results[0].img_src, engine: data.results[0].engine }
        : null;
    } else {
      const text = await imgResp.text();
      diagnostics.imageSearchErrorBody = text.slice(0, 500);
    }
  } catch (err: any) {
    diagnostics.imageSearchError = err?.message || String(err);
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
