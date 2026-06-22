export type ArticleSection = {
  heading: string;
  body: string;
  sourceUrls: string[];
};

export type ArticleFaq = {
  question: string;
  answer: string;
};

export type ArticleSource = {
  title: string;
  url: string;
  domain: string;
};

export type GeneratedArticle = {
  title: string;
  slug: string;
  language: string;
  niche: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  outline: string[];
  intro: string;
  sections: ArticleSection[];
  facts: string[];
  faq: ArticleFaq[];
  conclusion: string;
  sources: ArticleSource[];
};
