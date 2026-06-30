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
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        { ok: false, error: issue?.message ?? "Dados de login invalidos." },
        { status: 400 },
      );
    }

    const { dbReady } = await import("@/lib/db/client");
    await dbReady;
    const { getUserByEmail, getDefaultWorkspaceByUser } = await import("@/lib/db/queries");

    const user = await getUserByEmail(parsed.data.email.toLowerCase());
    if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
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
  } catch (err: any) {
    console.error("[login]", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Erro interno ao fazer login." },
      { status: 500 },
    );
  }
}
