import { NextResponse } from "next/server";
import { createArticleProjectSchema } from "@/app/api/articles/schema";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);
  const { createArticleProject } = await import("@/lib/db/queries");
  const project = await createArticleProject(parsed);

  return NextResponse.json({ ok: true, project }, { status: 201 });
}
