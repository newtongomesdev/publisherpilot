import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/auth/constants";

const protectedPrefixes = ["/dashboard", "/articles", "/exports", "/settings", "/api/articles", "/api/export", "/api/generate", "/api/jobs", "/api/models", "/api/publish", "/api/search", "/api/settings"];
const publicApiPrefixes = ["/api/images"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes (no auth required)
  const isPublicApi = publicApiPrefixes.some((prefix) => pathname.startsWith(`${prefix}/`));
  if (isPublicApi) {
    return NextResponse.next();
  }

  const needsAuth = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionId) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/articles/:path*", "/exports/:path*", "/settings/:path*", "/api/:path*"],
};
