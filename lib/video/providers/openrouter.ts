import type { VideoProvider } from '../video-provider';
import type { VideoGenerationRequest, VideoGenerationResponse, VideoModel, ModelPrice } from '../types';

export interface OpenRouterVideoModel {
  modelId: string;
  name: string;
  capabilities: string[];
  maxDuration: number;
  resolutions: string[];
  aspectRatios: string[];
  costPerSecond720p: number;
  costPerSecond1080p: number;
  description: string;
}

export const OPENROUTER_VIDEO_MODELS: OpenRouterVideoModel[] = [
  {
    modelId: 'google/veo-3.1-fast',
    name: 'Google Veo 3.1 Fast',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 8,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    costPerSecond720p: 0.25,
    costPerSecond1080p: 0.40,
    description: 'High quality with native audio. Fast tier.',
  },
  {
    modelId: 'google/veo-3.1-lite',
    name: 'Google Veo 3.1 Lite',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 8,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16'],
    costPerSecond720p: 0.10,
    costPerSecond1080p: 0.20,
    description: 'Cost-effective Google video model.',
  },
  {
    modelId: 'kwaivgi/kling-v3.0-pro',
    name: 'Kling 3.0 Pro',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 15,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    costPerSecond720p: 0.15,
    costPerSecond1080p: 0.30,
    description: 'Premium quality from Kuaishou.',
  },
  {
    modelId: 'kwaivgi/kling-v3.0-std',
    name: 'Kling 3.0 Standard',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 15,
    resolutions: ['720p', '1080p'],
    aspectRatios: ['16:9', '9:16', '1:1'],
    costPerSecond720p: 0.08,
    costPerSecond1080p: 0.15,
    description: 'Good quality, affordable.',
  },
  {
    modelId: 'x-ai/grok-imagine-video',
    name: 'Grok Imagine Video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 15,
    resolutions: ['480p', '720p'],
    aspectRatios: ['16:9', '9:16', '1:1', '4:3', '3:4', '3:2', '2:3'],
    costPerSecond720p: 0.05,
    costPerSecond1080p: 0.05,
    description: 'Fast generation from xAI.',
  },
];

function resolveModel(modelId: string): OpenRouterVideoModel {
  const model = OPENROUTER_VIDEO_MODELS.find((m) => m.modelId === modelId);
  if (!model) throw new Error(`Unknown OpenRouter video model: ${modelId}`);
  return model;
}

async function pollForCompletion(pollingUrl: string, apiKey: string, maxWaitMs = 300000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const response = await fetch(pollingUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`Polling failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status === 'completed') {
      return data;
    }
    if (data.status === 'failed') {
      throw new Error(data.error || 'Video generation failed');
    }
    // Wait 5 seconds before next poll
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('Video generation timed out');
}

export const openrouterVideoProvider: VideoProvider = {
  id: 'openrouter',
  name: 'openrouter',
  label: 'OpenRouter',

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const modelId = (request as any).model || 'google/veo-3.1-fast';
    const model = resolveModel(modelId);
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');

    const body: Record<string, any> = {
      model: modelId,
      prompt: request.prompt,
      resolution: request.resolution || '720p',
    };

    if (request.imageUrl) {
      body.frame_images = [request.imageUrl];
    }

    if (request.camera && request.camera.type !== 'static') {
      body.provider_options = {
        camera_motion: request.camera.type,
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost:4578',
        'X-Title': process.env.OPENROUTER_APP_NAME || 'PublisherPilot',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter video API error: ${error}`);
    }

    const job = await response.json();
    const result = await pollForCompletion(job.polling_url, apiKey);

    const videoUrl = result.unsigned_urls?.[0] || result.video_url;
    if (!videoUrl) throw new Error('No video URL in response');

    const cost = request.resolution === '1080p'
      ? model.costPerSecond1080p * request.duration
      : model.costPerSecond720p * request.duration;

    return {
      id: job.id || `or-${Date.now()}`,
      videoUrl,
      thumbnailUrl: result.thumbnail_url,
      duration: request.duration,
      model: model.name,
      provider: 'openrouter',
      cost,
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
    });
  },

  async editVideo(videoUrl: string, instruction: string): Promise<VideoGenerationResponse> {
    return this.generateVideo({
      prompt: instruction,
      mode: 'edit',
      videoUrl,
      duration: 4,
      resolution: '720p',
    });
  },

  getModels(): VideoModel[] {
    return OPENROUTER_VIDEO_MODELS.map((m) => ({
      id: m.modelId,
      name: m.name,
      capabilities: m.capabilities,
      maxDuration: m.maxDuration,
      resolutions: m.resolutions,
    }));
  },

  getPrice(modelId: string): ModelPrice {
    const model = resolveModel(modelId);
    return {
      perVideo: model.costPerSecond720p * 4,
      perSecond: model.costPerSecond720p,
      currency: 'USD',
    };
  },
};
