'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import type { CameraConfig } from '@/lib/video/types';

const CAMERA_OPTIONS: { type: CameraConfig['type']; label: string }[] = [
  { type: 'static', label: 'Estatica' },
  { type: 'pan', label: 'Pan' },
  { type: 'tilt', label: 'Tilt' },
  { type: 'zoom', label: 'Zoom' },
  { type: 'orbit', label: 'Orbit' },
];

export function CameraControls() {
  const { camera, setCamera } = useVideoStudioStore();

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {CAMERA_OPTIONS.map((opt) => (
        <button
          key={opt.type}
          onClick={() => setCamera({ type: opt.type })}
          className={`py-2 rounded-lg text-xs font-medium transition-all ${
            camera.type === opt.type
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
