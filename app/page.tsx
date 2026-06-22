export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">ArticleForge Studio</h1>
        <p className="text-lg text-zinc-300">
          Pesquise fontes reais, gere artigos estruturados com IA, edite o conteúdo e exporte em
          múltiplos formatos.
        </p>
        <div className="flex gap-4">
          <span className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-zinc-950">
            Dashboard em breve
          </span>
          <span className="rounded-full border border-zinc-700 px-6 py-3 font-medium">
            Novo artigo em breve
          </span>
        </div>
      </div>
    </main>
  );
}
