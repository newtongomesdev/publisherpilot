import { NextResponse } from "next/server";

export async function GET() {
  const { listQueuedJobs } = await import("@/lib/db/queries");
  const jobs = await listQueuedJobs();
  return NextResponse.json({ jobs });
}

export async function POST() {
  const { processNextQueuedJob } = await import("@/lib/jobs/worker");
  
  // Trigger job processing in the background without awaiting it.
  // This prevents HTTP request timeouts (Cloudflare 524) for long generation jobs.
  processNextQueuedJob().catch((err) => {
    console.error("[api/jobs] Background job processor error:", err);
  });

  return NextResponse.json({ ok: true, message: "Job processor triggered in background" });
}
