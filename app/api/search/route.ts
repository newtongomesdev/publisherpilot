import { NextResponse } from "next/server";
import { z } from "zod";

const searchRequestSchema = z.object({
  query: z.string().min(1),
  provider: z.enum(["duckduckgo", "searxng", "both"]),
  limit: z.number().int().min(1).max(20).default(5),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = searchRequestSchema.parse(body);

  return NextResponse.json({ ok: true, search: parsed });
}
