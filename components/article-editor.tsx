"use client";

export function ArticleEditor() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <textarea
          className="min-h-[520px] w-full resize-none bg-transparent text-sm outline-none"
          defaultValue={"# Titulo\n\nConteudo do artigo"}
        />
      </div>
      <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Painel editorial</h2>
        <button className="w-full rounded-full bg-emerald-400 px-4 py-3 font-medium text-zinc-950">Exportar</button>
      </div>
    </div>
  );
}
