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
    const modelId = request.model || 'kling-2.0';
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
