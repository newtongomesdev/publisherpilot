import { NextResponse } from "next/server";
import { renderSlideBatch } from "@/lib/slide-editor/renderer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { slides, width, height } = body;

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json({ ok: false, error: "slides array is required" }, { status: 400 });
    }

    const result = await renderSlideBatch(slides, width, height);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Renderer unavailable" },
      { status: 500 }
    );
  }
}
