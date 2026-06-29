import { NextResponse } from "next/server";
import { checkRendererHealth } from "@/lib/slide-editor/renderer";

export async function GET() {
  const health = await checkRendererHealth();
  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  });
}
