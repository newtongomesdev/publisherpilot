import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function ExportsPage() {
  const user = await requireCurrentUser();
  if (!user) {
    redirect("/login");
  }
  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}
  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
    workspace = await getDefaultWorkspaceByUser(user.id);
  }
  if (!workspace) {
    redirect("/login");
  }

  const { listExportHistory } = await import("@/lib/db/queries");
  const exports = await listExportHistory(user.id, workspace.id);

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Exportacoes</h1>
        <p className="text-zinc-400">Acompanhe o historico de artefatos gerados.</p>
        <div className="grid gap-4">
          {exports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-800 p-6 text-zinc-400">
              Nenhuma exportacao registrada ainda.
            </div>
          ) : (
            exports.map((item) => (
              <div key={item.id} className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">{item.fileName}</h2>
                  <span className="text-sm text-zinc-400">{item.status}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-500">{item.format}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
