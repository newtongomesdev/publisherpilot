'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { ChatPanel } from './chat-panel';
import { PreviewPanel } from './preview-panel';
import { Timeline } from './timeline';
import { SettingsPanel } from './settings-panel';
import { Collections } from './collections';
import { Video, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

function VideoStudioInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const initialMode = searchParams.get('mode');

  const { isGenerating, setIsGenerating, addClip, setPreviewClip, prompt, mode, duration, resolution, camera, imageUrl, videoUrl } =
    useVideoStudioStore();

  useEffect(() => {
    if (initialPrompt) {
      useVideoStudioStore.getState().setPrompt(initialPrompt);
    }
    if (initialMode) {
      useVideoStudioStore.getState().setMode(initialMode as any);
    }
  }, [initialPrompt, initialMode]);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const state = useVideoStudioStore.getState();
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode,
          provider: state.selectedProvider,
          model: state.selectedModel,
          duration,
          resolution,
          camera,
          imageUrl,
          videoUrl,
        }),
      });

      const data = await response.json();
      if (data.ok && data.video) {
        const clip = {
          ...data.video,
          prompt,
          createdAt: new Date(),
        };
        addClip(clip);
        setPreviewClip(clip);
      } else {
        alert(data.error || 'Falha ao gerar video');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao conectar com a API');
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-zinc-950 shadow-lg shadow-emerald-500/20">
            <Video className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Video Studio</h1>
            <p className="text-xs text-zinc-500">Gerador de Videos AI</p>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] min-h-0">
        <div className="border-r border-zinc-800/60 overflow-hidden">
          <ChatPanel />
        </div>

        <div className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <PreviewPanel />
          </div>
          <Timeline />
        </div>

        <div className="border-l border-zinc-800/60 overflow-y-auto p-4 space-y-6">
          <SettingsPanel />
          <div className="border-t border-zinc-800/60 pt-4">
            <Collections />
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/60 px-6 py-4 flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed px-12 py-3 rounded-xl text-white font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Video'
          )}
        </button>
      </div>
    </div>
  );
}

export function VideoStudio() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <VideoStudioInner />
    </Suspense>
  );
}
