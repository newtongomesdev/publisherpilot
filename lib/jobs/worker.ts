import type { JobType } from "@/lib/jobs/types";

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

export function createWorker(handlers: Record<JobType, JobHandler>) {
  return {
    async run(job: { type: JobType; payloadJson: string }) {
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      await handlers[job.type](payload);
    },
  };
}
