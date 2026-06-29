import { z } from "zod";

export const enqueueGenerateSchema = z.object({
  articleProjectId: z.string().min(1),
  imageProviders: z.array(z.string()).optional().default([]),
});
