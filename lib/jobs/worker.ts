import type { JobType } from "@/lib/jobs/types";
import { runExportJob } from "@/lib/jobs/handlers/export-job";
import { runGenerateJob } from "@/lib/jobs/handlers/generate-job";
import { runSearchJob } from "@/lib/jobs/handlers/search-job";
import { getQueuedJob, updateJobStatus } from "@/lib/db/queries";

type JobHandler = (payload: Record<string, unknown>) => Promise<void>;

export function createWorker(handlers: Record<JobType, JobHandler>) {
  return {
    async run(job: { type: JobType; payloadJson: string }) {
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      await handlers[job.type](payload);
    },
  };
}

export function createDefaultWorker() {
  return createWorker({
    search: runSearchJob,
    generate: runGenerateJob,
    export: runExportJob,
    publish: async () => {},
  });
}

export async function processNextQueuedJob() {
  const job = await getQueuedJob();
  if (!job) {
    return null;
  }

  const worker = createDefaultWorker();
  await updateJobStatus(job.id, "running");

  try {
    await worker.run({ type: job.type as JobType, payloadJson: job.payloadJson });
    await updateJobStatus(job.id, "completed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown job error";
    console.error(`[worker] Job ${job.id} (${job.type}) failed:`, message);
    await updateJobStatus(job.id, "failed", message);
  }

  return job;
}
