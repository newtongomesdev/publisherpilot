import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]"></div>
      
      <div className="max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 backdrop-blur-md">
          <Sparkles className="h-4 w-4" />
          <span>O Futuro da Criação de Conteúdo</span>
        </div>
        
        <h1 className="text-5xl font-bold tracking-tight text-transparent sm:text-7xl bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-sm">
          PublisherPilot
        </h1>
        
        <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl">
          Pesquise fontes reais, gere artigos completos com IA, prepare ativos visuais e distribua
          conteúdo para múltiplos canais a partir de uma única operação editorial.
        </p>
        
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
          <Link 
            href="/dashboard" 
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 sm:w-auto shadow-lg shadow-emerald-500/20"
          >
            Abrir Dashboard
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link 
            href="/articles/new" 
            className="flex w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/50 px-8 py-4 font-semibold text-white backdrop-blur-md transition-all hover:bg-zinc-800 hover:scale-105 active:scale-95 sm:w-auto"
          >
            Novo Artigo
          </Link>
        </div>
      </div>
    </main>
  );
}
