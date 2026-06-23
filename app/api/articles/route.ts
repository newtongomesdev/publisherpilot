import { NextResponse } from "next/server";
import { createArticleProjectSchema } from "@/app/api/articles/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);

  return NextResponse.json({ ok: true, project: parsed }, { status: 201 });
}
