import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
  }

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/auth/key", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: `OpenRouter returned ${resp.status}` }, { status: 502 });
    }

    const data = await resp.json();
    const key = data.data ?? data;

    return NextResponse.json({
      ok: true,
      usage: key.usage ?? 0,
      usageDaily: key.usage_daily ?? 0,
      usageWeekly: key.usage_weekly ?? 0,
      usageMonthly: key.usage_monthly ?? 0,
      limit: key.limit ?? null,
      limitRemaining: key.limit_remaining ?? null,
      isFreeTier: key.is_free_tier ?? false,
      label: key.label ?? "",
    });
  } catch (err) {
    console.error("[openrouter/balance] Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to query OpenRouter" }, { status: 500 });
  }
}
