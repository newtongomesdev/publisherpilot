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
  model?: string;
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
