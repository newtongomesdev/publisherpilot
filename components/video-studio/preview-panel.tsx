'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { Play, Download, Loader2 } from 'lucide-react';
import { ModeTabs } from './mode-tabs';
import { CameraControls } from './camera-controls';

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
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Imagem Inicial (primeiro frame)</label>
              <input
                type="url"
                value={imageUrl || ''}
                onChange={(e) => setImageUrl(e.target.value || null)}
                placeholder="URL da imagem inicial"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1 block">Imagem Final (ultimo frame, opcional)</label>
              <input
                type="url"
                value={finalImageUrl || ''}
                onChange={(e) => setFinalImageUrl(e.target.value || null)}
                placeholder="URL da imagem final (opcional)"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
              />
            </div>
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
