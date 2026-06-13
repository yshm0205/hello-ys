import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { routing } from "@/i18n/routing";
import { resolvePostLoginRedirectPath } from "@/lib/plans/server";
import { createClient } from "@/utils/supabase/server";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function getLocale(request: Request) {
  const cookieStore = request.headers.get("cookie");
  const localeCookie = cookieStore
    ?.split("; ")
    .find((cookie) => cookie.startsWith("NEXT_LOCALE="))
    ?.split("=")[1];

  return (localeCookie || routing.defaultLocale) as "en" | "ko";
}

function isValidOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && EMAIL_OTP_TYPES.has(value as EmailOtpType));
}

function sanitizeNextPath(value: string | null, origin: string) {
  if (!value) return null;

  if (value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  try {
    const url = new URL(value);
    const isAllowedHost =
      url.origin === origin ||
      url.hostname === "flowspot.kr" ||
      url.hostname.endsWith(".vercel.app");

    if (!isAllowedHost) return null;

    if (url.pathname === "/auth/callback") {
      const nestedNext = url.searchParams.get("next");
      if (nestedNext?.startsWith("/") && !nestedNext.startsWith("//")) {
        return nestedNext;
      }
      return "/dashboard";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNextPath(searchParams.get("next"), origin);
  const locale = getLocale(request);

  if (!tokenHash || !isValidOtpType(type)) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth-confirm-invalid`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type,
  });

  if (error || !data.user) {
    console.error("Auth email confirmation error:", error?.message || "missing user");
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth-confirm-error`);
  }

  const redirectPath = await resolvePostLoginRedirectPath(data.user.id, next);
  const localizedNext = `/${locale}${redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`}`;

  return NextResponse.redirect(`${origin}${localizedNext}`);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
