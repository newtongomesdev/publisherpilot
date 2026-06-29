"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    setError("");

    const payload = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const endpoint = mode === "register" ? "/api/auth/register" : "/api/auth/login";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({ error: "Falha de autenticacao." }));
      setError(result.error ?? "Falha de autenticacao.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md rounded-[2rem] border border-zinc-800 bg-zinc-900 p-8">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">PublisherPilot</p>
        <h1 className="mt-3 text-3xl font-semibold">Entrar no painel</h1>
        <p className="mt-2 text-sm text-zinc-400">Autenticacao local inicial para vincular projeto, chaves e configuracoes por usuario.</p>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-4 py-2 text-sm ${mode === "login" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-full px-4 py-2 text-sm ${mode === "register" ? "bg-emerald-400 text-zinc-950" : "bg-zinc-950 text-zinc-300"}`}
        >
          Cadastro
        </button>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {mode === "register" ? (
          <input name="name" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4" placeholder="Seu nome" />
        ) : null}
        <input name="email" type="email" className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4" placeholder="Email" />
        <input
          name="password"
          type="password"
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4"
          placeholder="Senha"
        />
        {error ? <p className="text-sm text-rose-400">{error}</p> : null}
        <button disabled={isSubmitting} className="w-full rounded-full bg-emerald-400 px-4 py-3 font-medium text-zinc-950">
          {isSubmitting ? "Processando..." : mode === "register" ? "Criar conta" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
