import { updateSession } from "@/utils/supabase/middleware";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);
const PUBLIC_SESSION_SKIP_PATHS = new Set(["/", "/pricing"]);
const PROTECTED_PATH_PREFIXES = ["/dashboard", "/settings", "/subscription", "/admin", "/checkout"];

function normalizePathname(pathname: string) {
  const segments = pathname.split("/");
  const locale = segments[1];
  const localizedPath = routing.locales.includes(locale as (typeof routing.locales)[number])
    ? `/${segments.slice(2).join("/")}`
    : pathname;
  const normalizedPath = localizedPath === "/" ? "/" : localizedPath.replace(/\/+$/, "");
  return normalizedPath || "/";
}

function getRequestLocale(pathname: string) {
  const locale = pathname.split("/")[1];
  return routing.locales.includes(locale as (typeof routing.locales)[number])
    ? locale
    : routing.defaultLocale;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware to handle locale redirects and get the base response
  const response = intlMiddleware(request);
  const normalizedPath = normalizePathname(request.nextUrl.pathname);

  if (PUBLIC_SESSION_SKIP_PATHS.has(normalizedPath)) {
    return response;
  }

  // 2. Run Supabase session update (copies cookies to response)
  const { response: supabaseResponse, user } = await updateSession(request, response);

  if (!user && isProtectedPath(normalizedPath)) {
    const locale = getRequestLocale(request.nextUrl.pathname);
    const redirectTarget = `${normalizedPath}${request.nextUrl.search}`;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", redirectTarget);

    const redirectResponse = NextResponse.redirect(loginUrl);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  }

  // 3. Simple Route Protection (Mockup logic, real protection involves checking session in updateSession or here)
  // For strict middleware protection, we usually check supabase.auth.getUser() inside updateSession and redirect if needed.
  // However, updating session in middleware is mainly for cookie refreshing.
  // We will rely on layout/page level checks (like in dashboard/page.tsx) or RLS for data.
  // But if we want to redirect unauthenticated users away from /dashboard immediately:
  // (Adding this logic requires reading the hook response or doing a check here)

  return supabaseResponse;
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - auth routes (handled by root route handlers)
  // - _next (static files)
  // - _vercel (Vercel internals)
  // - Static files (e.g. favicon.ico, sitemap.xml, robots.txt, etc.)
  matcher: ["/((?!api|auth|_next|_vercel|.*\\..*).*)"],
};
