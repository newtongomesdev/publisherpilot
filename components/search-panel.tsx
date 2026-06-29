"use client";

import { useState, useCallback } from "react";
import { Search, Globe, Image, Newspaper, FileText, ExternalLink, ChevronRight, Loader2, Copy, Check } from "lucide-react";

type SearchResult = {
  title: string;
  url: string;
  content: string;
  engine: string;
  score: number;
  thumbnail: string | null;
  imgSrc: string | null;
  publishedDate: string | null;
};

type SearchResponse = {
  ok: boolean;
  query: string;
  categories: string;
  page: number;
  totalPages: number;
  totalResults: number;
  enginesUsed: string[];
  enginesDown: { engine: string; reason: string }[];
  results: SearchResult[];
  error?: string;
};

const CATEGORIES = [
  { id: "general", label: "Geral", icon: Globe },
  { id: "images", label: "Imagens", icon: Image },
  { id: "news", label: "Notícias", icon: Newspaper },
  { id: "articles", label: "Artigos", icon: FileText },
  { id: "competitors", label: "Concorrentes", icon: Globe },
  { id: "knowledge", label: "Conhecimento", icon: Globe },
] as const;

type SemanticResult = {
  id: string;
  content: string;
  title: string;
  niche: string;
  language: string;
  projectId: string;
  distance: number;
  similarity: number;
  createdAt: string | null;
};

const TIME_RANGES = [
  { value: "", label: "Qualquer" },
  { value: "day", label: "Hoje" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mês" },
  { value: "year", label: "Ano" },
];

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [timeRange, setTimeRange] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState<{ totalResults: number; totalPages: number; enginesUsed: string[]; enginesDown: { engine: string; reason: string }[] } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [semanticResults, setSemanticResults] = useState<SemanticResult[]>([]);
  const [loadingSemantic, setLoadingSemantic] = useState(false);
  const [competitorResults, setCompetitorResults] = useState<any[]>([]);
  const [loadingCompetitor, setLoadingCompetitor] = useState(false);
  const [knowledgeResults, setKnowledgeResults] = useState<any[]>([]);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);

  // Semantic search for articles
  const doSemanticSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoadingSemantic(true);
    setSemanticResults([]);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "20" });
      const resp = await fetch(`/api/search/semantic?${params}`);
      const data = await resp.json();
      if (data.ok) setSemanticResults(data.results || []);
    } catch (err) {
      console.error("[SemanticSearch]", err);
    } finally {
      setLoadingSemantic(false);
    }
  }, []);

  // Competitor search
  const doCompetitorSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoadingCompetitor(true);
    setCompetitorResults([]);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: "20" });
      const resp = await fetch(`/api/search/competitors?${params}`);
      const data = await resp.json();
      if (data.ok) setCompetitorResults(data.results || []);
    } catch (err) {
      console.error("[CompetitorSearch]", err);
    } finally {
      setLoadingCompetitor(false);
    }
  }, []);

  // Knowledge search (past searches + slides)
  const doKnowledgeSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoadingKnowledge(true);
    setKnowledgeResults([]);
    try {
      // Search past searches and slides from ChromaDB
      const searchResp = await fetch(`/api/search/semantic?q=${encodeURIComponent(q)}&limit=10`);
      const searchData = await searchResp.json();
      setKnowledgeResults(searchData.results || []);
    } catch (err) {
      console.error("[KnowledgeSearch]", err);
    } finally {
      setLoadingKnowledge(false);
    }
  }, []);

  // New search: replaces all results
  const doSearch = useCallback(async (q: string, cat: string, pg: number, tr: string) => {
    if (!q.trim()) return;

    // For articles category, use semantic search
    if (cat === "articles") {
      doSemanticSearch(q);
      setResults([]);
      setMeta(null);
      return;
    }

    // For competitors, use competitor search
    if (cat === "competitors") {
      doCompetitorSearch(q);
      setResults([]);
      setMeta(null);
      return;
    }

    // For knowledge, use knowledge search
    if (cat === "knowledge") {
      doKnowledgeSearch(q);
      setResults([]);
      setMeta(null);
      return;
    }

    setLoading(true);
    setSemanticResults([]);
    try {
      const params = new URLSearchParams({ q: q.trim(), categories: cat, page: String(pg), language: "pt-BR" });
      if (tr) params.set("timeRange", tr);

      const resp = await fetch(`/api/search?${params}`);
      const data: SearchResponse = await resp.json();

      if (data.ok) {
        setResults(data.results);
        setMeta({
          totalResults: data.totalResults || data.results.length,
          totalPages: data.totalPages || pg + (data.results.length >= 50 ? 1 : 0),
          enginesUsed: data.enginesUsed || [],
          enginesDown: data.enginesDown || [],
        });
      } else {
        setResults([]);
        setMeta(null);
      }
    } catch (err) {
      console.error("[Search]", err);
      setResults([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [doSemanticSearch, doCompetitorSearch, doKnowledgeSearch]);

  // Load more: appends results
  const loadMore = useCallback(async () => {
    if (!query.trim()) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ q: query.trim(), categories: category, page: String(nextPage), language: "pt-BR" });
      if (timeRange) params.set("timeRange", timeRange);

      const resp = await fetch(`/api/search?${params}`);
      const data: SearchResponse = await resp.json();

      if (data.ok && data.results.length > 0) {
        setResults((prev) => [...prev, ...data.results]);
        setPage(nextPage);
        setMeta((prev) => prev ? {
          ...prev,
          totalPages: Math.max(prev.totalPages, nextPage + (data.results.length >= 50 ? 1 : 0)),
        } : prev);
      } else {
        // No more results
        setMeta((prev) => prev ? { ...prev, totalPages: nextPage - 1 } : prev);
      }
    } catch (err) {
      console.error("[Search loadMore]", err);
    } finally {
      setLoadingMore(false);
    }
  }, [query, category, page, timeRange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    doSearch(query, category, 1, timeRange);
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const isImageMode = category === "images";

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na web, imagens, notícias..."
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-sm"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar
        </button>
      </form>

      {/* Category Tabs + Time Range */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setPage(1); if (query.trim()) doSearch(query, cat.id, 1, timeRange); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  category === cat.id
                    ? "bg-emerald-600 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <select
          value={timeRange}
          onChange={(e) => { setTimeRange(e.target.value); setPage(1); if (query.trim()) doSearch(query, category, 1, e.target.value); }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-400 focus:outline-none"
        >
          {TIME_RANGES.map((tr) => (
            <option key={tr.value} value={tr.value}>{tr.label}</option>
          ))}
        </select>
      </div>

      {/* Meta */}
      {meta && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-600">
            {meta.totalResults.toLocaleString("pt-BR")} resultados · Página {page} de {meta.totalPages}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {meta.enginesUsed.map((e) => (
              <span key={e} className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">{e}</span>
            ))}
            {meta.enginesDown.map((e) => (
              <span key={e.engine} className="text-[9px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded" title={e.reason}>{e.engine} ✕</span>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Results - Images Grid */}
      {!loading && isImageMode && results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {results.filter((r) => r.imgSrc).map((r, i) => (
            <div key={i} className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-600 transition-all">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="block aspect-square overflow-hidden">
                <img
                  src={r.imgSrc!}
                  alt={r.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </a>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <p className="text-[10px] text-white/80 line-clamp-2">{r.title}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">{r.engine}</span>
                    <button onClick={() => handleCopyUrl(r.imgSrc || r.url)} className="text-[9px] text-white/60 hover:text-white">
                      {copiedUrl === r.imgSrc ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results - Semantic Article Search */}
      {loadingSemantic && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}

      {!loadingSemantic && semanticResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Artigos similares (busca semântica)</p>
          {semanticResults.map((r) => (
            <a
              key={r.id}
              href={`/dashboard/articles/${r.projectId}`}
              className="block p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-medium">{r.similarity}% similar</span>
                    {r.niche && <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{r.niche}</span>}
                    {r.language && <span className="text-[9px] text-zinc-600">{r.language}</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {r.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.content}</p>
                  {r.createdAt && (
                    <p className="text-[10px] text-zinc-700 mt-1.5">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      {!loadingSemantic && category === "articles" && semanticResults.length === 0 && meta === null && results.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm mb-1">Busca semântica de artigos</p>
          <p className="text-xs text-zinc-700 max-w-md mx-auto">
            Encontre artigos gerados por similaridade de conteúdo. Artigos são indexados automaticamente no ChromaDB quando gerados.
          </p>
        </div>
      )}

      {/* Competitor Results */}
      {loadingCompetitor && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}
      {!loadingCompetitor && competitorResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Conteúdo de concorrentes (indexado)</p>
          {competitorResults.map((r: any) => (
            <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-emerald-500/30 transition-colors group">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-medium">{r.similarity}% similar</span>
                    <span className="text-[9px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{r.domain}</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-3">{r.content}</p>
                  <p className="text-[10px] text-zinc-700 mt-1.5 truncate">{r.url}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
      {!loadingCompetitor && category === "competitors" && competitorResults.length === 0 && meta === null && results.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <Globe className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm mb-1">Análise de concorrentes</p>
          <p className="text-xs text-zinc-700 max-w-md mx-auto">
            Busque conteúdo de concorrentes indexado no ChromaDB. Use a API POST /api/search/competitors com URLs para indexar.
          </p>
        </div>
      )}

      {/* Knowledge Results */}
      {loadingKnowledge && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      )}
      {!loadingKnowledge && knowledgeResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">Conhecimento (buscas anteriores + artigos)</p>
          {knowledgeResults.map((r: any) => (
            <div key={r.id} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-medium">{r.similarity}% similar</span>
                <span className="text-[9px] text-zinc-500">{r.niche || r.language || ""}</span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 line-clamp-1">{r.title || "Busca anterior"}</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.content}</p>
            </div>
          ))}
        </div>
      )}
      {!loadingKnowledge && category === "knowledge" && knowledgeResults.length === 0 && meta === null && results.length === 0 && (
        <div className="text-center py-16 text-zinc-600">
          <FileText className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm mb-1">Base de conhecimento</p>
          <p className="text-xs text-zinc-700 max-w-md mx-auto">
            Busque no histórico de buscas e artigos indexados. Tudo semanticamente organizado no ChromaDB.
          </p>
        </div>
      )}

      {/* Results - Web/News List */}
      {!loading && !isImageMode && results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
              <div className="flex items-start gap-3">
                {r.thumbnail && (
                  <img src={r.thumbnail} className="w-16 h-16 rounded-lg object-cover shrink-0" alt="" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded font-medium">{r.engine}</span>
                    {r.publishedDate && (
                      <span className="text-[9px] text-zinc-600">{new Date(r.publishedDate).toLocaleDateString("pt-BR")}</span>
                    )}
                  </div>
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-zinc-200 hover:text-emerald-400 transition-colors line-clamp-1 flex items-center gap-1.5"
                  >
                    {r.title}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                  <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{r.content}</p>
                  <p className="text-[10px] text-zinc-700 mt-1.5 truncate">{r.url}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && results.length === 0 && meta && (
        <div className="text-center py-16 text-zinc-600">
          <Search className="h-10 w-10 mx-auto mb-3 text-zinc-700" />
          <p className="text-sm">Nenhum resultado encontrado</p>
        </div>
      )}

      {/* Load More */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col items-center gap-3 pt-4 pb-8">
          <p className="text-[10px] text-zinc-700">{results.length} resultados carregados</p>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-2"
          >
            {loadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                Carregar mais resultados
                <ChevronRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Welcome state */}
      {!loading && results.length === 0 && !meta && (
        <div className="text-center py-20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Globe className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-sm text-zinc-400 mb-1">Busca via SearXNG</p>
          <p className="text-xs text-zinc-600 max-w-md mx-auto">
            Metasearch engine privado. Busca em Google, Bing, DuckDuckGo, Pexels, Pixabay e mais — tudo de forma anônima.
          </p>
        </div>
      )}
    </div>
  );
}
