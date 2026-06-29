import { redirect } from "next/navigation";
import { ArticleForm } from "@/components/article-form";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function NewArticlePage() {
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

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Novo artigo</h1>
        <ArticleForm />
      </div>
    </DashboardShell>
  );
}
