import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionCookie } from "@/lib/auth/session";
import { setActiveWorkspaceCookie } from "@/lib/workspaces/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.parse(body);
  const { getUserByEmail, getDefaultWorkspaceByUser } = await import("@/lib/db/queries");

  const user = await getUserByEmail(parsed.email.toLowerCase());
  if (!user || !verifyPassword(parsed.password, user.passwordHash)) {
    return NextResponse.json({ ok: false, error: "Credenciais invalidas." }, { status: 401 });
  }

  await createSessionCookie(user.id);

  const workspace = await getDefaultWorkspaceByUser(user.id);
  if (workspace) {
    await setActiveWorkspaceCookie(workspace.id);
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: isAdminEmail(user.email) },
  });
}
