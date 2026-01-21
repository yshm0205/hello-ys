import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// YouTube OAuth 시작 - 사용자를 Google 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
    if (!GOOGLE_CLIENT_ID) {
        return NextResponse.json({ error: 'GOOGLE_CLIENT_ID not configured' }, { status: 500 });
    }

    // 요청 origin에서 redirect URI 생성
    const origin = request.headers.get('origin') || request.headers.get('host') || '';
    const protocol = origin.includes('localhost') ? 'http' : 'https';
    const host = origin.replace(/^https?:\/\//, '');
    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || `${protocol}://${host}/api/youtube/callback`;

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

    // 콜백에서 사용할 redirect URI를 state에 저장
    authUrl.searchParams.set('state', Buffer.from(redirectUri).toString('base64'));

    return NextResponse.redirect(authUrl.toString());
}

