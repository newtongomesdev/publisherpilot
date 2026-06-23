import { NextResponse } from "next/server";
import { enqueueGenerateSchema } from "@/app/api/generate/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enqueueGenerateSchema.parse(body);

  return NextResponse.json({ ok: true, jobType: "generate", payload: parsed }, { status: 202 });
}
