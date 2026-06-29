import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { WorkspaceCard } from "@/components/workspace-card";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function WorkspacesPage() {
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

  const { listWorkspacesByUser } = await import("@/lib/db/queries");
  const workspaces = await listWorkspacesByUser(user.id);

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Workspaces</h1>
          <p className="text-zinc-400 mt-2">Separe clientes, marcas, projetos e configuracoes por espaco de trabalho.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {workspaces.map((item) => (
            <WorkspaceCard key={item.id} workspace={item} />
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
