"use client";

import { useState } from "react";

const steps = ["Brief", "Research", "AI", "Review"] as const;

export function ArticleForm() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full px-4 py-2 text-sm ${
              index === step ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Tema do artigo" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Nicho" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Idioma" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Tom editorial" />
      </div>
      <button className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-zinc-950">Gerar artigo</button>
    </div>
  );
}
