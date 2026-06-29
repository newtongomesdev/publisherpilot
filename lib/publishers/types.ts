import type { GeneratedArticle } from "@/lib/article/types";

export type PublisherValidationResult = {
  ok: boolean;
  reason?: string;
};

export type PublisherResult = {
  id: number | string;
  status: string;
  url?: string;
  editUrl?: string;
  provider: string;
};

export interface PublisherConnector {
  name: string;
  label: string;
  validateConfig(userId?: string): Promise<PublisherValidationResult>;
  publish(article: GeneratedArticle, userId?: string): Promise<PublisherResult>;
}
