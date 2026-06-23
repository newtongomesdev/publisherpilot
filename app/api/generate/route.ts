import { NextResponse } from "next/server";
import { z } from "zod";

export const enqueueGenerateSchema = z.object({
  articleProjectId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enqueueGenerateSchema.parse(body);

  return NextResponse.json({ ok: true, jobType: "generate", payload: parsed }, { status: 202 });
}
