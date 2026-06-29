export type GeneratedImageAsset = {
  url?: string;
  mimeType?: string;
  prompt: string;
  provider: string;
  model?: string;
};

export type GenerateImageOptions = {
  prompt: string;
  aspectRatio?: string;
  imageSize?: { width: number; height: number };
  style?: string;
  model?: string;
  userId?: string;
  negativePrompt?: string;
  outputFormat?: string;
  enableSafetyChecker?: boolean;
  numInferenceSteps?: number;
  guidanceScale?: number;
};


export interface ImageProvider {
  name: string;
  label: string;
  generateImage(options: GenerateImageOptions): Promise<GeneratedImageAsset>;
}
