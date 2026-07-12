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
