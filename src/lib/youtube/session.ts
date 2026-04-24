import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

export const YOUTUBE_OAUTH_STATE_COOKIE = "youtube_oauth_state";
export const YOUTUBE_OAUTH_USER_COOKIE = "youtube_oauth_user_id";
export const YOUTUBE_CONNECTED_USER_COOKIE = "youtube_connected_user_id";
export const YOUTUBE_ACCESS_TOKEN_COOKIE = "youtube_access_token";
export const YOUTUBE_REFRESH_TOKEN_COOKIE = "youtube_refresh_token";

const PRODUCTION_REDIRECT_URI = "https://flowspot-kr.vercel.app/api/youtube/callback";

function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export function getYoutubeRedirectUri() {
  return process.env.YOUTUBE_REDIRECT_URI || PRODUCTION_REDIRECT_URI;
}

export function getYoutubeSettingsUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://flowspot-kr.vercel.app";
  return `${baseUrl}/ko/dashboard/settings`;
}

export async function getAuthenticatedYoutubeUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function loadYoutubeCookieState() {
  const cookieStore = await cookies();

  return {
    cookieStore,
    oauthState: cookieStore.get(YOUTUBE_OAUTH_STATE_COOKIE)?.value || "",
    oauthUserId: cookieStore.get(YOUTUBE_OAUTH_USER_COOKIE)?.value || "",
    connectedUserId: cookieStore.get(YOUTUBE_CONNECTED_USER_COOKIE)?.value || "",
    accessToken: cookieStore.get(YOUTUBE_ACCESS_TOKEN_COOKIE)?.value || "",
    refreshToken: cookieStore.get(YOUTUBE_REFRESH_TOKEN_COOKIE)?.value || "",
  };
}

export function clearYoutubeChallengeCookies(response: NextResponse) {
  response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, "", getSecureCookieOptions(0));
  response.cookies.set(YOUTUBE_OAUTH_USER_COOKIE, "", getSecureCookieOptions(0));
}

export function clearYoutubeConnectionCookies(response: NextResponse) {
  clearYoutubeChallengeCookies(response);
  response.cookies.set(YOUTUBE_CONNECTED_USER_COOKIE, "", getSecureCookieOptions(0));
  response.cookies.set(YOUTUBE_ACCESS_TOKEN_COOKIE, "", getSecureCookieOptions(0));
  response.cookies.set(YOUTUBE_REFRESH_TOKEN_COOKIE, "", getSecureCookieOptions(0));
}

export function setYoutubeOauthChallenge(
  response: NextResponse,
  state: string,
  userId: string,
) {
  response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, state, getSecureCookieOptions(60 * 10));
  response.cookies.set(YOUTUBE_OAUTH_USER_COOKIE, userId, getSecureCookieOptions(60 * 10));
}

export function setYoutubeConnectionCookies(
  response: NextResponse,
  {
    userId,
    accessToken,
    refreshToken,
    expiresIn,
  }: {
    userId: string;
    accessToken: string;
    refreshToken?: string | null;
    expiresIn?: number | null;
  },
) {
  clearYoutubeChallengeCookies(response);
  response.cookies.set(
    YOUTUBE_CONNECTED_USER_COOKIE,
    userId,
    getSecureCookieOptions(60 * 60 * 24 * 30),
  );
  response.cookies.set(
    YOUTUBE_ACCESS_TOKEN_COOKIE,
    accessToken,
    getSecureCookieOptions(expiresIn || 3600),
  );

  if (refreshToken) {
    response.cookies.set(
      YOUTUBE_REFRESH_TOKEN_COOKIE,
      refreshToken,
      getSecureCookieOptions(60 * 60 * 24 * 30),
    );
  }
}

export async function refreshYoutubeAccessToken(refreshToken: string) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    const tokens = (await response.json().catch(() => null)) as
      | { access_token?: string; expires_in?: number }
      | null;

    if (!response.ok || !tokens?.access_token) {
      return null;
    }

    return {
      accessToken: tokens.access_token,
      expiresIn: tokens.expires_in || 3600,
    };
  } catch (error) {
    console.error("[YouTube] Token refresh error:", error);
    return null;
  }
}

export async function ensureYoutubeAccessTokenForUser(userId: string) {
  const cookieState = await loadYoutubeCookieState();

  if (!cookieState.connectedUserId || cookieState.connectedUserId !== userId) {
    if (cookieState.connectedUserId && cookieState.connectedUserId !== userId) {
      cookieState.cookieStore.set(YOUTUBE_CONNECTED_USER_COOKIE, "", getSecureCookieOptions(0));
      cookieState.cookieStore.set(YOUTUBE_ACCESS_TOKEN_COOKIE, "", getSecureCookieOptions(0));
      cookieState.cookieStore.set(YOUTUBE_REFRESH_TOKEN_COOKIE, "", getSecureCookieOptions(0));
    }

    return null;
  }

  if (cookieState.accessToken) {
    return cookieState.accessToken;
  }

  if (!cookieState.refreshToken) {
    return null;
  }

  const refreshed = await refreshYoutubeAccessToken(cookieState.refreshToken);
  if (!refreshed) {
    return null;
  }

  cookieState.cookieStore.set(
    YOUTUBE_ACCESS_TOKEN_COOKIE,
    refreshed.accessToken,
    getSecureCookieOptions(refreshed.expiresIn),
  );

  return refreshed.accessToken;
}
