import { z } from "zod";

export const createArticleProjectSchema = z.object({
  topic: z.string().min(1),
  subtitle: z.string().optional(),
  niche: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  structureNotes: z.string().optional(),
  language: z.string().min(1),
  editorialTone: z.string().min(1),
  desiredLength: z.string().min(1),
  articleType: z.string().min(1),
  sourceCount: z.number().int().min(1).max(20),
  searchProvider: z.string().min(1),
  aiProvider: z.string().min(1),
  aiModelId: z.string().min(1),
  imageProviders: z.array(z.string()).default([]),
  falImageModel: z.string().optional(),
  audioSourceUrl: z.string().optional(),
});

