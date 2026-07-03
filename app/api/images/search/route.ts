import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ ok: false, error: "Missing query" }, { status: 400 });
  }

  const searxngUrl = process.env.SEARXNG_URL || "http://localhost:8080";
  const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 20);

  try {
    const url = `${searxngUrl}/search?q=${encodeURIComponent(query)}&categories=images&format=json&image_proxy=0&safesearch=0&pageno=1`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "AtlasForge/1.0 (article image search)" },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `SearXNG returned ${resp.status}` }, { status: 400 });
    }

    const data = (await resp.json()) as { results?: Array<{
      img_src?: string;
      thumbnail?: string;
      title?: string;
      source?: string;
      url?: string;
    }> };

    const results = (data.results ?? [])
      .filter((r) => r.img_src)
      .slice(0, limit)
      .map((r) => {
        const imgSrc = r.img_src ?? "";
        // thumbnail is often empty from SearXNG, so always use img_src
        // Route through proxy to avoid CORS/hotlink blocks
        const proxy = (u: string) => u ? `/api/images/proxy?url=${encodeURIComponent(u)}` : "";
        return {
          src: proxy(imgSrc),
          thumbnail: proxy(imgSrc),
          title: r.title ?? "",
          source: r.source ?? "",
          pageUrl: r.url ?? "",
        };
      });

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: "Failed to reach SearXNG: " + err?.message }, { status: 400 });
  }
}
