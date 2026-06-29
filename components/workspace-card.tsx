"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Check, X } from "lucide-react";

type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isDefault: boolean;
};

export function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workspace.name);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  async function handleSave() {
    if (!name.trim() || name === workspace.name) {
      setIsEditing(false);
      setName(workspace.name);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Erro ao renomear workspace.");
      }
    } catch {
      alert("Erro ao renomear workspace.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="group relative rounded-3xl border border-zinc-800/60 bg-zinc-950/40 p-6 backdrop-blur-md shadow-xl shadow-black/20 transition-all hover:bg-zinc-900/60 hover:border-zinc-700 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      
      <div className="flex items-center justify-between">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 mr-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setName(workspace.name);
                }
              }}
              disabled={isSaving}
            />
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1.5 text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setName(workspace.name);
              }}
              disabled={isSaving}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-zinc-100 group-hover:text-emerald-400 transition-colors">{workspace.name}</h2>
            <button
              onClick={() => setIsEditing(true)}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-md transition-all"
              title="Renomear"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {!isEditing && workspace.isDefault && (
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400/80">
            Padrão
          </span>
        )}
      </div>
      
      <p className="mt-4 text-sm text-zinc-500 border-t border-zinc-800/50 pt-3">
        {workspace.description ?? workspace.slug}
      </p>
    </div>
  );
}
