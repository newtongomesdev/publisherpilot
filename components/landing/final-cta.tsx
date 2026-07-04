"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative py-32 overflow-hidden bg-zinc-950">
      {/* Amber Glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[150px]" />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 -z-20 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-6 flex items-center justify-center gap-2">
            <div className="h-[1px] w-8 bg-amber-500/50" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-amber-500">
              Plataforma
            </span>
            <div className="h-[1px] w-8 bg-amber-500/50" />
          </div>

          <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Assuma o controle do seu{" "}
            <span className="text-zinc-500">fluxo editorial</span>
          </h2>

          <p className="mb-10 max-w-xl text-lg text-zinc-400 leading-relaxed">
            Da pesquisa à publicação — uma arquitetura completa para conteúdo que
            importa. Sem ruído, sem alucinações.
          </p>

          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 font-bold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Acessar Plataforma
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-24 flex flex-col items-center gap-4"
        >
          <div className="h-[1px] w-16 bg-zinc-800" />
          <div className="flex items-center gap-2 text-xs text-zinc-600 font-mono tracking-wider">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500/60" />
            [ System Operational: 100% ]
          </div>
          <span className="text-xs text-zinc-700">© 2026 PublisherPilot</span>
        </motion.div>
      </div>
    </section>
  );
}
