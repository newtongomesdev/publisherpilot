import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-2xl font-semibold">Credenciais de IA</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Salve chaves da instancia ou use fallback local enquanto o login ainda nao existe.
          </p>
        </section>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Destinos futuros</h2>
          <p className="mt-2 text-sm text-zinc-400">
            WordPress, Ghost, Medium e Generic API ficam prontos como estrutura para a fase 2.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
