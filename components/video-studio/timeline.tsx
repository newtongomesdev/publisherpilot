'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { GripVertical, Trash2, Plus } from 'lucide-react';

export function Timeline() {
  const { clips, activeClipId, removeClip, setPreviewClip } = useVideoStudioStore();

  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;

  return (
    <div className="bg-zinc-950/50 border-t border-zinc-800/60 px-4 py-3">
      <div className="flex items-center gap-3 mb-2">
        <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Timeline</h4>
        <span className="text-xs text-zinc-600">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {clips.map((clip) => (
          <div
            key={clip.id}
            className={`group relative min-w-[120px] h-12 rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all ${
              activeClipId === clip.id
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white ring-2 ring-emerald-400'
                : 'bg-gradient-to-r from-zinc-800 to-zinc-700 text-zinc-300 hover:ring-1 hover:ring-zinc-600'
            }`}
            onClick={() => setPreviewClip(clip)}
          >
            <GripVertical className="h-3 w-3 absolute left-2 opacity-0 group-hover:opacity-50 transition-opacity" />
            <span className="truncate px-6">
              {clip.prompt.slice(0, 20) || 'Clip'} ({clip.duration}s)
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeClip(clip.id);
              }}
              className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}

        <div className="min-w-[80px] h-12 bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-lg flex items-center justify-center text-zinc-600 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Add
        </div>
      </div>
    </div>
  );
}
