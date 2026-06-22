import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/auth";

const publicAuthPages = [
  "/auth/login",
  "/auth/register",
  "/auth/setup",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email"
];

/** Auth pages where a logged-in user may stay (verify email, reset password). */
const sessionAllowedAuthPages = ["/auth/verify-email", "/auth/reset-password"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/app")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (!token || !(await verifySessionToken(token))) {
      const login = new URL("/auth/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (publicAuthPages.some((p) => pathname.startsWith(p))) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const sessionOk = token && (await verifySessionToken(token));
    const allowWithSession = sessionAllowedAuthPages.some((p) => pathname.startsWith(p));
    if (sessionOk && !allowWithSession) {
      return NextResponse.redirect(new URL("/app", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/app/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/setup",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/verify-email"
  ]
};
