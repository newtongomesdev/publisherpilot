"use client";

import { useState, useEffect } from "react";
import { DollarSign, RefreshCw, AlertTriangle, TrendingUp, Calendar, Clock, Eye, EyeOff } from "lucide-react";

type AppUsage = {
  total: { cost: number; calls: number; tokens: number };
  today: { cost: number; calls: number };
  week: { cost: number; calls: number };
  month: { cost: number; calls: number };
  byModel: Array<{ model: string; cost: number; calls: number; tokens: number }>;
};

export function CostTracker() {
  const [usage, setUsage] = useState<AppUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  async function fetchUsage() {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch("/api/openrouter/usage");
      const data = await resp.json();
      if (data.ok) {
        setUsage(data);
      } else {
        setError(data.error ?? "Erro ao consultar uso");
      }
    } catch {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsage();
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-xs">{error}</span>
        </div>
      </div>
    );
  }

  if (!usage && loading) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-xs">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!usage) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium text-zinc-400">Custo do App</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <button
            onClick={fetchUsage}
            disabled={loading}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Total */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Total gasto
              </span>
              <span className="text-zinc-200 font-mono font-medium">${usage.total.cost.toFixed(6)}</span>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> Hoje
              </span>
              <span className="text-zinc-300 font-mono">${usage.today.cost.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Semana
              </span>
              <span className="text-zinc-300 font-mono">${usage.week.cost.toFixed(6)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Mês
              </span>
              <span className="text-zinc-300 font-mono">${usage.month.cost.toFixed(6)}</span>
            </div>
          </div>

          {/* Calls */}
          <div className="pt-1 border-t border-zinc-800">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Chamadas</span>
              <span className="text-zinc-400 font-mono">{usage.total.calls}</span>
            </div>
          </div>

          {/* Per-model toggle */}
          {usage.byModel.length > 0 && (
            <div className="pt-2 border-t border-zinc-800">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showDetails ? "Ocultar detalhes" : "Ver por modelo"} ({usage.byModel.length} modelos)
              </button>
              {showDetails && (
                <div className="mt-2 space-y-1.5">
                  {usage.byModel.map((m) => (
                    <div key={m.model} className="text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 truncate max-w-[120px]" title={m.model}>
                          {m.model.split("/").pop()}
                        </span>
                        <span className="text-zinc-400 font-mono">${m.cost.toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-600">
                        <span>{m.calls} chamadas</span>
                        <span>{m.tokens.toLocaleString()} tokens</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {usage.total.calls === 0 && (
            <p className="text-[10px] text-zinc-600 pt-1">
              Nenhum custo registrado ainda. Gere um artigo para começar.
            </p>
          )}
        </>
      )}
    </div>
  );
}
