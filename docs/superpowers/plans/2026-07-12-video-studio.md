# Video Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a video generation studio in PublisherPilot, similar to Google Flow, with multi-provider support, chat AI, timeline editor, and collections.

**Architecture:** Modular video provider system following the existing image provider pattern. Zustand store for state management. Three-column UI layout with chat, preview+timeline, and settings+collections.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, Zustand, FAL.ai API, OpenRouter (chat), Lucide icons

---

### Task 1: Video Provider Types & Interface

**Files:**
- Create: `lib/video/types.ts`
- Create: `lib/video/video-provider.ts`

- [ ] **Step 1: Create types file**

```typescript
// lib/video/types.ts

export interface VideoGenerationRequest {
  prompt: string;
  negativePrompt?: string;
  mode: 'text-to-video' | 'image-to-video' | 'extend' | 'scene' | 'edit';
  imageUrl?: string;
  videoUrl?: string;
  duration: number;
  resolution: '720p' | '1080p';
  camera?: CameraConfig;
  fps?: number;
}

export interface CameraConfig {
  type: 'static' | 'pan' | 'tilt' | 'zoom' | 'orbit';
  direction?: string;
  intensity?: number;
}

export interface VideoGenerationResponse {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  model: string;
  provider: string;
  cost: number;
  status: 'generating' | 'completed' | 'failed';
}

export interface VideoModel {
  id: string;
  name: string;
  capabilities: string[];
  maxDuration: number;
  resolutions: string[];
}

export interface ModelPrice {
  perVideo: number;
  perSecond: number;
  currency: 'USD';
}

export interface VideoClip {
  id: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  prompt: string;
  model: string;
  provider: string;
  cost: number;
  createdAt: Date;
}

export interface Collection {
  id: string;
  name: string;
  clips: VideoClip[];
  createdAt: Date;
}
```

- [ ] **Step 2: Create video provider interface**

```typescript
// lib/video/video-provider.ts

import type { VideoGenerationRequest, VideoGenerationResponse, VideoModel, ModelPrice } from './types';

export interface VideoProvider {
  id: string;
  name: string;
  label: string;
  generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse>;
  extendVideo(videoUrl: string, prompt: string): Promise<VideoGenerationResponse>;
  editVideo(videoUrl: string, instruction: string): Promise<VideoGenerationResponse>;
  getModels(): VideoModel[];
  getPrice(modelId: string): ModelPrice;
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/video/types.ts lib/video/video-provider.ts
git commit -m "feat(video): add video provider types and interface"
```

---

### Task 2: FAL Video Provider

**Files:**
- Create: `lib/video/providers/fal.ts`
- Create: `lib/video/providers/unsupported.ts`

- [ ] **Step 1: Create FAL video provider**

```typescript
// lib/video/providers/fal.ts

import type { VideoProvider } from '../video-provider';
import type { VideoGenerationRequest, VideoGenerationResponse, VideoModel, ModelPrice } from '../types';

export interface FalVideoModel {
  modelId: string;
  name: string;
  falModel: string;
  capabilities: string[];
  maxDuration: number;
  resolutions: string[];
  costPerSecond: number;
  description: string;
}

export const FAL_VIDEO_MODELS: FalVideoModel[] = [
  {
    modelId: 'kling-2.0',
    name: 'Kling 2.0',
    falModel: 'fal-ai/kling-video/v2',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 10,
    resolutions: ['720p', '1080p'],
    costPerSecond: 0.015,
    description: 'High quality video generation with good motion and coherence',
  },
  {
    modelId: 'kling-1.6',
    name: 'Kling 1.6',
    falModel: 'fal-ai/kling-video/v1/6',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 10,
    resolutions: ['720p'],
    costPerSecond: 0.01,
    description: 'Cost-effective video generation',
  },
  {
    modelId: 'minimax-video',
    name: 'MiniMax Video',
    falModel: 'fal-ai/minimax-video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 6,
    resolutions: ['720p', '1080p'],
    costPerSecond: 0.02,
    description: 'Fast generation with good quality',
  },
  {
    modelId: 'hailuo-video',
    name: 'Hailuo Video',
    falModel: 'fal-ai/hailuo/video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 6,
    resolutions: ['720p'],
    costPerSecond: 0.008,
    description: 'Budget-friendly option with decent quality',
  },
];

function resolveFalModel(modelId: string): FalVideoModel {
  const model = FAL_VIDEO_MODELS.find((m) => m.modelId === modelId);
  if (!model) throw new Error(`Unknown FAL video model: ${modelId}`);
  return model;
}

export const falVideoProvider: VideoProvider = {
  id: 'fal',
  name: 'fal',
  label: 'FAL.ai',

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const modelId = (request as any).model || 'kling-2.0';
    const model = resolveFalModel(modelId);
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) throw new Error('FAL_KEY environment variable is not set');

    const body: Record<string, any> = {
      prompt: request.prompt,
      num_frames: request.duration * 8,
    };

    if (request.negativePrompt) body.negative_prompt = request.negativePrompt;
    if (request.imageUrl) body.image_url = request.imageUrl;
    if (request.resolution === '1080p') body.quality = 'high';

    if (request.camera) {
      body.camera = {
        type: request.camera.type,
        ...(request.camera.direction && { direction: request.camera.direction }),
        ...(request.camera.intensity && { intensity: request.camera.intensity }),
      };
    }

    const response = await fetch(`https://fal.run/${model.falModel}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`FAL API error: ${error}`);
    }

    const data = await response.json();
    const videoUrl = data.video?.url || data.output?.video_url;

    if (!videoUrl) throw new Error('No video URL in FAL response');

    return {
      id: `fal-${Date.now()}`,
      videoUrl,
      thumbnailUrl: data.video?.thumbnail_url || data.output?.thumbnail_url,
      duration: request.duration,
      model: model.name,
      provider: 'fal',
      cost: model.costPerSecond * request.duration,
      status: 'completed',
    };
  },

  async extendVideo(videoUrl: string, prompt: string): Promise<VideoGenerationResponse> {
    return this.generateVideo({
      prompt,
      mode: 'extend',
      videoUrl,
      duration: 4,
      resolution: '720p',
    } as any);
  },

  async editVideo(videoUrl: string, instruction: string): Promise<VideoGenerationResponse> {
    return this.generateVideo({
      prompt: instruction,
      mode: 'edit',
      videoUrl,
      duration: 4,
      resolution: '720p',
    } as any);
  },

  getModels(): VideoModel[] {
    return FAL_VIDEO_MODELS.map((m) => ({
      id: m.modelId,
      name: m.name,
      capabilities: m.capabilities,
      maxDuration: m.maxDuration,
      resolutions: m.resolutions,
    }));
  },

  getPrice(modelId: string): ModelPrice {
    const model = resolveFalModel(modelId);
    return {
      perVideo: model.costPerSecond * 4,
      perSecond: model.costPerSecond,
      currency: 'USD',
    };
  },
};
```

- [ ] **Step 2: Create unsupported provider stub**

```typescript
// lib/video/providers/unsupported.ts

import type { VideoProvider } from '../video-provider';
import type { VideoGenerationRequest, VideoGenerationResponse, VideoModel, ModelPrice } from '../types';

export function createUnsupportedVideoProvider(name: string, label: string): VideoProvider {
  return {
    id: name,
    name,
    label,
    async generateVideo(): Promise<VideoGenerationResponse> {
      throw new Error(`${label} video provider is not yet supported`);
    },
    async extendVideo(): Promise<VideoGenerationResponse> {
      throw new Error(`${label} video provider is not yet supported`);
    },
    async editVideo(): Promise<VideoGenerationResponse> {
      throw new Error(`${label} video provider is not yet supported`);
    },
    getModels(): VideoModel[] {
      return [];
    },
    getPrice(): ModelPrice {
      return { perVideo: 0, perSecond: 0, currency: 'USD' };
    },
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/video/providers/fal.ts lib/video/providers/unsupported.ts
git commit -m "feat(video): add FAL video provider and unsupported stub"
```

---

### Task 3: Video Provider Registry

**Files:**
- Create: `lib/video/registry.ts`

- [ ] **Step 1: Create registry**

```typescript
// lib/video/registry.ts

import type { VideoProvider } from './video-provider';
import { falVideoProvider } from './providers/fal';
import { createUnsupportedVideoProvider } from './providers/unsupported';

const videoProviders = new Map<string, VideoProvider>();

function register(provider: VideoProvider) {
  videoProviders.set(provider.id, provider);
}

register(falVideoProvider);
register(createUnsupportedVideoProvider('replicate', 'Replicate'));
register(createUnsupportedVideoProvider('openai-sora', 'OpenAI Sora'));

export function getVideoProvider(name: string): VideoProvider | undefined {
  return videoProviders.get(name);
}

export function listVideoProviders(): VideoProvider[] {
  return Array.from(videoProviders.values());
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/video/registry.ts
git commit -m "feat(video): add video provider registry"
```

---

### Task 4: Video API Routes

**Files:**
- Create: `app/api/video/generate/route.ts`
- Create: `app/api/video/models/route.ts`

- [ ] **Step 1: Create generate route**

```typescript
// app/api/video/generate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getVideoProvider } from '@/lib/video/registry';

const generateVideoSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  mode: z.enum(['text-to-video', 'image-to-video', 'extend', 'scene', 'edit']),
  model: z.string().optional().default('kling-2.0'),
  provider: z.string().optional().default('fal'),
  imageUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().min(1).max(30).optional().default(4),
  resolution: z.enum(['720p', '1080p']).optional().default('720p'),
  camera: z
    .object({
      type: z.enum(['static', 'pan', 'tilt', 'zoom', 'orbit']),
      direction: z.string().optional(),
      intensity: z.number().optional(),
    })
    .optional(),
  fps: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = generateVideoSchema.parse(body);

    const videoProvider = getVideoProvider(parsed.provider);
    if (!videoProvider) {
      return NextResponse.json({ error: `Unknown provider: ${parsed.provider}` }, { status: 400 });
    }

    const result = await videoProvider.generateVideo({
      prompt: parsed.prompt,
      negativePrompt: parsed.negativePrompt,
      mode: parsed.mode,
      imageUrl: parsed.imageUrl,
      videoUrl: parsed.videoUrl,
      duration: parsed.duration,
      resolution: parsed.resolution,
      camera: parsed.camera,
      fps: parsed.fps,
      model: parsed.model,
    } as any);

    return NextResponse.json({ ok: true, video: result });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to generate video' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create models route**

```typescript
// app/api/video/models/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { listVideoProviders } from '@/lib/video/registry';

export async function GET(req: NextRequest) {
  const providerParam = req.nextUrl.searchParams.get('provider');

  const providers = listVideoProviders();
  const result = providers.map((p) => ({
    id: p.id,
    name: p.label,
    models: p.getModels().map((m) => ({
      ...m,
      price: p.getPrice(m.id),
    })),
  }));

  if (providerParam) {
    const filtered = result.filter((r) => r.id === providerParam);
    return NextResponse.json({ providers: filtered });
  }

  return NextResponse.json({ providers: result });
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/video/generate/route.ts app/api/video/models/route.ts
git commit -m "feat(video): add video generate and models API routes"
```

---

### Task 5: Zustand Store

**Files:**
- Create: `lib/video/store.ts`

- [ ] **Step 1: Create store**

```typescript
// lib/video/store.ts

import { create } from 'zustand';
import type { VideoClip, Collection, CameraConfig } from './types';

interface VideoStudioState {
  // Provider/Model
  selectedProvider: string;
  selectedModel: string;
  apiKeys: Record<string, string>;

  // Generation
  mode: 'text-to-video' | 'image-to-video' | 'extend' | 'scene' | 'edit';
  prompt: string;
  negativePrompt: string;
  imageUrl: string | null;
  videoUrl: string | null;
  camera: CameraConfig;
  duration: number;
  resolution: '720p' | '1080p';

  // Timeline
  clips: VideoClip[];
  activeClipId: string | null;

  // Collections
  collections: Collection[];

  // UI
  isGenerating: boolean;
  previewClip: VideoClip | null;

  // Actions
  setProvider: (id: string) => void;
  setModel: (id: string) => void;
  setApiKey: (provider: string, key: string) => void;
  setMode: (mode: VideoStudioState['mode']) => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (prompt: string) => void;
  setImageUrl: (url: string | null) => void;
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
  // Provider/Model
  selectedProvider: 'fal',
  selectedModel: 'kling-2.0',
  apiKeys: {},

  // Generation
  mode: 'text-to-video',
  prompt: '',
  negativePrompt: '',
  imageUrl: null,
  videoUrl: null,
  camera: { type: 'static' },
  duration: 4,
  resolution: '720p',

  // Timeline
  clips: [],
  activeClipId: null,

  // Collections
  collections: [],

  // UI
  isGenerating: false,
  previewClip: null,

  // Actions
  setProvider: (id) => set({ selectedProvider: id }),
  setModel: (id) => set({ selectedModel: id }),
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
  setMode: (mode) => set({ mode }),
  setPrompt: (prompt) => set({ prompt }),
  setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
  setImageUrl: (imageUrl) => set({ imageUrl }),
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/video/store.ts
git commit -m "feat(video): add Zustand store for video studio"
```

---

### Task 6: Chat Panel Component

**Files:**
- Create: `components/video-studio/chat-panel.tsx`

- [ ] **Step 1: Create chat panel**

```typescript
// components/video-studio/chat-panel.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { useVideoStudioStore } from '@/lib/video/store';
import { Send } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are a video production assistant. You help users refine their prompts for AI video generation. When given a rough idea, suggest a detailed, cinematic prompt. You can also suggest camera movements, duration, and settings. Keep responses concise and actionable. Always respond in the same language as the user.`;

export function ChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'O que voce quer criar? Descreva a cena do seu video e eu ajudo a refinar o prompt.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { setPrompt, setCamera, setDuration } = useVideoStudioStore();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/video/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const data = await response.json();
      const assistantMessage = data.reply || 'Desculpe, nao consegui processar.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);

      // Try to extract prompt suggestion from the response
      const promptMatch = assistantMessage.match(/Prompt:?\s*["'](.+?)["']/i);
      if (promptMatch) {
        setPrompt(promptMatch[1]);
      }

      // Try to extract camera suggestion
      const cameraMatch = assistantMessage.match(/Camera:?\s*(pan|tilt|zoom|orbit|static)/i);
      if (cameraMatch) {
        setCamera({ type: cameraMatch[1].toLowerCase() as any });
      }

      // Try to extract duration suggestion
      const durationMatch = assistantMessage.match(/Duracao:?\s*(\d+)s/i);
      if (durationMatch) {
        setDuration(parseInt(durationMatch[1]));
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Erro ao conectar com o assistente. Verifique sua API key.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/50">
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-semibold">AI Assistant</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`rounded-xl px-4 py-3 max-w-[90%] ${
              msg.role === 'assistant'
                ? 'bg-zinc-900 text-zinc-300'
                : 'bg-emerald-600 text-white ml-auto'
            }`}
          >
            {msg.role === 'assistant' && (
              <p className="text-[10px] text-zinc-500 mb-1 font-medium">AI</p>
            )}
            <p className="text-sm leading-relaxed">{msg.content}</p>
          </div>
        ))}
        {isLoading && (
          <div className="bg-zinc-900 rounded-xl px-4 py-3 max-w-[90%]">
            <p className="text-[10px] text-zinc-500 mb-1 font-medium">AI</p>
            <p className="text-sm text-zinc-400 animate-pulse">Pensando...</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-zinc-800/60">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Digite sua mensagem..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl p-3 text-white transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/chat-panel.tsx
git commit -m "feat(video): add chat panel component"
```

---

### Task 7: Chat API Route

**Files:**
- Create: `app/api/video/chat/route.ts`

- [ ] **Step 1: Create chat route**

```typescript
// app/api/video/chat/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = chatSchema.parse(body);

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set' }, { status: 500 });
    }

    const response = await fetch(`${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:4578',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'PublisherPilot',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-001',
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${error}` }, { status: 502 });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'No response from model.';

    return NextResponse.json({ ok: true, reply });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/video/chat/route.ts
git commit -m "feat(video): add video chat API route"
```

---

### Task 8: Settings Panel Component

**Files:**
- Create: `components/video-studio/settings-panel.tsx`

- [ ] **Step 1: Create settings panel**

```typescript
// components/video-studio/settings-panel.tsx

'use client';

import { useState, useEffect } from 'react';
import { useVideoStudioStore } from '@/lib/video/store';
import { ChevronDown, Key, DollarSign } from 'lucide-react';

interface ProviderModels {
  id: string;
  name: string;
  models: {
    id: string;
    name: string;
    capabilities: string[];
    maxDuration: number;
    resolutions: string[];
    price: { perVideo: number; perSecond: number; currency: string };
  }[];
}

export function SettingsPanel() {
  const {
    selectedProvider,
    selectedModel,
    apiKeys,
    duration,
    resolution,
    setProvider,
    setModel,
    setApiKey,
    setDuration,
    setResolution,
  } = useVideoStudioStore();

  const [providers, setProviders] = useState<ProviderModels[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    fetch('/api/video/models')
      .then((r) => r.json())
      .then((data) => setProviders(data.providers || []))
      .catch(console.error);
  }, []);

  const currentProvider = providers.find((p) => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-5">
      {/* Provider */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Provider</label>
        <div className="relative">
          <select
            value={selectedProvider}
            onChange={(e) => {
              setProvider(e.target.value);
              const p = providers.find((pr) => pr.id === e.target.value);
              if (p?.models.length) setModel(p.models[0].id);
            }}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Modelo</label>
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            {currentProvider?.models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Price */}
      {currentModel && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
            <DollarSign className="h-3 w-3" />
            Custo por video
          </div>
          <p className="text-lg font-semibold text-emerald-400">
            ~${(currentModel.price.perSecond * duration).toFixed(3)}
          </p>
          <p className="text-xs text-zinc-600">{duration}s @ {resolution}</p>
          <p className="text-xs text-zinc-600 mt-1">{currentModel.price.perSecond}/s</p>
        </div>
      )}

      {/* Duration */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Duracao</label>
        <div className="relative">
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 appearance-none"
          >
            <option value={4}>4s</option>
            <option value={6}>6s</option>
            <option value={8}>8s</option>
            <option value={10}>10s</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
        </div>
      </div>

      {/* Resolution */}
      <div>
        <label className="text-xs text-zinc-500 mb-1.5 block">Resolucao</label>
        <div className="grid grid-cols-2 gap-2">
          {(['720p', '1080p'] as const).map((res) => (
            <button
              key={res}
              onClick={() => setResolution(res)}
              className={`py-2 rounded-lg text-xs font-medium transition-all ${
                resolution === res
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              {res}
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div>
        <button
          onClick={() => setShowApiKey(!showApiKey)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Key className="h-3 w-3" />
          API Key
        </button>
        {showApiKey && (
          <div className="mt-2">
            <input
              type="password"
              value={apiKeys[selectedProvider] || ''}
              onChange={(e) => setApiKey(selectedProvider, e.target.value)}
              placeholder={`Insira a API key do ${currentProvider?.name || 'provider'}`}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
            />
            <p className="text-[10px] text-zinc-600 mt-1">
              Chave salva apenas nesta sessao
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/settings-panel.tsx
git commit -m "feat(video): add settings panel with provider/model/price selector"
```

---

### Task 9: Camera Controls Component

**Files:**
- Create: `components/video-studio/camera-controls.tsx`

- [ ] **Step 1: Create camera controls**

```typescript
// components/video-studio/camera-controls.tsx

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
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/camera-controls.tsx
git commit -m "feat(video): add camera controls component"
```

---

### Task 10: Mode Tabs Component

**Files:**
- Create: `components/video-studio/mode-tabs.tsx`

- [ ] **Step 1: Create mode tabs**

```typescript
// components/video-studio/mode-tabs.tsx

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
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/mode-tabs.tsx
git commit -m "feat(video): add mode tabs component"
```

---

### Task 11: Preview Panel Component

**Files:**
- Create: `components/video-studio/preview-panel.tsx`

- [ ] **Step 1: Create preview panel**

```typescript
// components/video-studio/preview-panel.tsx

'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { Play, Download, Loader2 } from 'lucide-react';
import { ModeTabs } from './mode-tabs';
import { CameraControls } from './camera-controls';

export function PreviewPanel() {
  const { previewClip, isGenerating, prompt, setPrompt, imageUrl, setImageUrl, mode } =
    useVideoStudioStore();

  return (
    <div className="flex flex-col h-full">
      <ModeTabs />

      {/* Form area based on mode */}
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
            <input
              type="url"
              value={imageUrl || ''}
              onChange={(e) => setImageUrl(e.target.value || null)}
              placeholder="URL da imagem para animar"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-600"
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
              value={useVideoStudioStore.getState().videoUrl || ''}
              onChange={(e) => useVideoStudioStore.getState().setVideoUrl(e.target.value || null)}
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

      {/* Preview */}
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

        {/* Camera controls overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <CameraControls />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/preview-panel.tsx
git commit -m "feat(video): add preview panel with form, video preview, and camera controls"
```

---

### Task 12: Timeline Component

**Files:**
- Create: `components/video-studio/timeline.tsx`

- [ ] **Step 1: Create timeline**

```typescript
// components/video-studio/timeline.tsx

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
            <span className="truncate px-6">{clip.prompt.slice(0, 20) || 'Clip'} ({clip.duration}s)</span>
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
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/timeline.tsx
git commit -m "feat(video): add timeline component"
```

---

### Task 13: Collections Component

**Files:**
- Create: `components/video-studio/collections.tsx`

- [ ] **Step 1: Create collections**

```typescript
// components/video-studio/collections.tsx

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
          <div
            className="aspect-square bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:border-zinc-700 transition-colors"
          >
            <span className="text-zinc-700 text-lg">+</span>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/collections.tsx
git commit -m "feat(video): add collections component"
```

---

### Task 14: Main Video Studio Page

**Files:**
- Create: `components/video-studio/index.tsx`
- Create: `app/dashboard/video-generator/page.tsx`

- [ ] **Step 1: Create main component**

```typescript
// components/video-studio/index.tsx

'use client';

import { useVideoStudioStore } from '@/lib/video/store';
import { ChatPanel } from './chat-panel';
import { PreviewPanel } from './preview-panel';
import { Timeline } from './timeline';
import { SettingsPanel } from './settings-panel';
import { Collections } from './collections';
import { Video, Loader2 } from 'lucide-react';

export function VideoStudio() {
  const { isGenerating, setIsGenerating, addClip, setPreviewClip, prompt, mode, provider, model, duration, resolution, camera, imageUrl, videoUrl } =
    useVideoStudioStore();

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/video/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode,
          provider: useVideoStudioStore.getState().selectedProvider,
          model: useVideoStudioStore.getState().selectedModel,
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
      {/* Header */}
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

      {/* 3 Column Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] min-h-0">
        {/* Left: Chat */}
        <div className="border-r border-zinc-800/60 overflow-hidden">
          <ChatPanel />
        </div>

        {/* Center: Preview + Timeline */}
        <div className="flex flex-col min-h-0">
          <div className="flex-1 min-h-0">
            <PreviewPanel />
          </div>
          <Timeline />
        </div>

        {/* Right: Settings + Collections */}
        <div className="border-l border-zinc-800/60 overflow-y-auto p-4 space-y-6">
          <SettingsPanel />
          <div className="border-t border-zinc-800/60 pt-4">
            <Collections />
          </div>
        </div>
      </div>

      {/* Generate Button */}
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
```

- [ ] **Step 2: Create page**

```typescript
// app/dashboard/video-generator/page.tsx

import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard-shell';
import { VideoStudio } from '@/components/video-studio';
import { requireCurrentUser } from '@/lib/auth/session';
import { requireCurrentWorkspace } from '@/lib/workspaces/session';

export const dynamic = 'force-dynamic';

export default async function VideoGeneratorPage() {
  const user = await requireCurrentUser();
  if (!user) redirect('/login');

  let workspace;
  try {
    workspace = await requireCurrentWorkspace();
  } catch {}
  if (!workspace) {
    const { getDefaultWorkspaceByUser } = await import('@/lib/db/queries');
    workspace = await getDefaultWorkspaceByUser(user.id);
  }
  if (!workspace) redirect('/login');

  return (
    <DashboardShell userName={user.name} workspaceName={workspace.name}>
      <VideoStudio />
    </DashboardShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/video-studio/index.tsx app/dashboard/video-generator/page.tsx
git commit -m "feat(video): add main video studio page and component"
```

---

### Task 15: Add to Sidebar Navigation

**Files:**
- Modify: `components/dashboard-shell.tsx`

- [ ] **Step 1: Add Video Studio to sidebar**

In `components/dashboard-shell.tsx`, add the Video import and nav item:

```typescript
// Add to imports
import { LayoutDashboard, FileText, Download, Settings, Briefcase, PlusCircle, Mic, Volume2, BarChart3, Music, Layers, Image, PenTool, Search, Video } from "lucide-react";

// Add to navItems array (after "Busca")
{ name: "Video Studio", href: "/dashboard/video-generator", icon: Video },
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard-shell.tsx
git commit -m "feat(video): add Video Studio to sidebar navigation"
```

---

### Task 16: Integration with Articles

**Files:**
- Modify: `components/article-editor.tsx`

- [ ] **Step 1: Add video generation button to article editor**

Add a button in the article editor that opens the Video Studio with the article title as prompt. The implementation depends on the current article-editor.tsx structure - add a "Gerar Video" button that navigates to `/dashboard/video-generator` with a query param:

```typescript
// In the article editor, add import and button
import { Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Add button near other action buttons
const router = useRouter();

<button
  onClick={() => {
    const prompt = `Video resumo do artigo: ${article.title}`;
    router.push(`/dashboard/video-generator?prompt=${encodeURIComponent(prompt)}`);
  }}
  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
>
  <Video className="h-4 w-4" />
  Gerar Video
</button>
```

- [ ] **Step 2: Update video studio to read query params**

In `components/video-studio/index.tsx`, add useEffect to read prompt from URL:

```typescript
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

// Inside the component
const searchParams = useSearchParams();
const initialPrompt = searchParams.get('prompt');

useEffect(() => {
  if (initialPrompt) {
    useVideoStudioStore.getState().setPrompt(initialPrompt);
  }
}, [initialPrompt]);
```

- [ ] **Step 3: Commit**

```bash
git add components/article-editor.tsx components/video-studio/index.tsx
git commit -m "feat(video): add video generation integration with articles"
```

---

### Task 17: Integration with Carousel

**Files:**
- Modify: `app/dashboard/carousel/page.tsx`

- [ ] **Step 1: Add video export button to carousel**

Add a button in the carousel page that converts slides to video:

```typescript
// Add import and button
import { Video } from 'lucide-react';
import { useRouter } from 'next/navigation';

const router = useRouter();

<button
  onClick={() => {
    router.push('/dashboard/video-generator?mode=image-to-video');
  }}
  className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200"
>
  <Video className="h-4 w-4" />
  Converter em Video
</button>
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/carousel/page.tsx
git commit -m "feat(video): add video conversion integration with carousel"
```

---

### Task 18: URL Param Support for Video Studio

**Files:**
- Modify: `components/video-studio/index.tsx`

- [ ] **Step 1: Add search params support**

Update the main VideoStudio component to read initial state from URL params:

```typescript
// Add at top of component
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, Suspense } from 'react';

// Wrap with Suspense for searchParams
function VideoStudioInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const initialMode = searchParams.get('mode');

  useEffect(() => {
    if (initialPrompt) {
      useVideoStudioStore.getState().setPrompt(initialPrompt);
    }
    if (initialMode) {
      useVideoStudioStore.getState().setMode(initialMode as any);
    }
  }, [initialPrompt, initialMode]);

  // ... rest of component
}

export function VideoStudio() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>}>
      <VideoStudioInner />
    </Suspense>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/video-studio/index.tsx
git commit -m "feat(video): add URL params support for video studio"
```

---

## Summary

**Total tasks:** 18
**Files created:** 14 new files
**Files modified:** 3 existing files
**No database migrations needed** (all state is browser-side)

**Execution order:**
1. Tasks 1-3: Provider system (types, FAL provider, registry)
2. Tasks 4-5: API routes + store
3. Tasks 6-7: Chat system (component + API)
4. Tasks 8-13: UI components (settings, camera, tabs, preview, timeline, collections)
5. Task 14-15: Main page + sidebar
6. Tasks 16-18: Integrations (articles, carousel, URL params)
