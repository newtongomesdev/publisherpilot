"use client";

import { motion } from "framer-motion";
import { Search, Database, Sparkles, ShieldCheck } from "lucide-react";

export function FlowSection() {
  const steps = [
    {
      id: 1,
      title: "Descoberta",
      subtitle: "SearXNG Ativo",
      description: "Escaneamento global de fontes em tempo real. Fatos verificados eliminam alucinações de IA.",
      icon: <Search className="w-6 h-6 text-emerald-500" />,
      color: "emerald",
      glow: "bg-emerald-500/10",
      accent: "border-emerald-500/20",
      visual: (
        <div className="relative w-full h-24 mb-6 overflow-hidden rounded-lg bg-zinc-950/50 border border-zinc-800/50">
          <motion.div 
            className="absolute inset-0 bg-emerald-500/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div 
            className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/50"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-6 gap-2 opacity-20">
              {[...Array(12)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="w-1 h-1 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.2, 1, 0.2] }}
                  transition={{ duration: 2, delay: i * 0.1, repeat: Infinity }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Memória Semântica",
      subtitle: "ChromaDB Context",
      description: "Armazenamento vetorial de alta precisão. Contexto editorial permanente e recuperável.",
      icon: <Database className="w-6 h-6 text-zinc-400" />,
      color: "zinc",
      glow: "bg-zinc-500/5",
      accent: "border-zinc-500/20",
      visual: (
        <div className="relative w-full h-24 mb-6 overflow-hidden rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex items-center justify-center">
          <div className="relative w-12 h-12">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute inset-0 border border-zinc-700 rounded-md"
                style={{ rotateX: 45, rotateY: 45 }}
                animate={{ 
                  rotateZ: [0, 360],
                  scale: [1, 1.1, 1],
                  borderColor: ["#3f3f46", "#71717a", "#3f3f46"]
                }}
                transition={{ 
                  duration: 5, 
                  delay: i * 0.5, 
                  repeat: Infinity, 
                  ease: "linear" 
                }}
              />
            ))}
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full blur-[2px]" />
            </motion.div>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Síntese",
      subtitle: "IA Autoritativa",
      description: "Escrita refinada com autoridade técnica. Otimizado para engajamento e clareza editorial.",
      icon: <Sparkles className="w-6 h-6 text-amber-500" />,
      color: "amber",
      glow: "bg-amber-500/10",
      accent: "border-amber-500/20",
      visual: (
        <div className="relative w-full h-24 mb-6 overflow-hidden rounded-lg bg-zinc-950/50 border border-zinc-800/50 flex flex-col items-center justify-center gap-1">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="h-1 bg-amber-500/30 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: ["0%", "70%", "40%"] }}
              transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
            />
          ))}
          <motion.div 
            className="absolute bottom-0 w-full h-1/2 bg-gradient-to-t from-amber-500/10 to-transparent"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </div>
      )
    },
  ];

  return (
    <section className="relative py-24 overflow-hidden bg-zinc-950 border-t border-zinc-900">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} 
      />
      
      <div className="container relative z-10 px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <div className="h-[1px] w-8 bg-emerald-500" />
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-500">Processo Editorial</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-bold tracking-tight text-white sm:text-5xl"
            >
              O Fluxo da <span className="text-zinc-500">Verdade Editorial</span>
            </motion.h2>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-zinc-400 max-w-md"
          >
            Nossa arquitetura foi desenhada para garantir precisão factual e profundidade analítica em cada publicação.
          </motion.p>
        </div>

        <div className="relative grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Connecting Lines (Desktop) */}
          <div className="absolute hidden lg:block top-1/2 left-0 right-0 z-0 -translate-y-1/2 pointer-events-none">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute left-[calc(33.33%-12px)] right-[calc(33.33%-12px)] h-[1px] origin-left"
              style={{ background: "linear-gradient(90deg, rgba(16,185,129,0.3), rgba(161,161,170,0.2), rgba(245,158,11,0.3))" }}
            />
            <div className="absolute left-[33.33%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            <div className="absolute right-[33.33%] top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500/50" />
          </div>

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className={`relative p-8 border group bg-zinc-900/30 ${step.accent} rounded-2xl transition-all duration-500 hover:bg-zinc-900/50 z-10`}
            >
              {/* Glow Effect */}
              <div className={`absolute inset-0 transition-opacity opacity-0 blur-3xl group-hover:opacity-100 ${step.glow} duration-700`} />
              
              <div className="relative z-10">
                {step.visual}
                
                {/* Step Number */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <div className="p-2 border rounded-lg bg-zinc-950 border-zinc-800 group-hover:border-zinc-700 transition-colors">
                      {step.icon}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 border border-zinc-700 text-[10px] font-bold text-zinc-400">
                      {step.id}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold tracking-widest uppercase text-zinc-500">{step.subtitle}</span>
                    <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                  </div>
                </div>
                
                <p className="text-zinc-400 leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>

              {/* Mobile connector arrow */}
              {index < steps.length - 1 && (
                <div className="flex justify-center lg:hidden mt-4">
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2 + 0.3 }}
                    className="text-zinc-600"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                      <line x1="12" y1="4" x2="12" y2="18" />
                      <polyline points="6 12 12 18 18 12" />
                    </svg>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Badge */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8 }}
          className="mt-16 flex justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-full bg-zinc-900/50 backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-xs text-zinc-400 font-medium">Arquitetura Zero-Hallucination validada</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
