import { createHash } from "node:crypto";
import { replaceProjectSources } from "@/lib/db/queries";
import { dedupeSources } from "@/lib/search/dedupe";
import { getSearchProvider } from "@/lib/search/registry";
import { rankSources } from "@/lib/search/rank";

export async function runSearchJob(payload: Record<string, unknown>) {
  const query = String(payload.query ?? "");
  const providerName = String(payload.provider ?? "duckduckgo");
  const limit = Number(payload.limit ?? 5);
  const provider = getSearchProvider(providerName);

  if (!provider) {
    throw new Error(`Unknown search provider: ${providerName}`);
  }

  const raw = await provider.search(query, { limit });
  const ranked = rankSources(query, dedupeSources(raw));

  await replaceProjectSources(
    String(payload.articleProjectId),
    ranked.map((item) => ({
      articleProjectId: String(payload.articleProjectId),
      title: item.title,
      url: item.url,
      domain: item.domain,
      snippet: item.snippet,
      publishedAt: item.publishedAt ? new Date(item.publishedAt) : null,
      searchProvider: item.provider,
      relevanceScore: item.relevanceScore,
      dedupeHash: createHash("sha1").update(item.url).digest("hex"),
    })),
  );
}
