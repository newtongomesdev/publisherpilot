import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { apiUsageLog } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Total cost of this app
    const [totalRow] = await db
      .select({
        totalCost: sql<string>`coalesce(sum(cast(${apiUsageLog.costUsd} as real)), 0)`,
        totalCalls: sql<string>`count(*)`,
        totalTokens: sql<string>`coalesce(sum(${apiUsageLog.totalTokens}), 0)`,
      })
      .from(apiUsageLog);

    // Today
    const [todayRow] = await db
      .select({
        cost: sql<string>`coalesce(sum(cast(${apiUsageLog.costUsd} as real)), 0)`,
        calls: sql<string>`count(*)`,
      })
      .from(apiUsageLog)
      .where(sql`${apiUsageLog.createdAt} >= ${todayStart}`);

    // This week
    const [weekRow] = await db
      .select({
        cost: sql<string>`coalesce(sum(cast(${apiUsageLog.costUsd} as real)), 0)`,
        calls: sql<string>`count(*)`,
      })
      .from(apiUsageLog)
      .where(sql`${apiUsageLog.createdAt} >= ${weekStart}`);

    // This month
    const [monthRow] = await db
      .select({
        cost: sql<string>`coalesce(sum(cast(${apiUsageLog.costUsd} as real)), 0)`,
        calls: sql<string>`count(*)`,
      })
      .from(apiUsageLog)
      .where(sql`${apiUsageLog.createdAt} >= ${monthStart}`);

    // Per-model breakdown
    const byModel = await db
      .select({
        model: apiUsageLog.model,
        cost: sql<string>`coalesce(sum(cast(${apiUsageLog.costUsd} as real)), 0)`,
        calls: sql<string>`count(*)`,
        tokens: sql<string>`coalesce(sum(${apiUsageLog.totalTokens}), 0)`,
      })
      .from(apiUsageLog)
      .groupBy(apiUsageLog.model)
      .orderBy(sql`sum(cast(${apiUsageLog.costUsd} as real)) desc`);

    return NextResponse.json({
      ok: true,
      total: {
        cost: Number(totalRow.totalCost),
        calls: Number(totalRow.totalCalls),
        tokens: Number(totalRow.totalTokens),
      },
      today: {
        cost: Number(todayRow.cost),
        calls: Number(todayRow.calls),
      },
      week: {
        cost: Number(weekRow.cost),
        calls: Number(weekRow.calls),
      },
      month: {
        cost: Number(monthRow.cost),
        calls: Number(monthRow.calls),
      },
      byModel: byModel.map((r) => ({
        model: r.model,
        cost: Number(r.cost),
        calls: Number(r.calls),
        tokens: Number(r.tokens),
      })),
    });
  } catch (err) {
    console.error("[openrouter/usage] Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to query usage" }, { status: 500 });
  }
}
