import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { config, title, chartType } = await request.json();

    if (!config) {
      return NextResponse.json({ ok: false, error: "Config obrigatória" }, { status: 400 });
    }

    const { indexChart } = await import("@/lib/ai/chromadb");

    // Convert chart config to searchable text
    const configStr = typeof config === "string" ? config : JSON.stringify(config);
    const labels = config.data?.labels || [];
    const datasets = (config.data?.datasets || []).map((ds: any) => ds.label || "").filter(Boolean);
    const content = [
      title || "",
      chartType || config.type || "",
      labels.join(", "),
      datasets.join(", "),
      configStr,
    ].join("\n");

    await indexChart({
      id: `chart_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: content.slice(0, 5000),
      metadata: {
        title: title || "",
        chartType: chartType || config.type || "",
        createdAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("[quickchart/index] Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
