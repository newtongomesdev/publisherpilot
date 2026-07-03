export type ImageProviderKey = "sources" | "wikimedia" | "openverse" | "searxng" | "unsplash" | "pexels" | "pixabay" | "fal";

export type ArticleImage = {
  url: string;
  alt: string;
  source: string;
  provider: ImageProviderKey;
};

export const IMAGE_PROVIDER_LABELS: Record<ImageProviderKey, string> = {
  sources: "Imagens das fontes",
  wikimedia: "Wikimedia Commons",
  openverse: "Openverse (WordPress)",
  searxng: "SearXNG (Metasearch)",
  unsplash: "Unsplash",
  pexels: "Pexels",
  pixabay: "Pixabay",
  fal: "Fal.ai (IA)",
};

/** Providers that work without any API key */
export const FREE_PROVIDERS: ImageProviderKey[] = ["wikimedia", "searxng"];

/** Providers that require API credentials (configured via env vars) */
export const AUTH_PROVIDERS: ImageProviderKey[] = ["openverse", "fal"];


/** Min width in pixels to accept an image */
const MIN_WIDTH = 800;
/** Min height in pixels to accept an image */
const MIN_HEIGHT = 500;

// ─── Shared dedup helpers ────────────────────────────────────────

/**
 * Extract a filename-like key from a URL for cross-provider dedup.
 * E.g. "https://upload.wikimedia.org/w/thumb/foo/Bar_Baz.jpg/800px-Bar_Baz.jpg"
 *  → "bar_baz"
 */
function imageIdentityKey(url: string): string {
  try {
    const u = new URL(url);
    // Get last meaningful path segment
    const segments = u.pathname.split("/").filter(Boolean);
    const last = segments[segments.length - 1] ?? "";
    // Strip size suffixes like "800px-" "1024px-" "1200x800"
    return last
      .replace(/^\d+px[-_]/i, "")
      .replace(/^\d+x\d+[-_]/i, "")
      .split("?")[0]
      .toLowerCase()
      .replace(/\.(jpg|jpeg|png|webp)$/i, "");
  } catch {
    return url.split("?")[0].split("#")[0].toLowerCase();
  }
}

// ─── Wikimedia Commons (no key required) ─────────────────────────
async function searchWikimedia(query: string, limit: number): Promise<ArticleImage[]> {
  try {
    // Request full-size URL and a 1400px thumbnail as fallback
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit * 2}&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1400&format=json&origin=*`;
    const response = await fetch(apiUrl, {
      headers: { "User-Agent": "PublisherPilot/1.0 (article image search)" },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      query?: { pages?: Record<string, {
        imageinfo?: Array<{
          url: string;
          thumburl?: string;
          width?: number;
          height?: number;
          extmetadata?: { ImageDescription?: { value?: string }; Artist?: { value?: string } };
        }>;
      }> };
    };
    const pages = data.query?.pages;
    if (!pages) return [];

    return Object.values(pages)
      .filter((page) => {
        const info = page.imageinfo?.[0];
        if (!info) return false;
        const url = info.url.toLowerCase();
        if (!/\.(jpg|jpeg|png|webp)$/i.test(url)) return false;
        // Prefer images that are at least MIN_WIDTH wide
        if (info.width && info.width < MIN_WIDTH) return false;
        return true;
      })
      .sort((a, b) => {
        // Prefer larger images
        const aInfo = a.imageinfo?.[0];
        const bInfo = b.imageinfo?.[0];
        return (bInfo?.width ?? 0) - (aInfo?.width ?? 0);
      })
      .slice(0, limit)
      .map((page) => {
        const info = page.imageinfo![0];
        const alt = info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, "").slice(0, 200) ?? query;
        const author = info.extmetadata?.Artist?.value?.replace(/<[^>]+>/g, "").trim() ?? "";
        // Prefer full-size URL if reasonable, otherwise use the 1400px thumbnail
        const isLargeOriginal = (info.width ?? 0) >= MIN_WIDTH && (info.width ?? 0) <= 3000;
        return {
          url: isLargeOriginal ? info.url : (info.thumburl ?? info.url),
          alt,
          source: author ? `Wikimedia Commons — ${author}` : "Wikimedia Commons",
          provider: "wikimedia" as const,
        };
      });
  } catch {
    return [];
  }
}

// ─── Unsplash ────────────────────────────────────────────────────
async function searchUnsplash(query: string, limit: number): Promise<ArticleImage[]> {
  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${limit}&orientation=landscape&min_width=${MIN_WIDTH}`,
      {
        headers: {
          "Accept-Version": "v1",
          "Authorization": "Client-ID Wl7XU6O4IlOeE9IJDI4oZKIl6r4bXQGhRfRjN3YgUd0",
        },
      },
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: Array<{ urls?: { regular?: string }; alt_description?: string; width?: number; height?: number }> };
    return (data.results ?? [])
      .filter((item) => (item.width ?? 0) >= MIN_WIDTH)
      .slice(0, limit)
      .map((item) => ({
        url: item.urls?.regular ?? "",
        alt: item.alt_description ?? query,
        source: "Unsplash",
        provider: "unsplash" as const,
      }))
      .filter((img) => img.url);
  } catch {
    return [];
  }
}

// ─── Pexels (scraping) ──────────────────────────────────────────
async function searchPexels(query: string, limit: number): Promise<ArticleImage[]> {
  try {
    const response = await fetch(
      `https://www.pexels.com/search/${encodeURIComponent(query)}/`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        },
      },
    );
    if (!response.ok) return [];
    const html = await response.text();
    const imagePattern = /https:\/\/images\.pexels\.com\/photos\/[^"'\s]+(?:\?[^"'\s]*)?/g;
    const matches = html.match(imagePattern) ?? [];
    const seen = new Set<string>();
    const results: ArticleImage[] = [];
    for (const url of matches) {
      if (results.length >= limit) break;
      const base = url.split("?")[0];
      if (seen.has(base)) continue;
      seen.add(base);
      // Request 1260px wide version
      results.push({
        url: base + "?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        alt: query,
        source: "Pexels",
        provider: "pexels",
      });
    }
    return results;
  } catch {
    return [];
  }
}

// ─── Pixabay ─────────────────────────────────────────────────────
async function searchPixabay(query: string, limit: number): Promise<ArticleImage[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  try {
    const response = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=${MIN_WIDTH}&min_height=${MIN_HEIGHT}&per_page=${limit}`,
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { hits?: Array<{ largeImageURL?: string; webformatURL?: string; tags?: string; imageWidth?: number }> };
    return (data.hits ?? [])
      .filter((item) => (item.imageWidth ?? 0) >= MIN_WIDTH)
      .slice(0, limit)
      .map((item) => ({
        url: item.largeImageURL ?? item.webformatURL ?? "",
        alt: item.tags ?? query,
        source: "Pixabay",
        provider: "pixabay" as const,
      }))
      .filter((img) => img.url);
  } catch {
    return [];
  }
}

// ─── Openverse OAuth2 token cache ───────────────────────────────
let openverseToken: string | null = null;
let openverseTokenExpiresAt = 0;

async function getOpenverseToken(): Promise<string | null> {
  // Reuse cached token if still valid (refresh 5 min early)
  if (openverseToken && Date.now() < openverseTokenExpiresAt - 300_000) {
    return openverseToken;
  }

  const clientId = process.env.OPENVERSE_CLIENT_ID;
  const clientSecret = process.env.OPENVERSE_CLIENT_SECRET;

  // If credentials are configured, use them
  if (clientId && clientSecret) {
    try {
      const resp = await fetch("https://api.openverse.org/v1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "client_credentials",
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (resp.ok) {
        const data = (await resp.json()) as { access_token?: string; expires_in?: number };
        if (data.access_token) {
          openverseToken = data.access_token;
          openverseTokenExpiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
          return openverseToken;
        }
      }
    } catch { /* fall through to anonymous */ }
  }

  // No credentials or token fetch failed — return null for anonymous access
  return null;
}

// ─── Openverse (WordPress free images) ──────────────────────────
async function searchOpenverse(query: string, limit: number): Promise<ArticleImage[]> {
  try {
    const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=${limit * 2}&license_type=commercial`;
    const token = await getOpenverseToken();
    const headers: Record<string, string> = { "User-Agent": "PublisherPilot/1.0 (article image search)" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const resp = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!resp.ok) { console.log("[openverse] Status:", resp.status, token ? "(authenticated)" : "(anonymous)"); return []; }
    const data = (await resp.json()) as {
      result_count?: number;
      results?: Array<{
        url?: string;
        title?: string;
        source?: string;
        creator?: string;
        width?: number;
        height?: number;
      }>;
    };
    console.log("[openverse] Found:", data.result_count ?? 0, "results");
    return (data.results ?? [])
      .filter((item) => {
        if (!item.url) return false;
        if (item.width && item.width < MIN_WIDTH) return false;
        return true;
      })
      .slice(0, limit)
      .map((item) => ({
        url: item.url ?? "",
        alt: item.title?.replace(/<[^>]+>/g, "").slice(0, 200) ?? query,
        source: item.creator ? `Openverse/${item.source ?? "unknown"} — ${item.creator}` : `Openverse/${item.source ?? "unknown"}`,
        provider: "openverse" as const,
      }));
  } catch {
    return [];
  }
}

// ─── SearXNG (metasearch, no key required) ──────────────────────
// Uses public SearXNG instances to aggregate image results from multiple engines.
// Configure a custom instance via SEARXNG_URL env var, or uses public instances.
const SEARXNG_PUBLIC_INSTANCES = [
  "https://search.sapti.me",
  "https://searx.tiekoetter.com",
  "https://searx.be",
  "https://search.bus-hit.me",
  "https://searx.work",
];

async function searchSearXNG(query: string, limit: number): Promise<ArticleImage[]> {
  const baseUrl = process.env.SEARXNG_URL || "";
  const instances = baseUrl ? [baseUrl] : SEARXNG_PUBLIC_INSTANCES;

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&categories=images&format=json&image_proxy=0&safesearch=0&pageno=1`;
      const resp = await fetch(url, {
        headers: { 
          "User-Agent": "PublisherPilot/1.0 (article image search)",
          "X-Forwarded-For": "127.0.0.1",
          "X-Real-IP": "127.0.0.1"
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;

      const data = (await resp.json()) as {
        results?: Array<{
          img_src?: string;
          thumbnail_src?: string;
          title?: string;
          engine?: string;
          source?: string;
          width?: number;
          height?: number;
        }>;
      };

      const results: ArticleImage[] = [];
      for (const item of (data.results ?? [])) {
        if (results.length >= limit) break;
        const imgUrl = item.img_src || item.thumbnail_src;
        if (!imgUrl || imgUrl.startsWith("data:")) continue;
        if (/\.(svg|gif|ico)(\?|$)/i.test(imgUrl)) continue;
        if (item.width && item.width < MIN_WIDTH) continue;
        if (item.height && item.height < MIN_HEIGHT) continue;

        const domain = (() => { try { return new URL(imgUrl).hostname.replace("www.", ""); } catch { return item.engine ?? "searxng"; } })();
        results.push({
          url: imgUrl,
          alt: (item.title ?? query).replace(/<[^>]+>/g, "").slice(0, 200),
          source: `${item.engine ?? "SearXNG"}/${domain}`,
          provider: "searxng",
        });
      }

      if (results.length > 0) return results;
    } catch {
      continue; // try next instance
    }
  }
  return [];
}

// ─── Images from research sources (no key required) ─────────────
export type SourceUrl = { title: string; url: string; domain: string; snippet?: string };

const SKIP_IMG_PATTERNS = /logo|icon|favicon|avatar|sprite|badge|banner[-_]ad|widget|button|arrow|caret|spinner|loader|placeholder|og[-_]image|twitter[-_]card|thumbnail|share[-_]image|social|payment|shipping|flag|emoji|marker|pin|bullet|check|cross|close|x[\.\-_]|menu|hamburger|search[\.\-_]icon|cart|heart|star[\.\-_]|rating|verified|sponsor|advert|tracking|pixel|analytics|1x1|spacer|blank|transparent|loading|wp-emoji/i;

const SKIP_IMG_URL_PATTERNS = /\.(svg|gif|ico)(\?|$)/i;
const SKIP_DIMENSIONS = /(\d+)x(\d+)/i;
const SKIP_ALT_PATTERNS = /logo|icon|favicon|avatar|badge|brand|company|branding|site[\s-]name/i;

async function searchSourcesImages(query: string, limit: number, sources?: SourceUrl[]): Promise<ArticleImage[]> {
  if (!sources || sources.length === 0) return [];

  const results: ArticleImage[] = [];
  const seen = new Set<string>();
  const maxPerSource = Math.max(1, Math.ceil(limit / sources.length));

  const pages = await Promise.allSettled(
    sources.slice(0, 5).map(async (source) => {
      try {
        const response = await fetch(source.url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; PublisherPilot/1.0)" },
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) return { domain: source.domain, html: "" };
        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) return { domain: source.domain, html: "" };
        return { domain: source.domain, html: await response.text() };
      } catch {
        return { domain: source.domain, html: "" };
      }
    }),
  );

  for (const page of pages) {
    if (page.status !== "fulfilled" || !page.value.html) continue;
    const { domain, html } = page.value;

    // Remove header/nav/footer/sidebar to avoid template images
    const cleanedHtml = html
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "");

    const contentMatch = cleanedHtml.match(/<article[\s\S]*?<\/article>/i)
      || cleanedHtml.match(/<main[\s\S]*?<\/main>/i);
    const contentHtml = contentMatch ? contentMatch[0] : cleanedHtml;

    const imgPattern = /<img[^>]+>/gi;
    let match: RegExpExecArray | null;
    let count = 0;

    while ((match = imgPattern.exec(contentHtml)) !== null && count < maxPerSource && results.length < limit) {
      const fullTag = match[0];

      const srcMatch = fullTag.match(/(?:src|data-src|data-lazy-src)=["']([^"']+)["']/i);
      if (!srcMatch) continue;
      let imgUrl = srcMatch[1];

      const altMatch = fullTag.match(/alt=["']([^"']*)["']/i);
      const alt = altMatch?.[1] || query;

      const widthMatch = fullTag.match(/\bwidth=["']?(\d+)/i);
      const heightMatch = fullTag.match(/\bheight=["']?(\d+)/i);
      const w = widthMatch ? parseInt(widthMatch[1]) : 0;
      const h = heightMatch ? parseInt(heightMatch[1]) : 0;

      if (imgUrl.startsWith("data:")) continue;
      if (SKIP_IMG_URL_PATTERNS.test(imgUrl)) continue;
      if (SKIP_IMG_PATTERNS.test(imgUrl)) continue;
      if (SKIP_ALT_PATTERNS.test(alt)) continue;

      // Enforce minimum dimensions
      if (w > 0 && h > 0) {
        if (w < MIN_WIDTH || h < MIN_HEIGHT) continue;
        if (w === h && w < 500) continue;
        if (w > h * 5) continue;
        if (h > w * 3) continue;
      }

      const sizeMatch = imgUrl.match(SKIP_DIMENSIONS);
      if (sizeMatch) {
        const sw = parseInt(sizeMatch[1]);
        const sh = parseInt(sizeMatch[2]);
        if (sw < MIN_WIDTH || sh < MIN_HEIGHT) continue;
      }

      if (/\/(?:thumb|small|tiny|mini|_s\.|_t\.|150|200|300|48|64|32|16)[\/\._-]/i.test(imgUrl)) continue;

      if (imgUrl.startsWith("//")) {
        imgUrl = `https:${imgUrl}`;
      } else if (imgUrl.startsWith("/")) {
        imgUrl = `https://${domain}${imgUrl}`;
      } else if (!imgUrl.startsWith("http")) {
        continue;
      }

      // Skip same-domain small images
      try {
        const imgHost = new URL(imgUrl).hostname;
        if (imgHost === domain && w > 0 && w < 800) continue;
      } catch { continue; }

      const cleanUrl = imgUrl.split("?")[0];

      // Cross-provider dedup: check identity key too
      const identityKey = imageIdentityKey(imgUrl);
      if (seen.has(cleanUrl) || (identityKey.length > 5 && seen.has(`key:${identityKey}`))) continue;
      seen.add(cleanUrl);
      if (identityKey.length > 5) seen.add(`key:${identityKey}`);
      count++;

      results.push({
        url: imgUrl,
        alt: alt.replace(/<[^>]+>/g, "").slice(0, 200),
        source: domain,
        provider: "sources",
      });
    }
  }

  return results;
}

async function searchFal(
  query: string,
  limit: number,
  sources?: SourceUrl[],
  options?: { falImageModel?: string },
): Promise<ArticleImage[]> {
  try {
    const { falImageProvider } = await import("@/lib/images/providers/fal");
    const model = options?.falImageModel || "fal-ai/flux/schnell";
    const res = await falImageProvider.generateImage({
      prompt: query,
      model,
      aspectRatio: "16:9",
    });
    if (res.url) {
      return [
        {
          url: res.url,
          alt: query,
          source: `Fal.ai (${model})`,
          provider: "fal",
        },
      ];
    }
  } catch (error) {
    console.error("[providers] searchFal failed:", error);
  }
  return [];
}

const PROVIDER_MAP: Record<
  ImageProviderKey,
  (query: string, limit: number, sources?: SourceUrl[], options?: { falImageModel?: string }) => Promise<ArticleImage[]>
> = {
  sources: searchSourcesImages,
  wikimedia: searchWikimedia,
  openverse: searchOpenverse,
  searxng: searchSearXNG,
  unsplash: searchUnsplash,
  pexels: searchPexels,
  pixabay: searchPixabay,
  fal: searchFal,
};

function normalizeImageUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.toLowerCase().replace(/\/+$/, "");
  } catch {
    return url.split("?")[0].split("#")[0].toLowerCase().replace(/\/+$/, "");
  }
}

export async function searchImagesFromProviders(
  query: string,
  providers: ImageProviderKey[],
  limitPerProvider = 3,
  sources?: SourceUrl[],
  options?: { falImageModel?: string },
): Promise<ArticleImage[]> {
  if (providers.length === 0) return [];

  console.log("[img-search] Query:", query, "Providers:", providers.join(","), "Limit:", limitPerProvider);

  const results = await Promise.allSettled(
    providers.map(async (key) => {
      const searchFn = PROVIDER_MAP[key];
      if (!searchFn) return [];
      const r = await searchFn(query, limitPerProvider, sources, options);
      console.log(`[img-search] ${key} returned ${r.length} images`);
      return r;
    }),
  );

  const allImages: ArticleImage[] = [];
  const seenNormalized = new Set<string>();
  const seenIdentity = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const img of result.value) {
        const normalized = normalizeImageUrl(img.url);
        const identityKey = imageIdentityKey(img.url);

        // Skip if same normalized URL or same identity key
        if (seenNormalized.has(normalized)) continue;
        if (identityKey.length > 5 && seenIdentity.has(identityKey)) continue;

        seenNormalized.add(normalized);
        if (identityKey.length > 5) seenIdentity.add(identityKey);
        allImages.push(img);
      }
    }
  }

  return allImages;

}
