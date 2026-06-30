import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";
import { requireCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, user: null, sessionId: sessionId ?? null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
    sessionId: sessionId ?? null,
  });
}
