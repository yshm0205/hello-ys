import crypto from 'crypto';
import { NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const YOUTUBE_OAUTH_STATE_COOKIE = 'youtube_oauth_state';

// 프로덕션 URL (Vercel에서는 origin 감지 안 됨)
const PRODUCTION_REDIRECT_URI = 'https://flowspot-kr.vercel.app/api/youtube/callback';

// YouTube OAuth 시작 - 사용자를 Google 로그인 페이지로 리다이렉트
export async function GET() {
    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
    }

    // 환경변수 우선, 없으면 프로덕션 하드코딩
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || PRODUCTION_REDIRECT_URI;

    // YouTube Data API + Analytics API 스코프
    const scopes = [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/yt-analytics.readonly',
    ].join(' ');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    const state = crypto.randomUUID();
    authUrl.searchParams.set('state', state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 10,
        path: '/',
    });

    return response;
}
