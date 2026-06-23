import { NextResponse } from "next/server";

export async function GET() {
  const { listQueuedJobs } = await import("@/lib/db/queries");
  const jobs = await listQueuedJobs();
  return NextResponse.json({ jobs });
}

export async function POST() {
  const { processNextQueuedJob } = await import("@/lib/jobs/worker");
  const job = await processNextQueuedJob();
  if (!job) {
    return NextResponse.json({ ok: true, processed: false, job: null });
  }

  return NextResponse.json({ ok: true, processed: true, job });
}
