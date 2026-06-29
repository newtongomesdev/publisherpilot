import { NextResponse } from "next/server";

const CACHE_SECONDS = 86400; // 24 hours

export async function GET(request: Request) {
  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(imageUrl);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Only allow http/https
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only http/https URLs allowed" }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Upstream error: ${response.status}` }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "image/jpeg";

    // Only serve image content types
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL does not point to an image" }, { status: 400 });
    }

    const body = await response.arrayBuffer();

    return new Response(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch image" },
      { status: 502 },
    );
  }
}
