import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";
import { ArticleStatusPoller } from "@/components/article-status-poller";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
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

  const { getArticleProjectById } = await import("@/lib/db/queries");
  const { id } = await params;
  const project = await getArticleProjectById(id, user.id, workspace.id);
  if (!project) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">{project.topic}</h1>
            <p className="text-sm text-zinc-500 mt-1">Status: {project.status}</p>
          </div>
        </div>
        <ArticleStatusPoller
          articleProjectId={id}
          userName={user.name}
          workspaceName={workspace.name}
        />
      </div>
    </DashboardShell>
  );
}
