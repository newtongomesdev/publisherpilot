"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} className="rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300">
      Sair
    </button>
  );
}
