"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Lightbulb, RefreshCw, FileText, Mic, Globe } from "lucide-react";

type Suggestion = {
  id: string;
  content: string;
  source: "articles" | "transcriptions" | "competitors";
  similarity: number;
  title: string;
};

const sourceIcons = {
  articles: FileText,
  transcriptions: Mic,
  competitors: Globe,
};

const sourceLabels = {
  articles: "Artigo",
  transcriptions: "Transcrição",
  competitors: "Concorrente",
};

export function ContentSuggestions({ text }: { text: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.trim().length < 20) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch("/api/search/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, limit: 5 }),
      });
      const data = await resp.json();
      if (data.ok) setSuggestions(data.suggestions || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced fetch on text change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 1500);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, fetchSuggestions]);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-emerald-400 transition-colors"
      >
        <Lightbulb className="h-3.5 w-3.5" />
        Sugestões
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-bold text-zinc-300">Sugestões Semânticas</h3>
        </div>
        <button onClick={() => setVisible(false)} className="text-[10px] text-zinc-600 hover:text-zinc-400">✕</button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 py-3">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-500" />
          <span className="text-[10px] text-zinc-500">Buscando conteúdo similar...</span>
        </div>
      )}

      {!loading && suggestions.length === 0 && text.length >= 20 && (
        <p className="text-[10px] text-zinc-600 py-2">Nenhuma sugestão encontrada</p>
      )}

      {!loading && suggestions.length === 0 && text.length < 20 && (
        <p className="text-[10px] text-zinc-600 py-2">Escreva mais para ver sugestões de conteúdo similar</p>
      )}

      {suggestions.map((s) => {
        const Icon = sourceIcons[s.source];
        return (
          <div key={s.id} className="mb-2 last:mb-0 p-2.5 rounded-xl bg-zinc-800/50 border border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="h-3 w-3 text-zinc-500" />
              <span className="text-[9px] text-zinc-500">{sourceLabels[s.source]}</span>
              <span className="text-[9px] text-emerald-400 ml-auto">{s.similarity}%</span>
            </div>
            {s.title && <p className="text-[10px] text-zinc-400 font-semibold line-clamp-1 mb-0.5">{s.title}</p>}
            <p className="text-[10px] text-zinc-500 line-clamp-3">{s.content}</p>
          </div>
        );
      })}
    </div>
  );
}
