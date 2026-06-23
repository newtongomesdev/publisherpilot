import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-zinc-400">Configure chaves, provedores e preferencias da instancia.</p>
      </div>
    </DashboardShell>
  );
}
