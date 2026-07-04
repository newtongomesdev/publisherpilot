"use client";

import { motion } from "framer-motion";
import { Mic, Layout, Share2 } from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Audio Studio",
    description: "Geração e edição de áudio com IA. Narração, trilhas sonoras e podcasts gerados diretamente no fluxo editorial.",
    accent: "text-emerald-500",
    glow: "group-hover:shadow-emerald-500/10",
  },
  {
    icon: Layout,
    title: "Visual Engine",
    description: "Carrosséis, infográficos e artes visuais renderizados sob demanda. Do conceito ao asset em segundos.",
    accent: "text-zinc-400",
    glow: "group-hover:shadow-zinc-500/10",
  },
  {
    icon: Share2,
    title: "Distribuição",
    description: "Publicação multicanal automatizada. LinkedIn, Instagram, Medium, WordPress e canais customizados.",
    accent: "text-amber-500",
    glow: "group-hover:shadow-amber-500/10",
  },
];

export function FeaturesGrid() {
  return (
    <section className="relative py-24 overflow-hidden bg-zinc-950 border-y border-zinc-900">
      <div className="container relative z-10 px-4 mx-auto">
        <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`group relative px-8 py-12 transition-all duration-300 hover:bg-zinc-900/30 ${
                index < features.length - 1
                  ? "border-b md:border-b-0 md:border-r border-zinc-900"
                  : ""
              }`}
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors group-hover:border-zinc-700">
                <feature.icon className={`h-5 w-5 ${feature.accent}`} />
              </div>

              <h3 className="mb-3 text-lg font-semibold text-zinc-50">
                {feature.title}
              </h3>

              <p className="text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>

              {/* Subtle bottom accent line on hover */}
              <div className="absolute bottom-0 left-8 right-8 h-[1px] scale-x-0 bg-zinc-800 transition-transform duration-500 group-hover:scale-x-100" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
