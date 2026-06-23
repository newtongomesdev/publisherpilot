import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-zinc-400">Acompanhe projetos, jobs e exportacoes.</p>
      </div>
    </DashboardShell>
  );
}
