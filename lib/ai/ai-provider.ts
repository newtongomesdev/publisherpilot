import type { GeneratedArticle } from "@/lib/article/types";

export type AiModelSummary = {
  modelId: string;
  name: string;
  slug?: string;
  contextWindow?: number;
  pricing?: Record<string, unknown>;
};

export type GenerateArticleOptions = {
  model: string;
  temperature?: number;
};

export interface AiProvider {
  name: string;
  listModels(): Promise<AiModelSummary[]>;
  generateArticle(prompt: string, options: GenerateArticleOptions): Promise<GeneratedArticle>;
}
