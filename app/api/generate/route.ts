import { NextResponse } from "next/server";
import { enqueueGenerateSchema } from "@/app/api/generate/schema";
import { createJobRecord } from "@/lib/jobs/queue";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enqueueGenerateSchema.parse(body);
  const { createJob } = await import("@/lib/db/queries");
  const job = await createJob(createJobRecord("generate", parsed));

  return NextResponse.json({ ok: true, job }, { status: 202 });
}
