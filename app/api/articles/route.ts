import { NextResponse } from "next/server";
import { z } from "zod";

export const createArticleProjectSchema = z.object({
  topic: z.string().min(1),
  niche: z.string().min(1),
  language: z.string().min(1),
  editorialTone: z.string().min(1),
  desiredLength: z.string().min(1),
  articleType: z.string().min(1),
  sourceCount: z.number().int().min(1).max(20),
  searchProvider: z.string().min(1),
  aiProvider: z.string().min(1),
  aiModelId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);

  return NextResponse.json({ ok: true, project: parsed }, { status: 201 });
}
