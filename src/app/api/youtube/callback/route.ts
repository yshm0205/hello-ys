import { NextRequest, NextResponse } from "next/server";

import {
  clearYoutubeChallengeCookies,
  clearYoutubeConnectionCookies,
  getAuthenticatedYoutubeUser,
  getYoutubeRedirectUri,
  getYoutubeSettingsUrl,
  loadYoutubeCookieState,
  setYoutubeConnectionCookies,
} from "@/lib/youtube/session";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

function redirectWithYoutubeCleanup(url: string, fullReset = false) {
  const response = NextResponse.redirect(url);

  if (fullReset) {
    clearYoutubeConnectionCookies(response);
  } else {
    clearYoutubeChallengeCookies(response);
  }

  return response;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const settingsUrl = getYoutubeSettingsUrl();

  if (error) {
    console.error("YouTube OAuth error:", error);
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=${error}`, true);
  }

  if (!code) {
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=no_code`, true);
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=not_configured`, true);
  }

  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=auth_required`, true);
  }

  const cookieState = await loadYoutubeCookieState();
  if (
    !state ||
    !cookieState.oauthState ||
    state !== cookieState.oauthState ||
    !cookieState.oauthUserId ||
    cookieState.oauthUserId !== user.id
  ) {
    console.error("YouTube OAuth state mismatch");
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=invalid_state`, true);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: getYoutubeRedirectUri(),
        grant_type: "authorization_code",
      }),
    });

    const tokens = (await tokenResponse.json().catch(() => null)) as
      | {
          access_token?: string;
          refresh_token?: string;
          expires_in?: number;
          error?: string;
        }
      | null;

    if (!tokenResponse.ok || tokens?.error || !tokens?.access_token) {
      console.error("Token exchange error:", tokens);
      return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=token_error`, true);
    }

    const response = NextResponse.redirect(`${settingsUrl}?youtube_connected=true`);
    setYoutubeConnectionCookies(response, {
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
    });

    return response;
  } catch (oauthError) {
    console.error("YouTube OAuth callback error:", oauthError);
    return redirectWithYoutubeCleanup(`${settingsUrl}?youtube_error=unknown`, true);
  }
}
