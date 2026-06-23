import type { JobType } from "@/lib/jobs/types";

export function createJobPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

export function createJobRecord(type: JobType, payload: Record<string, unknown>) {
  return {
    type,
    status: "queued" as const,
    payloadJson: createJobPayload(payload),
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: Date.now(),
  };
}
