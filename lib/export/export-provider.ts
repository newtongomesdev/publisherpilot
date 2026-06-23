import type { GeneratedArticle } from "@/lib/article/types";

export type ExportResult = {
  fileName: string;
  content: string | Uint8Array;
  mimeType: string;
};

export interface ExportProvider {
  export(article: GeneratedArticle): Promise<ExportResult>;
}
