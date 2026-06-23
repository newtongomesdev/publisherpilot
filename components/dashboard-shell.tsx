import Link from "next/link";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-zinc-800 bg-zinc-950 p-6">
        <div className="space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">ArticleForge Studio</p>
            <h2 className="mt-2 text-2xl font-semibold">Editorial OS</h2>
          </div>
          <nav className="space-y-3 text-sm text-zinc-300">
            <Link href="/dashboard" className="block">
              Dashboard
            </Link>
            <Link href="/articles/new" className="block">
              Novo artigo
            </Link>
            <Link href="/exports" className="block">
              Exportacoes
            </Link>
            <Link href="/settings" className="block">
              Settings
            </Link>
          </nav>
        </div>
      </aside>
      <main className="bg-zinc-950 p-6">{children}</main>
    </div>
  );
}
