/**
 * ChromaDB Client - Busca semântica multi-collection.
 *
 * Collections:
 *   articles     - Artigos gerados (título + corpo + FAQ)
 *   images       - Descrições de imagens geradas
 *   slides       - Conteúdo de slides de carrossel
 *   searches     - Histórico de buscas SearXNG
 *   competitors  - Conteúdo scraped de concorrentes
 */

import { ChromaClient, Collection } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

const CHROMA_URL = process.env.CHROMADB_URL || "http://localhost:8100";

// ─── Types ───────────────────────────────────────────────────

export type SearchResult = {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  distance: number;
};

export type DuplicateCheck = {
  isDuplicate: boolean;
  similarity: number;
  existingId: string;
  existingTitle: string;
};

export type ContentRecommendation = {
  id: string;
  title: string;
  niche: string;
  similarity: number;
  suggestedTopics: string[];
};

// ─── Singleton ───────────────────────────────────────────────

let _client: ChromaClient | null = null;
const _collections: Record<string, Collection> = {};

function getClient(): ChromaClient {
  if (!_client) {
    const url = new URL(CHROMA_URL);
    _client = new ChromaClient({
      host: url.hostname,
      port: Number(url.port) || 8000,
      ssl: url.protocol === "https:",
    });
  }
  return _client;
}

const ef = new DefaultEmbeddingFunction();

async function getCollection(name: string): Promise<Collection> {
  if (_collections[name]) return _collections[name];
  const client = getClient();
  _collections[name] = await client.getOrCreateCollection({
    name,
    embeddingFunction: ef,
    metadata: { "hnsw:space": "cosine" },
  });
  return _collections[name];
}

// ═══════════════════════════════════════════════════════════════
// 1. ARTICLES - Indexação, busca, duplicatas, recomendações
// ═══════════════════════════════════════════════════════════════

export async function indexArticle(article: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("articles");
    await col.upsert({
      ids: [article.id],
      documents: [article.content],
      metadatas: [article.metadata],
    });
    console.log(`[chromadb:articles] Indexed: ${article.id}`);
    return true;
  } catch (err) {
    console.error("[chromadb:articles] Failed to index:", err);
    return false;
  }
}

export async function checkDuplicateArticle(
  title: string,
  content: string,
  threshold = 0.3,
): Promise<DuplicateCheck> {
  try {
    const col = await getCollection("articles");
    const count = await col.count();
    if (count === 0) return { isDuplicate: false, similarity: 0, existingId: "", existingTitle: "" };

    const queryText = `${title}\n${content.slice(0, 1000)}`;
    const result = await col.query({ queryTexts: [queryText], nResults: 1 });

    const dist = result.distances?.[0]?.[0] ?? 1;
    const similarity = 1 - dist;

    if (similarity >= (1 - threshold)) {
      return {
        isDuplicate: true,
        similarity: Math.round(similarity * 100),
        existingId: result.ids?.[0]?.[0] || "",
        existingTitle: (result.metadatas?.[0]?.[0] as any)?.title || "",
      };
    }

    return { isDuplicate: false, similarity: Math.round(similarity * 100), existingId: "", existingTitle: "" };
  } catch (err) {
    console.error("[chromadb:articles] Duplicate check failed:", err);
    return { isDuplicate: false, similarity: 0, existingId: "", existingTitle: "" };
  }
}

export async function getRelatedArticles(
  query: string,
  limit = 5,
  excludeId?: string,
): Promise<ContentRecommendation[]> {
  try {
    const col = await getCollection("articles");
    const count = await col.count();
    if (count === 0) return [];

    const result = await col.query({
      queryTexts: [query],
      nResults: Math.min(limit + (excludeId ? 2 : 0), 20),
    });

    const ids = result.ids?.[0] || [];
    const metadatas = result.metadatas?.[0] || [];
    const distances = result.distances?.[0] || [];

    return ids
      .map((id: string, i: number) => ({
        id,
        title: (metadatas[i] as any)?.title || "",
        niche: (metadatas[i] as any)?.niche || "",
        similarity: Math.round((1 - (distances[i] || 0)) * 100),
        suggestedTopics: [],
      }))
      .filter((r) => r.id !== excludeId)
      .slice(0, limit);
  } catch (err) {
    console.error("[chromadb:articles] Related search failed:", err);
    return [];
  }
}

export async function searchArticles(
  query: string,
  limit = 5,
  filter?: { projectId?: string; workspaceId?: string; niche?: string },
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("articles");

    const where: Record<string, any> = {};
    if (filter?.projectId) where.projectId = filter.projectId;
    if (filter?.workspaceId) where.workspaceId = filter.workspaceId;
    if (filter?.niche) where.niche = filter.niche;

    const queryOptions: any = {
      queryTexts: [query],
      nResults: limit,
    };

    if (Object.keys(where).length > 0) {
      queryOptions.where = Object.keys(where).length === 1 ? where : { $and: Object.entries(where).map(([k, v]) => ({ [k]: v })) };
    }

    const result = await col.query(queryOptions);

    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:articles] Search failed:", err);
    return [];
  }
}

export async function removeArticle(id: string): Promise<boolean> {
  try {
    const col = await getCollection("articles");
    await col.delete({ ids: [id] });
    return true;
  } catch (err) {
    console.error("[chromadb:articles] Failed to remove:", err);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. IMAGES - Indexação de imagens geradas
// ═══════════════════════════════════════════════════════════════

export async function indexImage(image: {
  id: string;
  prompt: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("images");
    await col.upsert({
      ids: [image.id],
      documents: [image.prompt],
      metadatas: [image.metadata],
    });
    console.log(`[chromadb:images] Indexed: ${image.id}`);
    return true;
  } catch (err) {
    console.error("[chromadb:images] Failed to index:", err);
    return false;
  }
}

export async function searchSimilarImages(
  query: string,
  limit = 10,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("images");
    const count = await col.count();
    if (count === 0) return [];

    const result = await col.query({ queryTexts: [query], nResults: limit });

    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:images] Search failed:", err);
    return [];
  }
}

export async function removeImage(id: string): Promise<boolean> {
  try {
    const col = await getCollection("images");
    await col.delete({ ids: [id] });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. SLIDES - Conteúdo de carrossel para reutilização
// ═══════════════════════════════════════════════════════════════

export async function indexSlide(slide: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("slides");
    await col.upsert({
      ids: [slide.id],
      documents: [slide.content],
      metadatas: [slide.metadata],
    });
    return true;
  } catch (err) {
    console.error("[chromadb:slides] Failed to index:", err);
    return false;
  }
}

export async function indexSlideBatch(slides: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}[]): Promise<number> {
  try {
    if (slides.length === 0) return 0;
    const col = await getCollection("slides");
    await col.upsert({
      ids: slides.map((s) => s.id),
      documents: slides.map((s) => s.content),
      metadatas: slides.map((s) => s.metadata),
    });
    return slides.length;
  } catch (err) {
    console.error("[chromadb:slides] Batch failed:", err);
    return 0;
  }
}

export async function searchSimilarSlides(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("slides");
    const count = await col.count();
    if (count === 0) return [];

    const result = await col.query({ queryTexts: [query], nResults: limit });

    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:slides] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 4. SEARCHES - Histórico de buscas SearXNG
// ═══════════════════════════════════════════════════════════════

export async function indexSearch(search: {
  id: string;
  query: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("searches");
    await col.upsert({
      ids: [search.id],
      documents: [search.query],
      metadatas: [search.metadata],
    });
    return true;
  } catch (err) {
    console.error("[chromadb:searches] Failed to index:", err);
    return false;
  }
}

export async function searchPastSearches(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("searches");
    const count = await col.count();
    if (count === 0) return [];

    const result = await col.query({ queryTexts: [query], nResults: limit });

    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:searches] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 5. COMPETITORS - Conteúdo de concorrentes
// ═══════════════════════════════════════════════════════════════

export async function indexCompetitorContent(content: {
  id: string;
  text: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("competitors");
    await col.upsert({
      ids: [content.id],
      documents: [content.text],
      metadatas: [content.metadata],
    });
    return true;
  } catch (err) {
    console.error("[chromadb:competitors] Failed to index:", err);
    return false;
  }
}

export async function indexCompetitorBatch(items: {
  id: string;
  text: string;
  metadata: Record<string, string>;
}[]): Promise<number> {
  try {
    if (items.length === 0) return 0;
    const col = await getCollection("competitors");
    await col.upsert({
      ids: items.map((i) => i.id),
      documents: items.map((i) => i.text),
      metadatas: items.map((i) => i.metadata),
    });
    return items.length;
  } catch (err) {
    console.error("[chromadb:competitors] Batch failed:", err);
    return 0;
  }
}

export async function searchCompetitors(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("competitors");
    const count = await col.count();
    if (count === 0) return [];

    const result = await col.query({ queryTexts: [query], nResults: limit });

    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:competitors] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. EXPORTS - Artigos exportados/publicados
// ═══════════════════════════════════════════════════════════════

export async function indexExport(exportData: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("exports");
    await col.upsert({
      ids: [exportData.id],
      documents: [exportData.content],
      metadatas: [exportData.metadata],
    });
    console.log(`[chromadb:exports] Indexed: ${exportData.id}`);
    return true;
  } catch (err) {
    console.error("[chromadb:exports] Failed to index:", err);
    return false;
  }
}

export async function searchExports(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("exports");
    const count = await col.count();
    if (count === 0) return [];
    const result = await col.query({ queryTexts: [query], nResults: limit });
    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:exports] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. TRANSCRIPTIONS - Transcrições de áudio
// ═══════════════════════════════════════════════════════════════

export async function indexTranscription(transcription: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("transcriptions");
    await col.upsert({
      ids: [transcription.id],
      documents: [transcription.content],
      metadatas: [transcription.metadata],
    });
    console.log(`[chromadb:transcriptions] Indexed: ${transcription.id}`);
    return true;
  } catch (err) {
    console.error("[chromadb:transcriptions] Failed to index:", err);
    return false;
  }
}

export async function searchTranscriptions(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("transcriptions");
    const count = await col.count();
    if (count === 0) return [];
    const result = await col.query({ queryTexts: [query], nResults: limit });
    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:transcriptions] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 8. CHARTS - Gráficos QuickCharts
// ═══════════════════════════════════════════════════════════════

export async function indexChart(chart: {
  id: string;
  content: string;
  metadata: Record<string, string>;
}): Promise<boolean> {
  try {
    const col = await getCollection("charts");
    await col.upsert({
      ids: [chart.id],
      documents: [chart.content],
      metadatas: [chart.metadata],
    });
    console.log(`[chromadb:charts] Indexed: ${chart.id}`);
    return true;
  } catch (err) {
    console.error("[chromadb:charts] Failed to index:", err);
    return false;
  }
}

export async function searchCharts(
  query: string,
  limit = 5,
): Promise<SearchResult[]> {
  try {
    const col = await getCollection("charts");
    const count = await col.count();
    if (count === 0) return [];
    const result = await col.query({ queryTexts: [query], nResults: limit });
    return (result.ids?.[0] || []).map((id: string, i: number) => ({
      id,
      content: (result.documents?.[0]?.[i] as string) || "",
      metadata: (result.metadatas?.[0]?.[i] || {}) as Record<string, unknown>,
      distance: (result.distances?.[0]?.[i] as number) || 0,
    }));
  } catch (err) {
    console.error("[chromadb:charts] Search failed:", err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 9. HEALTH - Status geral
// ═══════════════════════════════════════════════════════════════

export async function checkChromaHealth(): Promise<{
  ok: boolean;
  collections: { name: string; count: number }[];
}> {
  try {
    const client = getClient();
    const hb = await client.heartbeat();
    if (!hb) return { ok: false, collections: [] };

    const names = ["articles", "images", "slides", "searches", "competitors", "exports", "transcriptions", "charts"];
    const collections = [];

    for (const name of names) {
      try {
        const col = await getCollection(name);
        const count = await col.count();
        collections.push({ name, count });
      } catch {
        collections.push({ name, count: 0 });
      }
    }

    return { ok: true, collections };
  } catch {
    return { ok: false, collections: [] };
  }
}
