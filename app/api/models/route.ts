import { NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/auth/session";

const modelsRequestSchema = z.object({
  provider: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = modelsRequestSchema.parse(body);

  const { ensureAiProvidersRegistered } = await import("@/lib/ai/bootstrap");
  const { getAiProvider } = await import("@/lib/ai/registry");
  ensureAiProvidersRegistered();
  const provider = getAiProvider(parsed.provider);
  if (!provider) {
    return NextResponse.json({ ok: false, error: `Unknown AI provider: ${parsed.provider}` }, { status: 404 });
  }

  const models = await provider.listModels(user.id);
  return NextResponse.json({ ok: true, models });
}
