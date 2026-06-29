"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ModelInfo = {
  modelId: string;
  name: string;
  contextWindow?: number;
};

type ModelSelectorProps = {
  provider: string;
  value: string;
  onChange: (modelId: string) => void;
  className?: string;
};

const inputStyles =
  "w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-zinc-600 transition-colors";

export function ModelSelector({ provider, value, onChange, className }: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (!provider) {
      setModels([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    })
      .then((r) => r.json())
      .then((payload) => {
        if (!cancelled && payload.ok) {
          setModels(payload.models ?? []);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provider]);

  const filtered = models.filter(
    (m) =>
      m.modelId.toLowerCase().includes(query.toLowerCase()) ||
      m.name.toLowerCase().includes(query.toLowerCase()),
  );

  const allOptions = filtered.length > 0 ? filtered : (query ? [{ modelId: query, name: query }] : models);

  const select = useCallback(
    (modelId: string) => {
      onChange(modelId);
      setQuery(modelId);
      setOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
        setHighlight(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, allOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allOptions[highlight]) {
        select(allOptions[highlight].modelId);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function formatContext(window?: number) {
    if (!window) return null;
    if (window >= 1_000_000) return `${(window / 1_000_000).toFixed(0)}M`;
    if (window >= 1_000) return `${(window / 1_000).toFixed(0)}K`;
    return String(window);
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className={`${inputStyles} ${className ?? ""}`}
        value={query}
        placeholder={loading ? "Carregando modelos..." : "Digite para buscar ou selecione..."}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setHighlight(0);
          if (e.target.value !== value) {
            onChange(e.target.value);
          }
        }}
        onFocus={() => {
          setOpen(true);
          setHighlight(0);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
        }}
        onKeyDown={handleKeyDown}
        disabled={loading && models.length === 0}
      />

      {open && (allOptions.length > 0 || loading) && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 shadow-xl shadow-black/40"
        >
          {loading && models.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Carregando modelos...</div>
          )}

          {allOptions.map((m, i) => (
            <button
              key={m.modelId}
              type="button"
              className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                i === highlight
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-300 hover:bg-zinc-800/60"
              } ${m.modelId === value ? "bg-zinc-800/40" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                select(m.modelId);
              }}
              onMouseEnter={() => setHighlight(i)}
            >
              <span className="truncate">
                {m.name || m.modelId}
              </span>
              <span className="ml-2 shrink-0 flex items-center gap-2">
                {m.contextWindow ? (
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                    {formatContext(m.contextWindow)} ctx
                  </span>
                ) : null}
                {m.modelId === value ? (
                  <span className="text-emerald-400">✓</span>
                ) : null}
              </span>
            </button>
          ))}

          {query && !models.some((m) => m.modelId === query) && (
            <div className="border-t border-zinc-800 px-4 py-2.5 text-xs text-zinc-500">
              Modelo personalizado: <span className="text-zinc-300">{query}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
