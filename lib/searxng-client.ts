/**
 * SearXNG HTTP client that handles session cookies.
 *
 * Newer versions of SearXNG return 403 on /search?format=json unless the
 * request carries a valid session cookie (obtained by visiting the homepage
 * first). This module transparently manages that session so every search
 * request "just works".
 */

let cachedCookie: string | null = null;
let cookieExpiresAt = 0;

const COOKIE_TTL_MS = 10 * 60 * 1000; // refresh cookie every 10 minutes

function getSearxngUrl(): string {
  return process.env.SEARXNG_URL || "http://localhost:8080";
}

const COMMON_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "X-Forwarded-For": "127.0.0.1",
  "X-Real-IP": "127.0.0.1",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

async function refreshSessionCookie(): Promise<string | null> {
  try {
    const resp = await fetch(`${getSearxngUrl()}/`, {
      headers: COMMON_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) {
      // Extract just the cookie name=value part (before any ;)
      const cookie = setCookie.split(";")[0].trim();
      cachedCookie = cookie;
      cookieExpiresAt = Date.now() + COOKIE_TTL_MS;
      console.log("[searxng-client] Got session cookie:", cookie.slice(0, 40) + "...");
      return cookie;
    }

    // Some SearXNG configs don't set cookies on first visit; try the /search page
    const searchPage = await fetch(`${getSearxngUrl()}/search?q=test&format=html`, {
      headers: COMMON_HEADERS,
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    const setCookie2 = searchPage.headers.get("set-cookie");
    if (setCookie2) {
      const cookie = setCookie2.split(";")[0].trim();
      cachedCookie = cookie;
      cookieExpiresAt = Date.now() + COOKIE_TTL_MS;
      console.log("[searxng-client] Got session cookie from /search:", cookie.slice(0, 40) + "...");
      return cookie;
    }

    console.warn("[searxng-client] No set-cookie header received from SearXNG");
    return null;
  } catch (err: any) {
    console.error("[searxng-client] Failed to get session cookie:", err?.message);
    return null;
  }
}

async function getSessionCookie(): Promise<string | null> {
  if (cachedCookie && Date.now() < cookieExpiresAt) {
    return cachedCookie;
  }
  return refreshSessionCookie();
}

/**
 * Perform a search query against SearXNG with automatic session management.
 */
export async function searxngFetch(
  path: string,
  options?: { timeoutMs?: number },
): Promise<Response> {
  const baseUrl = getSearxngUrl();
  const url = `${baseUrl}${path}`;
  const timeout = options?.timeoutMs ?? 15000;

  const cookie = await getSessionCookie();

  const headers: Record<string, string> = {
    ...COMMON_HEADERS,
    Accept: "application/json, text/javascript, */*; q=0.01",
    Referer: `${baseUrl}/`,
    "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
  };

  if (cookie) {
    headers.Cookie = cookie;
  }

  const resp = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(timeout),
  });

  // If we get 403, try refreshing the cookie once and retry
  if (resp.status === 403 && cookie) {
    console.warn("[searxng-client] Got 403, refreshing session cookie and retrying...");
    cachedCookie = null;
    cookieExpiresAt = 0;
    const newCookie = await refreshSessionCookie();
    if (newCookie) {
      headers.Cookie = newCookie;
      return fetch(url, {
        headers,
        signal: AbortSignal.timeout(timeout),
      });
    }
  }

  return resp;
}
