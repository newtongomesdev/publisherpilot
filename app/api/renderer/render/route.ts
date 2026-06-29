import { NextResponse } from "next/server";
import { renderSlide } from "@/lib/slide-editor/renderer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { html, width, height } = body;

    if (!html) {
      return NextResponse.json({ ok: false, error: "html is required" }, { status: 400 });
    }

    const result = await renderSlide(html, width, height);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "Renderer unavailable" },
      { status: 500 }
    );
  }
}
