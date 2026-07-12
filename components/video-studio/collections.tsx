'use client';

import { useState } from 'react';
import { useVideoStudioStore } from '@/lib/video/store';
import { Plus, Folder } from 'lucide-react';

export function Collections() {
  const { collections, addCollection, clips } = useVideoStudioStore();
  const [newName, setNewName] = useState('');
  const [showInput, setShowInput] = useState(false);

  function handleCreate() {
    if (newName.trim()) {
      addCollection(newName.trim());
      setNewName('');
      setShowInput(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">Collections</h4>
        <button
          onClick={() => setShowInput(true)}
          className="text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {showInput && (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Nome da collection"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
            autoFocus
          />
          <button
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-500 rounded-lg px-3 py-1.5 text-xs text-white"
          >
            OK
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {collections.map((col) => (
          <div
            key={col.id}
            className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <Folder className="h-5 w-5 text-zinc-600" />
            <span className="text-[10px] text-zinc-500 text-center truncate w-full">{col.name}</span>
            <span className="text-[10px] text-zinc-700">{col.clips.length} clips</span>
          </div>
        ))}

        {clips.length > 0 && (
          <div className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:border-zinc-700 transition-colors">
            <span className="text-zinc-700 text-lg">+</span>
          </div>
        )}
      </div>
    </div>
  );
}
