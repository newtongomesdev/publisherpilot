import { DashboardShell } from "@/components/dashboard-shell";

export default function ExportsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Exportacoes</h1>
        <p className="text-zinc-400">Acompanhe o historico de artefatos gerados.</p>
      </div>
    </DashboardShell>
  );
}
