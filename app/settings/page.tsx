import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { SettingsForm } from "@/components/settings-form";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
      <SettingsForm />
    </DashboardShell>
  );
}
