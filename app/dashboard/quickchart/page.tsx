"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { QuickChartPanel } from "@/components/quickchart-panel";

export default function QuickChartPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Gerador de Gráficos</h1>
          <p className="text-sm text-zinc-500 mt-1">QuickChart — crie gráficos Chart.js via URL. Sem API key.</p>
        </div>
        <QuickChartPanel />
      </div>
    </DashboardShell>
  );
}
