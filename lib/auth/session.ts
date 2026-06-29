import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { withAdminFlag } from "@/lib/auth/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

export async function createSessionCookie(userId: string) {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const { createAuthSession } = await import("@/lib/db/queries");
  await createAuthSession({ id: sessionId, userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    const { deleteAuthSession } = await import("@/lib/db/queries");
    await deleteAuthSession(sessionId);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionId) {
    return null;
  }

  const { getAuthSessionById } = await import("@/lib/db/queries");
  const session = await getAuthSessionById(sessionId);
  if (!session) {
    return null;
  }

  if (session.expiresAt && session.expiresAt.getTime() < Date.now()) {
    const { deleteAuthSession } = await import("@/lib/db/queries");
    await deleteAuthSession(sessionId);
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return session;
}

export async function requireCurrentUser() {
  const session = await getCurrentSession();
  if (!session) {
    return null;
  }

  const { getUserById } = await import("@/lib/db/queries");
  const user = await getUserById(session.userId);
  return withAdminFlag(user);
}
