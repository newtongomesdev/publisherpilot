"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Workspace = {
  id: string;
  name: string;
  slug: string;
};

export function WorkspaceSwitcher() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState("");
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const router = useRouter();

  useEffect(() => {
    void (async () => {
      try {
        const [workspacesResponse, settingsResponse] = await Promise.all([
          fetch("/api/workspaces", { cache: "no-store" }).catch(() => null),
          fetch("/api/settings", { cache: "no-store" }).catch(() => null),
        ]);

        if (workspacesResponse?.ok) {
          const payload = await workspacesResponse.json().catch(() => ({}));
          setWorkspaces(payload.workspaces ?? []);
        }

        if (settingsResponse?.ok) {
          const payload = await settingsResponse.json().catch(() => ({}));
          setActiveWorkspaceId(payload.workspace?.id ?? "");
        }
      } catch {
        // silently ignore - component will show empty state
      }
    })();
  }, []);

  async function handleSwitch(workspaceId: string) {
    setActiveWorkspaceId(workspaceId);
    await fetch("/api/workspaces/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId }),
    });
    router.refresh();
  }

  async function handleCreateWorkspace() {
    if (!newWorkspaceName.trim()) {
      return;
    }

    const response = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newWorkspaceName.trim() }),
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setNewWorkspaceName("");
    setActiveWorkspaceId(payload.workspace.id);
    setWorkspaces((current) => [payload.workspace, ...current]);
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Workspaces</p>
      <select
        className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none"
        value={activeWorkspaceId}
        onChange={(event) => handleSwitch(event.target.value)}
      >
        <option value="" disabled>
          Selecione um workspace
        </option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
      <div className="space-y-2">
        <input
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none"
          placeholder="Novo workspace"
          value={newWorkspaceName}
          onChange={(event) => setNewWorkspaceName(event.target.value)}
        />
        <button
          type="button"
          onClick={handleCreateWorkspace}
          className="w-full rounded-full border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
        >
          Criar workspace
        </button>
      </div>
    </div>
  );
}
