import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { SunoLyricsPanel } from "@/components/suno-lyrics-panel";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";

export const dynamic = "force-dynamic";

export default async function SunoLyricsPage() {
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
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full" />
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 pl-4">Gerador Suno</h1>
          <p className="text-zinc-400 mt-2 pl-4 max-w-2xl">
            Crie letras de música completas com estrutura de tags otimizada e prompt de estilo instrumental ideal para o Suno AI.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/40 p-6 backdrop-blur-md shadow-xl">
          <SunoLyricsPanel />
        </div>
      </div>
    </DashboardShell>
  );
}
