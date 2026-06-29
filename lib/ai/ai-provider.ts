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
  userId?: string;
};

export interface AiProvider {
  name: string;
  listModels(userId?: string): Promise<AiModelSummary[]>;
  generateArticle(prompt: string, options: GenerateArticleOptions): Promise<GeneratedArticle>;
  generateText(prompt: string, options: GenerateArticleOptions): Promise<string>;
}
