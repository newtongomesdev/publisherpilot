"use client";

import { useEffect, useState, useCallback, useRef } from "react";

import { ArticleProgress, getStepsForPhase, getPercentForPhase } from "@/components/article-progress";
import { ArticleEditor } from "@/components/article-editor";

type Source = {
  id: string;
  title: string;
  url: string;
  domain: string;
  snippet?: string | null;
  searchProvider: string;
  relevanceScore: number;
};

type Project = {
  id: string;
  topic: string;
  niche: string;
  status: string;
  currentError?: string | null;
  aiProvider: string;
  aiModelId: string;
  searchProvider: string;
  sourceCount: number;
};

type Article = {
  title: string;
  markdownContent: string;
  htmlContent?: string;
};

type Props = {
  articleProjectId: string;
  userName: string;
  workspaceName: string;
};

function SourceCard({ source, index }: { source: Source; index: number }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 animate-in fade-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200 truncate">{source.title}</p>
        <p className="text-xs text-zinc-500 truncate">{source.domain}</p>
        {source.snippet && (
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2">{source.snippet}</p>
        )}
      </div>
      <span className="shrink-0 text-[10px] uppercase tracking-wider text-zinc-600 bg-zinc-800 rounded-full px-2 py-0.5">
        {source.searchProvider}
      </span>
    </div>
  );
}

function ElapsedTime({ startTime }: { startTime: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <span className="text-xs text-zinc-600">
      {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
    </span>
  );
}

export function ArticleStatusPoller({ articleProjectId }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(() => Date.now());
  const jobTriggerInFlight = useRef(false);
  const lastJobTrigger = useRef(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/articles/${articleProjectId}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Erro ao carregar status do artigo");
        return;
      }
      const data = await res.json();
      if (data.ok) {
        setProject(data.project);
        setArticle(data.article);
        setSources(data.sources ?? []);
        setError(null);
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }, [articleProjectId]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll status every 3 seconds while processing
  useEffect(() => {
    if (!project) return;
    const finalStatuses = ["ready", "failed"];
    if (finalStatuses.includes(project.status)) return;

    const interval = setInterval(() => {
      fetchStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [project, project?.status, fetchStatus]);

  // Trigger job processing every 5 seconds, with deduplication
  useEffect(() => {
    if (!project) return;
    const finalStatuses = ["ready", "failed"];
    if (finalStatuses.includes(project.status)) return;

    const triggerJob = async () => {
      if (jobTriggerInFlight.current) return;
      jobTriggerInFlight.current = true;
      lastJobTrigger.current = Date.now();
      try {
        await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "{}",
        });
      } catch {
        // ignore
      } finally {
        jobTriggerInFlight.current = false;
      }
    };

    // Trigger immediately
    triggerJob();

    const interval = setInterval(triggerJob, 5000);
    return () => clearInterval(interval);
  }, [project, project?.status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mx-auto" />
          <p className="text-sm text-zinc-400">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-800/50 bg-rose-950/50 p-6 text-center">
        <p className="text-rose-300">{error}</p>
        <button onClick={() => fetchStatus()} className="mt-4 text-sm text-zinc-400 hover:text-zinc-200">
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
        <p className="text-zinc-400">Artigo não encontrado.</p>
      </div>
    );
  }

  const statusToPhase = (status: string): "creating" | "searching" | "generating" | "ready" | "error" => {
    switch (status) {
      case "draft": return "creating";
      case "researching": return "searching";
      case "generating": return "generating";
      case "ready": return "ready";
      case "failed": return "error";
      default: return "creating";
    }
  };

  const phase = statusToPhase(project.status);
  const isProcessing = !["ready", "failed"].includes(project.status);

  return (
    <div className="space-y-6">
      {isProcessing ? (
        <>
          {/* Progress Section */}
          <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="flex items-center justify-between mb-4">
              <ElapsedTime startTime={startTime} />
            </div>
            {(() => {
              let progressDetail = "";
              if (project.currentError && phase === "generating") {
                try {
                  const progress = JSON.parse(project.currentError);
                  progressDetail = progress.detail ?? "";
                } catch {
                  progressDetail = project.currentError;
                }
              }
              return (
                <ArticleProgress
                  steps={getStepsForPhase(phase, sources.length, project.sourceCount, progressDetail)}
                  currentPercent={getPercentForPhase(phase)}
                  error={project.status === "failed" ? project.currentError : null}
                />
              );
            })()}
          </div>

          {/* Sources Being Found */}
          {sources.length > 0 && (
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200">
                  Fontes encontradas
                </h3>
                <span className="text-xs text-zinc-500">
                  {sources.length} de {project.sourceCount}
                </span>
              </div>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <SourceCard key={source.id} source={source} index={i} />
                ))}
              </div>
              {sources.length < project.sourceCount && phase === "searching" && (
                <p className="text-xs text-zinc-500 animate-pulse">
                  Buscando mais fontes...
                </p>
              )}
            </div>
          )}

          {/* Waiting message */}
          {sources.length === 0 && phase === "searching" && (
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span>Pesquisando fontes na web...</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                Query: {project.topic} {project.niche}
              </p>
            </div>
          )}

          {phase === "generating" && (() => {
            // Try to parse progress info from currentError field
            let progressDetail = "";
            let currentSection = 0;
            let totalSections = 0;
            try {
              if (project.currentError) {
                const progress = JSON.parse(project.currentError);
                progressDetail = progress.detail ?? "";
                currentSection = progress.currentSection ?? 0;
                totalSections = progress.totalSections ?? 0;
              }
            } catch {
              progressDetail = project.currentError ?? "";
            }

            return (
              <div className="rounded-[2rem] border border-emerald-800/30 bg-emerald-950/30 p-6">
                <div className="flex items-center justify-center gap-2 text-sm text-emerald-300 mb-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                  <span>{progressDetail || "A IA está gerando o artigo..."}</span>
                </div>

                {/* Section progress bar */}
                {totalSections > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>Secoes</span>
                      <span>{currentSection} de {totalSections}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${(currentSection / totalSections) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <p className="mt-3 text-xs text-zinc-500 text-center">
                  Modelo: {project.aiModelId} · Cada secao leva ~15-30s
                </p>
              </div>
            );
          })()}
        </>
      ) : project.status === "failed" ? (
        /* Failed State */
        <div className="space-y-4">
          <div className="rounded-2xl border border-rose-800/50 bg-rose-950/50 p-6">
            <h3 className="text-lg font-semibold text-rose-300">Falha na geração</h3>
            <p className="mt-2 text-sm text-rose-400/80">
              {project.currentError || "Erro desconhecido durante o processamento."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Tentar novamente
            </button>
          </div>
          {sources.length > 0 && (
            <div className="rounded-[2rem] border border-zinc-800 bg-zinc-900/70 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200">Fontes coletadas antes da falha</h3>
              <div className="space-y-2">
                {sources.map((source, i) => (
                  <SourceCard key={source.id} source={source} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Article Ready - Show Editor */
        article && (
          <ArticleEditor
            articleProjectId={articleProjectId}
            title={article.title}
            markdown={article.markdownContent}
            htmlContent={article.htmlContent}
            status={project.status}
          />
        )
      )}
    </div>
  );
}
