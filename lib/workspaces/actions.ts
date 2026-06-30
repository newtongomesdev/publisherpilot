"use server";

import { cookies, headers } from "next/headers";
import { WORKSPACE_COOKIE_NAME } from "@/lib/workspaces/constants";

export async function setActiveWorkspaceCookie(workspaceId: string) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const xForwardedProto = headersList.get("x-forwarded-proto");
  const host = headersList.get("host") || "";
  const isLocalhost = host.includes("localhost") || host.includes("127.0.0.1");

  const isSecure =
    process.env.NODE_ENV === "production" &&
    xForwardedProto !== "http" &&
    !isLocalhost &&
    process.env.SECURE_COOKIES !== "false";

  cookieStore.set(WORKSPACE_COOKIE_NAME, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
  });
}
