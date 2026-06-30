import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { getAuthSessionById } from "@/lib/db/queries";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const workspaceId = cookieStore.get("publisherpilot_workspace")?.value ?? null;

  if (!sessionId) {
    return NextResponse.json({
      ok: false,
      stage: "no_cookie",
      sessionId: null,
      workspaceId,
    });
  }

  const session = await getAuthSessionById(sessionId);
  if (!session) {
    return NextResponse.json({
      ok: false,
      stage: "session_not_found",
      sessionId,
      workspaceId,
    });
  }

  const expired = session.expiresAt ? session.expiresAt.getTime() < Date.now() : false;
  return NextResponse.json({
    ok: !expired,
    stage: expired ? "session_expired" : "session_valid",
    sessionId,
    workspaceId,
    expiresAt: session.expiresAt?.toISOString() ?? null,
    userId: session.userId,
  });
}
