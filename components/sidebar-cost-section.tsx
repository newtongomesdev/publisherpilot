"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { CostTracker } from "@/components/cost-tracker";

export function SidebarCostSection() {
  const [visible, setVisible] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("showCostPanel");
    if (stored !== null) setVisible(stored === "true");
  }, []);

  function toggleVisible() {
    const next = !visible;
    setVisible(next);
    localStorage.setItem("showCostPanel", String(next));
  }

  if (!visible) {
    return (
      <div className="mt-4 px-2">
        <button
          onClick={toggleVisible}
          className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors w-full text-left"
        >
          + Mostrar painel de custos
        </button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between px-2 mb-3">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">API Usage</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-600 hover:text-zinc-400 transition-colors"
            title={collapsed ? "Expandir" : "Recolher"}
          >
            {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
          <button
            onClick={toggleVisible}
            className="text-zinc-600 hover:text-zinc-400 transition-colors text-[10px]"
            title="Ocultar painel"
          >
            Ocultar
          </button>
        </div>
      </div>
      {!collapsed && <CostTracker />}
    </div>
  );
}
