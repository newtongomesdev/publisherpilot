import { randomUUID } from "crypto";
import { db } from "@/lib/db/client";
import { apiUsageLog } from "@/lib/db/schema";

type LogUsageParams = {
  provider: string;
  model: string;
  operation: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  costUsd?: number;
  articleProjectId?: string;
  userId?: string;
};

export async function logApiUsage(params: LogUsageParams) {
  try {
    await db.insert(apiUsageLog).values({
      id: randomUUID(),
      provider: params.provider,
      model: params.model,
      operation: params.operation,
      promptTokens: params.promptTokens ?? 0,
      completionTokens: params.completionTokens ?? 0,
      totalTokens: params.totalTokens ?? 0,
      costUsd: String(params.costUsd ?? 0),
      articleProjectId: params.articleProjectId ?? null,
      userId: params.userId ?? null,
    });
  } catch (err) {
    console.error("[usage-tracker] Failed to log:", err);
  }
}
