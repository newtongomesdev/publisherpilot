import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { DeepgramPanel } from "@/components/deepgram-panel";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function DeepgramPage() {
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">Deepgram</h1>
          <p className="text-zinc-400 mt-2">Text-to-Speech e Speech-to-Text com Deepgram API.</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <DeepgramPanel />
        </div>
      </div>
    </DashboardShell>
  );
}
