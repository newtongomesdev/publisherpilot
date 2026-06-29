"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { WorkspaceSwitcher } from "@/components/workspace-switcher";
import { LayoutDashboard, FileText, Download, Settings, Briefcase, PlusCircle, Mic, Volume2, BarChart3, Music, Layers, Image, PenTool, Search } from "lucide-react";
import { SidebarCostSection } from "@/components/sidebar-cost-section";
import clsx from "clsx";

export function DashboardShell({
  children,
  userName,
  workspaceName,
}: {
  children: React.ReactNode;
  userName?: string;
  workspaceName?: string;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Novo artigo", href: "/articles/new", icon: PlusCircle },
    { name: "Exportações", href: "/exports", icon: Download },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Workspaces", href: "/workspaces", icon: Briefcase },
    { name: "Deepgram", href: "/dashboard/deepgram", icon: Mic },
    { name: "Estúdio de Voz", href: "/dashboard/openrouter-tts", icon: Volume2 },
    { name: "Gerador de Imagens", href: "/dashboard/images", icon: Image },
    { name: "Gerador Suno", href: "/dashboard/suno-lyrics", icon: Music },
    { name: "Editor Visual", href: "/dashboard/editor", icon: PenTool },
    { name: "Carrossel Studio", href: "/dashboard/carousel", icon: Layers },
    { name: "Busca", href: "/dashboard/search", icon: Search },
    { name: "Gráficos", href: "/dashboard/quickchart", icon: BarChart3 },
  ];


  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
      <aside className="relative flex flex-col border-r border-zinc-800/60 bg-zinc-950/50 p-6 backdrop-blur-xl">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/5 to-transparent blur-3xl" />

        <div className="flex flex-col gap-8 flex-1">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-bold">PublisherPilot</p>
                <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Editorial OS</h2>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-4 backdrop-blur-sm">
              {userName && <p className="text-sm font-medium text-zinc-200">{userName}</p>}
              {workspaceName && <p className="text-xs text-zinc-500 mt-1">{workspaceName}</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold px-2">Workspace</h3>
            <WorkspaceSwitcher />
          </div>

          <nav className="space-y-1 mt-4 flex-1">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold px-2 mb-3">Menu</h3>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={clsx(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100"
                  )}
                >
                  <Icon className={clsx("h-4 w-4", isActive ? "text-emerald-400" : "text-zinc-500")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Cost Tracker - toggleable */}
          <SidebarCostSection />
        </div>

        <div className="mt-auto pt-8">
          <LogoutButton />
        </div>
      </aside>
      <main className="relative p-6 lg:p-10">
        <div className="mx-auto max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
