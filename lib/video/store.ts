import { create } from 'zustand';
import type { VideoClip, Collection, CameraConfig } from './types';

interface VideoStudioState {
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;
  mode: 'text-to-video' | 'image-to-video' | 'extend' | 'scene' | 'edit';
  prompt: string;
  negativePrompt: string;
  imageUrl: string | null;
  finalImageUrl: string | null;
  videoUrl: string | null;
  camera: CameraConfig;
  duration: number;
  resolution: '720p' | '1080p';
  clips: VideoClip[];
  activeClipId: string | null;
  collections: Collection[];
  isGenerating: boolean;
  previewClip: VideoClip | null;

  setProvider: (id: string) => void;
  setModel: (id: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setMode: (mode: VideoStudioState['mode']) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setImageUrl: (url: string | null) => void;
  setFinalImageUrl: (url: string | null) => void;
  setVideoUrl: (url: string | null) => void;
  setCamera: (camera: CameraConfig) => void;
  setDuration: (duration: number) => void;
  setResolution: (resolution: '720p' | '1080p') => void;
  setIsGenerating: (v: boolean) => void;
  setPreviewClip: (clip: VideoClip | null) => void;
  addClip: (clip: VideoClip) => void;
  removeClip: (id: string) => void;
  reorderClips: (from: number, to: number) => void;
  addCollection: (name: string) => void;
  addToCollection: (collectionId: string, clip: VideoClip) => void;
  removeFromCollection: (collectionId: string, clipId: string) => void;
}

export const useVideoStudioStore = create<VideoStudioState>((set) => ({
  selectedProvider: 'fal',
  selectedModel: 'kling-2.0',
  apiKeys: {},
  mode: 'text-to-video',
  prompt: '',
  negativePrompt: '',
  imageUrl: null,
  finalImageUrl: null,
  videoUrl: null,
  camera: { type: 'static' },
  duration: 4,
  resolution: '720p',
  clips: [],
  activeClipId: null,
  collections: [],
  isGenerating: false,
  previewClip: null,

  setProvider: (id) => set({ selectedProvider: id }),
  setModel: (id) => set({ selectedModel: id }),
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
  setMode: (mode) => set({ mode }),
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
  setFinalImageUrl: (finalImageUrl) => set({ finalImageUrl }),
  setVideoUrl: (videoUrl) => set({ videoUrl }),
  setCamera: (camera) => set({ camera }),
  setDuration: (duration) => set({ duration }),
  setResolution: (resolution) => set({ resolution }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setPreviewClip: (previewClip) => set({ previewClip }),
  addClip: (clip) => set((state) => ({ clips: [...state.clips, clip] })),
  removeClip: (id) => set((state) => ({ clips: state.clips.filter((c) => c.id !== id) })),
  reorderClips: (from, to) =>
    set((state) => {
      const clips = [...state.clips];
      const [moved] = clips.splice(from, 1);
      clips.splice(to, 0, moved);
      return { clips };
    }),
  addCollection: (name) =>
    set((state) => ({
      collections: [
        ...state.collections,
        { id: `col-${Date.now()}`, name, clips: [], createdAt: new Date() },
      ],
    })),
  addToCollection: (collectionId, clip) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId ? { ...c, clips: [...c.clips, clip] } : c
      ),
    })),
  removeFromCollection: (collectionId, clipId) =>
    set((state) => ({
      collections: state.collections.map((c) =>
        c.id === collectionId ? { ...c, clips: c.clips.filter((cl) => cl.id !== clipId) } : c
      ),
    })),
}));
