export type SearchResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string | null;
  provider: string;
  relevanceScore: number;
};

export type SearchOptions = {
  limit: number;
  blockedDomains?: string[];
};

export interface SearchProvider {
  name: string;
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}
