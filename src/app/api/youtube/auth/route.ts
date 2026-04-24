import crypto from "crypto";
import { NextResponse } from "next/server";

import {
  clearYoutubeConnectionCookies,
  getAuthenticatedYoutubeUser,
  getYoutubeRedirectUri,
  getYoutubeSettingsUrl,
  setYoutubeOauthChallenge,
} from "@/lib/youtube/session";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "GOOGLE_CLIENT_ID not configured" }, { status: 500 });
  }

  const user = await getAuthenticatedYoutubeUser();
  if (!user) {
    const loginUrl = new URL("/ko/login", process.env.NEXT_PUBLIC_APP_URL || "https://flowspot.kr");
    loginUrl.searchParams.set("redirect", "/ko/dashboard/settings");
    return NextResponse.redirect(loginUrl.toString());
  }

  const scopes = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", getYoutubeRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  const state = crypto.randomUUID();
  authUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authUrl.toString());
  clearYoutubeConnectionCookies(response);
  setYoutubeOauthChallenge(response, state, user.id);

  return response;
}
