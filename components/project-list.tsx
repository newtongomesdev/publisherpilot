"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, CheckSquare, Square } from "lucide-react";
import { DeleteProjectButton } from "./delete-project-button";

type Project = {
  id: string;
  topic: string;
  status: string;
  niche: string;
  language: string;
  aiProvider: string;
  createdAt: string | number | Date | null;
};

export function ProjectList({ projects }: { projects: Project[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  function toggleSelection(e: React.MouseEvent, id: string) {
    e.preventDefault(); // Prevent navigating to the link
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} projeto(s)? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/articles/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (res.ok) {
        setSelectedIds(new Set());
        router.refresh();
      } else {
        alert("Erro ao excluir projetos.");
      }
    } catch {
      alert("Erro ao excluir projetos.");
    } finally {
      setIsDeleting(false);
    }
  }

  if (projects.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-zinc-800/60 bg-zinc-950/20 p-8 text-center text-zinc-500 backdrop-blur-sm">
        Nenhum projeto criado ainda.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24">
        {projects.map((project) => {
          const isSelected = selectedIds.has(project.id);
          const isSelectionMode = selectedIds.size > 0;
          
          return (
            <div
              key={project.id}
              onClick={(e) => {
                if (isSelectionMode) {
                  toggleSelection(e, project.id);
                }
              }}
              className={`group relative rounded-3xl border p-6 backdrop-blur-md shadow-xl transition-all block overflow-hidden ${
                isSelected 
                  ? "border-emerald-500/50 bg-zinc-900/80 shadow-emerald-500/10" 
                  : "border-zinc-800/60 bg-zinc-950/40 shadow-black/20 hover:bg-zinc-900/60 hover:border-zinc-700 hover:-translate-y-0.5"
              } ${isSelectionMode ? "cursor-pointer" : ""}`}
            >
              {!isSelectionMode && (
                <Link href={`/articles/${project.id}`} className="absolute inset-0 z-0" />
              )}
              <div className={`absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent translate-x-[-100%] transition-transform duration-1000 ${
                isSelected ? "translate-x-[100%]" : "group-hover:translate-x-[100%]"
              }`} />
              
              <div className="flex items-center justify-between mb-3 relative z-10 pointer-events-none">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={(e) => toggleSelection(e, project.id)}
                    className="pointer-events-auto text-zinc-500 hover:text-emerald-400 transition-colors focus:outline-none"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <h2 className="text-lg font-medium text-zinc-100 group-hover:text-emerald-400 transition-colors">
                    {project.topic}
                  </h2>
                </div>
                
                <div className="flex items-center gap-3 pointer-events-auto">
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {project.status}
                  </span>
                  <DeleteProjectButton projectId={project.id} topic={project.topic} />
                </div>
              </div>
              
              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3 relative z-10 pointer-events-none pl-9">
                <p className="text-sm text-zinc-500">
                  {project.niche} <span className="mx-1.5 text-zinc-700">•</span> {project.language} <span className="mx-1.5 text-zinc-700">•</span> {project.aiProvider}
                </p>
                <p className="text-xs text-zinc-500 tabular-nums">
                  {project.createdAt ? new Date(project.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }) : "—"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="flex items-center gap-4 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 p-4 rounded-full shadow-2xl shadow-black/50">
            <span className="text-zinc-200 font-medium pl-2">
              {selectedIds.size} projeto(s) selecionado(s)
            </span>
            <div className="w-px h-6 bg-zinc-700" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="flex items-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 px-5 py-2 rounded-full text-sm font-medium transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? "Excluindo..." : "Excluir Selecionados"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
