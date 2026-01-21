import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// OAuth 콜백 - 토큰 교환 및 저장
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    // 기본 리다이렉트 경로 (locale 포함)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flowspot-kr.vercel.app';
    const settingsUrl = `${baseUrl}/ko/dashboard/settings`;

    if (error) {
        console.error('YouTube OAuth error:', error);
        return NextResponse.redirect(`${settingsUrl}?youtube_error=${error}`);
    }

    if (!code) {
        return NextResponse.redirect(`${settingsUrl}?youtube_error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return NextResponse.redirect(`${settingsUrl}?youtube_error=not_configured`);
    }

    // state에서 redirect URI 복원 (auth에서 저장한 값)
    let redirectUri = 'https://flowspot-kr.vercel.app/api/youtube/callback';
    if (state) {
        try {
            redirectUri = Buffer.from(state, 'base64').toString('utf-8');
        } catch {
            console.warn('Failed to decode state, using default redirect URI');
        }
    }

    try {
        // 토큰 교환
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokens = await tokenResponse.json();

        if (tokens.error) {
            console.error('Token exchange error:', tokens);
            return NextResponse.redirect(`${settingsUrl}?youtube_error=token_error`);
        }

        // 쿠키에 토큰 저장 (HttpOnly, Secure)
        const cookieStore = await cookies();

        cookieStore.set('youtube_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokens.expires_in || 3600,
            path: '/',
        });

        if (tokens.refresh_token) {
            cookieStore.set('youtube_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30일
                path: '/',
            });
        }

        // 성공 시 설정 페이지로 리다이렉트
        return NextResponse.redirect(`${settingsUrl}?youtube_connected=true`);

    } catch (error) {
        console.error('YouTube OAuth callback error:', error);
        return NextResponse.redirect(`${settingsUrl}?youtube_error=unknown`);
    }
}

