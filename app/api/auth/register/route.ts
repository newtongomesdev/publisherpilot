import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminEmail } from "@/lib/auth/admin";
import { createSessionCookie } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { setActiveWorkspaceCookie } from "@/lib/workspaces/session";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: issue?.message ?? "Dados de cadastro invalidos." },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const { createUser, getUserByEmail, setDefaultWorkspaceIfMissing } = await import("@/lib/db/queries");

  const existing = await getUserByEmail(input.email.toLowerCase());
  if (existing) {
    return NextResponse.json({ ok: false, error: "Email ja cadastrado." }, { status: 409 });
  }

  const user = await createUser({
    email: input.email.toLowerCase(),
    name: input.name,
    passwordHash: hashPassword(input.password),
  });

  const workspace = await setDefaultWorkspaceIfMissing(user.id, user.name);

  await createSessionCookie(user.id);
  await setActiveWorkspaceCookie(workspace.id);

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: isAdminEmail(user.email) },
  });
}
