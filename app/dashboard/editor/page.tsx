import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";
import { SlideEditor } from "@/components/slide-editor";

export const dynamic = "force-dynamic";

export default async function EditorPage() {
  const user = await requireCurrentUser();
  if (!user) redirect("/login");

  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}

  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import("@/lib/db/queries");
    workspace = await getDefaultWorkspaceByUser(user.id);
  }

  if (!workspace) redirect("/login");

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <SlideEditor />
    </DashboardShell>
  );
}
