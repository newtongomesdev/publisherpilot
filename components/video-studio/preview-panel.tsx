'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { Play, Download, Loader2, Upload, X } from 'lucide-react';
import { ModeTabs } from './mode-tabs';
import { CameraControls } from './camera-controls';

function ImageInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress image to fit within API body size limits
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_WIDTH = 1024;
      const MAX_HEIGHT = 1024;
      let { width, height } = img;
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      onChange(compressed);
      URL.revokeObjectURL(url);
    };
    img.src = url;
    e.target.value = '';
  }

  const isDataUrl = value?.startsWith('data:');

  return (
    <div>
      <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">{label}</label>
      {value ? (
        <div className="relative">
          <img
            src={value}
            alt={label}
            className="w-full h-32 object-cover rounded-xl border border-zinc-800"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-black/70 hover:bg-black/90 rounded-lg p-1.5 text-white transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          {isDataUrl && (
            <span className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-0.5 text-[10px] text-zinc-300">
              Arquivo local
            </span>
          )}
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="URL da imagem"
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
          />
          <label className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 text-sm">
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Arquivo</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
        </div>
      )}
    </div>
  );
}

export function PreviewPanel() {
  const store = useVideoStudioStore();
  const { previewClip, isGenerating, prompt, setPrompt, imageUrl, setImageUrl, finalImageUrl, setFinalImageUrl, mode, videoUrl, setVideoUrl } = store;

  return (
    <div className="flex flex-col h-full">
      <ModeTabs />

      <div className="p-4 border-b border-zinc-800/60">
        {mode === 'text-to-video' && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva a cena do video..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 resize-none h-24"
          />
        )}
        {mode === 'image-to-video' && (
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Como animar esta imagem?"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 resize-none h-20"
            />
            <ImageInput
              label="Imagem Inicial (primeiro frame)"
              value={imageUrl}
              onChange={setImageUrl}
            />
            <ImageInput
              label="Imagem Final (ultimo frame, opcional)"
              value={finalImageUrl}
              onChange={setFinalImageUrl}
            />
          </div>
        )}
        {(mode === 'extend' || mode === 'edit') && (
          <div className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={mode === 'extend' ? 'Continuar a cena...' : 'Instrucao de edicao...'}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 resize-none h-20"
            />
            <input
              type="url"
              value={videoUrl || ''}
              onChange={(e) => setVideoUrl(e.target.value || null)}
              placeholder="URL do video para estender/editar"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
            />
          </div>
        )}
        {mode === 'scene' && (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Descreva a composicao da cena com multiplos elementos..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600 resize-none h-24"
          />
        )}
      </div>

      <div className="flex-1 flex items-center justify-center bg-zinc-950 relative">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
            <p className="text-sm text-zinc-500">Gerando video...</p>
          </div>
        ) : previewClip ? (
          <div className="relative w-full max-w-lg">
            <video
              src={previewClip.videoUrl}
              controls
              className="w-full rounded-xl"
              poster={previewClip.thumbnailUrl}
            />
            <a
              href={previewClip.videoUrl}
              download
              className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 rounded-lg p-2 text-white transition-colors"
            >
              <Download className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-zinc-600">
            <Play className="h-12 w-12" />
            <p className="text-sm">Preview do video</p>
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <CameraControls />
        </div>
      </div>
    </div>
  );
}
