import { z } from "zod";

export const enqueueGenerateSchema = z.object({
  articleProjectId: z.string().min(1),
});
