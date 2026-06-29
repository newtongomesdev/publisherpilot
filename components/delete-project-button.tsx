"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteProjectButton({ projectId, topic }: { projectId: string; topic: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o projeto "${topic}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/articles/${projectId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      } else {
        alert("Erro ao excluir o projeto.");
        setIsDeleting(false);
      }
    } catch {
      alert("Erro ao excluir o projeto.");
      setIsDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="relative z-20 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all disabled:opacity-50"
      title="Excluir projeto"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
