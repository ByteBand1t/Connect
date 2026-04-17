import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const DASHBOARD_PATHS = [
  "/dashboard",
  "/assets",
  "/orders",
  "/documents",
  "/settings",
];

function isDashboardPath(pathname: string) {
  return DASHBOARD_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  // Not logged in → redirect to login for protected routes
  if (!token && isDashboardPath(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Logged in but org type not yet set → redirect to onboarding
  if (token && isDashboardPath(pathname) && !token.orgType) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Already completed onboarding, but visiting /onboarding → redirect to dashboard
  if (token && token.orgType && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/assets/:path*",
    "/orders/:path*",
    "/documents/:path*",
    "/settings/:path*",
    "/onboarding/:path*",
    "/onboarding",
  ],
};
