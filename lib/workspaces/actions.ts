"use server";

import { cookies } from "next/headers";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspaces/constants";

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE_NAME, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
