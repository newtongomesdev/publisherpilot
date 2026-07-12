import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { requireCurrentUser } from "@/lib/auth/session";
import { requireCurrentWorkspace } from "@/lib/workspaces/session";
import { Video } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CarouselPage() {
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full" />
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-100 pl-4">Carrossel Studio</h1>
          <p className="text-zinc-400 mt-2 pl-4 max-w-2xl">
            Edite e gere carrosséis de alta conversão para o Instagram por Inteligência Artificial.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/40 backdrop-blur-md shadow-2xl">
          <iframe 
            src="/carousel-editor/index.html" 
            className="w-full h-[calc(100vh-280px)] border-none"
            title="Editor de Carrossel"
          />
        </div>

        <Link
          href="/dashboard/video-generator?mode=image-to-video"
          className="inline-flex items-center gap-2 rounded-full border border-purple-700 bg-purple-950/40 px-6 py-3 font-medium text-purple-200 hover:bg-purple-950/60 transition-colors"
        >
          <Video className="h-4 w-4" />
          Converter em Video
        </Link>
      </div>
    </DashboardShell>
  );
}
