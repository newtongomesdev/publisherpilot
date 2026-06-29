import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/auth/session";

export async function GET() {
  const user = await requireCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, user: null }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin },
  });
}
