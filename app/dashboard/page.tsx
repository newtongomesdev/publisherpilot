import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { ProjectList } from "@/components/project-list";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const { listArticleProjects } = await import("@/lib/db/queries");
  const projects = await listArticleProjects(user.id, workspace.id);

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="text-zinc-400 mt-2">Acompanhe projetos, jobs e exportacoes.</p>
        </div>
        
        <ProjectList projects={projects} />
      </div>
    </DashboardShell>
  );
}
