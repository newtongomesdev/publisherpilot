import { createHash } from "node:crypto";
import { createJob, getArticleProjectById, replaceProjectSources, updateArticleProjectStatus } from "@/lib/db/queries";
import { createJobRecord } from "@/lib/jobs/queue";
import { ensureSearchProvidersRegistered } from "@/lib/search/bootstrap";
import { dedupeSources } from "@/lib/search/dedupe";
import { getSearchProvider } from "@/lib/search/registry";
import { rankSources } from "@/lib/search/rank";
import type { SearchResult } from "@/lib/search/search-provider";

export async function runSearchJob(payload: Record<string, unknown>) {
  const articleProjectId = String(payload.articleProjectId ?? "");
  console.log("[search-job] Starting search for project:", articleProjectId);

  const project = await getArticleProjectById(articleProjectId);
  if (!project) {
    throw new Error(`Unknown article project: ${articleProjectId}`);
  }

  try {
    ensureSearchProvidersRegistered();
    await updateArticleProjectStatus(project.id, "researching");

    const query = String(payload.query ?? `${project.topic} ${project.niche}`);
    const providerName = String(payload.provider ?? project.searchProvider ?? "duckduckgo");
    const limit = Number(payload.limit ?? project.sourceCount ?? 5);

    console.log("[search-job] Query:", query, "Provider:", providerName, "Limit:", limit);

    const providerNames =
      providerName === "both" ? (["duckduckgo", "searxng"] as const) : ([providerName] as const);

    const results: SearchResult[] = [];
    for (const name of providerNames) {
      const provider = getSearchProvider(name);
      if (!provider) {
        console.log("[search-job] Provider not found:", name);
        continue;
      }

      try {
        const providerResults = await provider.search(query, { limit, userId: project.userId ?? undefined });
        console.log("[search-job] Provider", name, "returned", providerResults.length, "results");
        results.push(...providerResults);
      } catch (e) {
        console.error("[search-job] Provider", name, "failed:", e);
      }
    }

    const ranked = rankSources(query, dedupeSources(results)).slice(0, limit);
    console.log("[search-job] Ranked", ranked.length, "sources");

    await replaceProjectSources(
      project.id,
      ranked.map((item) => ({
        articleProjectId: project.id,
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

    console.log("[search-job] Sources saved, creating generate job");
    await createJob(createJobRecord("generate", {
      articleProjectId: project.id,
      imageProviders: payload.imageProviders ?? [],
      falImageModel: payload.falImageModel,
    }));

  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed";
    console.error("[search-job] Error:", message);
    await updateArticleProjectStatus(project.id, "failed", message);
    throw error;
  }
}
