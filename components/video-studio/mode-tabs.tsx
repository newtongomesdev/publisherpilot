'use client';

import { useVideoStudioStore } from '@/lib/video/store';

const MODES = [
  { id: 'text-to-video' as const, label: 'Text to Video' },
  { id: 'image-to-video' as const, label: 'Image to Video' },
  { id: 'extend' as const, label: 'Extender' },
  { id: 'scene' as const, label: 'Scenebuilder' },
  { id: 'edit' as const, label: 'Editar Objeto' },
];

export function ModeTabs() {
  const { mode, setMode } = useVideoStudioStore();

  return (
    <div className="flex gap-0 border-b border-zinc-800/60 bg-zinc-950/50">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setMode(m.id)}
          className={`px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
            mode === m.id
              ? 'text-emerald-400 border-b-2 border-emerald-400'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
