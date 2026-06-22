import { z } from "zod";

export const generatedArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  language: z.string().min(1),
  niche: z.string().min(1),
  excerpt: z.string().min(1),
  metaDescription: z.string().min(1),
  tags: z.array(z.string()),
  outline: z.array(z.string()),
  intro: z.string().min(1),
  sections: z.array(
    z.object({
      heading: z.string().min(1),
      body: z.string().min(1),
      sourceUrls: z.array(z.string().url()),
    }),
  ),
  facts: z.array(z.string()),
  faq: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
  conclusion: z.string().min(1),
  sources: z.array(
    z.object({
      title: z.string().min(1),
      url: z.string().url(),
      domain: z.string().min(1),
    }),
  ),
});
