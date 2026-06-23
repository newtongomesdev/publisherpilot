import { NextResponse } from "next/server";
import { z } from "zod";
import type { SearchResult } from "@/lib/search/search-provider";

const searchRequestSchema = z.object({
  query: z.string().min(1),
  provider: z.enum(["duckduckgo", "searxng", "both"]),
  limit: z.number().int().min(1).max(20).default(5),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = searchRequestSchema.parse(body);
  const { ensureSearchProvidersRegistered } = await import("@/lib/search/bootstrap");
  const { dedupeSources } = await import("@/lib/search/dedupe");
  const { getSearchProvider } = await import("@/lib/search/registry");
  const { rankSources } = await import("@/lib/search/rank");
  ensureSearchProvidersRegistered();

  const providerNames =
    parsed.provider === "both" ? (["duckduckgo", "searxng"] as const) : ([parsed.provider] as const);
  const results: SearchResult[] = [];

  for (const providerName of providerNames) {
    const provider = getSearchProvider(providerName);
    if (!provider) {
      continue;
    }

    const providerResults = await provider.search(parsed.query, { limit: parsed.limit });
    results.push(...providerResults);
  }

  const ranked = rankSources(parsed.query, dedupeSources(results)).slice(0, parsed.limit);

  return NextResponse.json({ ok: true, search: parsed, results: ranked });
}
