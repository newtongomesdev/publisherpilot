import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  delete process.env.SEARXNG_URL;
  vi.resetModules();
});

describe("images search searxng fallback", () => {
  it("uses port 8080 when SEARXNG_URL is not defined", async () => {
    delete process.env.SEARXNG_URL;

    const originalFetch = global.fetch;
    let requestedUrl = "";

    global.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const { GET } = await import("@/app/api/images/search/route");
      const request = new Request("http://localhost:3000/api/images/search?q=atlas");
      await GET(request);
    } finally {
      global.fetch = originalFetch;
    }

    expect(requestedUrl).toContain("http://localhost:8080/search");
  });
});
