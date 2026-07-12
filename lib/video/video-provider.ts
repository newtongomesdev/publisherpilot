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
