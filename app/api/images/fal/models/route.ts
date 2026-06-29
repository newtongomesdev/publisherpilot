import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";
import { FAL_MODELS } from "@/lib/images/providers/fal";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ ok: true, models: FAL_MODELS });
  } catch (error) {
    console.error("[fal-models-route] GET error:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}
