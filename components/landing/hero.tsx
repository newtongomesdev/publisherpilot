"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-16 bg-zinc-950">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

      {/* Radial Glows */}
      <div className="absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]"></div>
      <div className="absolute left-1/3 top-1/2 -z-10 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-amber-500/5 blur-[100px]"></div>

      <div className="container relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="group relative mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 backdrop-blur-md"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          <span className="tracking-wide">[ Pesquisa via SearXNG Ativa ]</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-6 text-6xl font-bold tracking-tight text-transparent sm:text-8xl bg-clip-text bg-gradient-to-b from-white to-zinc-400 drop-shadow-2xl"
        >
          PublisherPilot
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl leading-relaxed"
        >
          Arquitetura editorial baseada em evidências. Pesquise fontes reais, gere artigos com autoridade e distribua em múltiplos canais.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/dashboard"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-8 py-4 font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Acessar Plataforma
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/articles/new"
            className="flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 px-8 py-4 font-semibold text-zinc-300 backdrop-blur-sm transition-all hover:bg-zinc-800 hover:text-white hover:scale-105 active:scale-95"
          >
            Novo Artigo
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
