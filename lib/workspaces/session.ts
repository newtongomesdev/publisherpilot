import { cookies } from "next/headers";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspaces/constants";
import { requireCurrentUser } from "@/lib/auth/session";

export { setActiveWorkspaceCookie } from "@/lib/workspaces/actions";

export async function requireCurrentWorkspace() {
  const user = await requireCurrentUser();
  if (!user) {
    return null;
  }

  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE_NAME)?.value;
  const { getWorkspaceById, getDefaultWorkspaceByUser, setDefaultWorkspaceIfMissing } = await import("@/lib/db/queries");

  let workspace =
    workspaceId ? await getWorkspaceById(workspaceId, user.id) : await getDefaultWorkspaceByUser(user.id);

  if (!workspace) {
    workspace = await setDefaultWorkspaceIfMissing(user.id, user.name);
  }

  return workspace;
}
