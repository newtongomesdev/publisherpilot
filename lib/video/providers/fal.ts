import type { VideoProvider } from '../video-provider';
import type { VideoGenerationRequest, VideoGenerationResponse, VideoModel, ModelPrice } from '../types';

export interface FalVideoModel {
  modelId: string;
  name: string;
  textToVideoEndpoint: string;
  imageToVideoEndpoint: string;
  capabilities: string[];
  maxDuration: number;
  resolutions: string[];
  costPerSecond: number;
  description: string;
}

export const FAL_VIDEO_MODELS: FalVideoModel[] = [
  {
    modelId: 'kling-v3-pro',
    name: 'Kling V3 Pro',
    textToVideoEndpoint: 'fal-ai/kling-video/v3/pro/text-to-video',
    imageToVideoEndpoint: 'fal-ai/kling-video/v3/pro/image-to-video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 15,
    resolutions: ['720p', '1080p'],
    costPerSecond: 0.15,
    description: 'Premium quality, native audio, motion control',
  },
  {
    modelId: 'kling-v3-standard',
    name: 'Kling V3 Standard',
    textToVideoEndpoint: 'fal-ai/kling-video/v3/standard/text-to-video',
    imageToVideoEndpoint: 'fal-ai/kling-video/v3/standard/image-to-video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 15,
    resolutions: ['720p', '1080p'],
    costPerSecond: 0.08,
    description: 'Good quality, affordable, native audio',
  },
  {
    modelId: 'kling-v2.6-pro',
    name: 'Kling V2.6 Pro',
    textToVideoEndpoint: 'fal-ai/kling-video/v2.6/pro/text-to-video',
    imageToVideoEndpoint: 'fal-ai/kling-video/v2.6/pro/image-to-video',
    capabilities: ['text-to-video', 'image-to-video'],
    maxDuration: 10,
    resolutions: ['720p', '1080p'],
    costPerSecond: 0.10,
    description: 'Cinematic visuals, fluid motion, native audio',
  },
];

function resolveFalModel(modelId: string): FalVideoModel {
  const model = FAL_VIDEO_MODELS.find((m) => m.modelId === modelId);
  if (!model) throw new Error(`Unknown FAL video model: ${modelId}`);
  return model;
}

function getEndpoint(model: FalVideoModel, mode: string): string {
  if (mode === 'image-to-video' || mode === 'extend' || mode === 'scene') {
    return model.imageToVideoEndpoint;
  }
  return model.textToVideoEndpoint;
}

async function pollForResult(statusUrl: string, apiKey: string, maxWaitMs = 300000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const response = await fetch(statusUrl, {
      headers: { Authorization: `Key ${apiKey}` },
    });
    if (!response.ok) {
      throw new Error(`FAL polling failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.status === 'COMPLETED') {
      const resultResponse = await fetch(data.response_url, {
        headers: { Authorization: `Key ${apiKey}` },
      });
      return await resultResponse.json();
    }
    if (data.status === 'FAILED') {
      throw new Error(data.error || 'FAL video generation failed');
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error('FAL video generation timed out');
}

export const falVideoProvider: VideoProvider = {
  id: 'fal',
  name: 'fal',
  label: 'FAL.ai',

  async generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResponse> {
    const modelId = (request as any).model || 'kling-v3-standard';
    const model = resolveFalModel(modelId);
    const apiKey = process.env.FAL_KEY;
    if (!apiKey) throw new Error('FAL_KEY environment variable is not set');

    const endpoint = getEndpoint(model, request.mode);

    const body: Record<string, any> = {};

    if (request.prompt) body.prompt = request.prompt;
    body.duration = String(Math.min(request.duration, model.maxDuration));

    if (request.negativePrompt) body.negative_prompt = request.negativePrompt;

    // Image-to-video fields
    if (request.imageUrl) body.start_image_url = request.imageUrl;
    if (request.finalImageUrl) body.end_image_url = request.finalImageUrl;

    // Text-to-video only
    if (!request.imageUrl && request.mode === 'text-to-video') {
      body.aspect_ratio = '16:9';
    }

    // Submit to queue
    const submitResponse = await fetch(`https://queue.fal.run/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.text();
      throw new Error(`FAL API error: ${error}`);
    }

    const submitData = await submitResponse.json();

    if (!submitData.status_url) {
      // Synchronous response (fal.run pattern)
      const videoUrl = submitData.video?.url;
      if (!videoUrl) throw new Error('No video URL in FAL response');
      return {
        id: `fal-${Date.now()}`,
        videoUrl,
        thumbnailUrl: submitData.video?.thumbnail_url,
        duration: request.duration,
        model: model.name,
        provider: 'fal',
        cost: model.costPerSecond * request.duration,
        status: 'completed',
      };
    }

    // Async queue pattern — poll for result
    const result = await pollForResult(submitData.status_url, apiKey);
    const videoUrl = result.video?.url;

    if (!videoUrl) throw new Error('No video URL in FAL response');

    return {
      id: submitData.request_id || `fal-${Date.now()}`,
      videoUrl,
      thumbnailUrl: result.video?.thumbnail_url,
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
