import type { VideoProvider } from '../video-provider';
import type { VideoGenerationResponse, VideoModel, ModelPrice } from '../types';

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
