import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PRODUCTION_REDIRECT_URI = 'https://flowspot-kr.vercel.app/api/youtube/callback';
const YOUTUBE_OAUTH_STATE_COOKIE = 'youtube_oauth_state';

function buildSettingsUrl() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://flowspot-kr.vercel.app';
    return `${baseUrl}/ko/dashboard/settings`;
}

function redirectWithStateCleanup(url: string) {
    const response = NextResponse.redirect(url);
    response.cookies.set(YOUTUBE_OAUTH_STATE_COOKIE, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
    return response;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const settingsUrl = buildSettingsUrl();

    if (error) {
        console.error('YouTube OAuth error:', error);
        return redirectWithStateCleanup(`${settingsUrl}?youtube_error=${error}`);
    }

    if (!code) {
        return redirectWithStateCleanup(`${settingsUrl}?youtube_error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
        return redirectWithStateCleanup(`${settingsUrl}?youtube_error=not_configured`);
    }

    const cookieStore = await cookies();
    const storedState = cookieStore.get(YOUTUBE_OAUTH_STATE_COOKIE)?.value;
    if (!state || !storedState || state !== storedState) {
        console.error('YouTube OAuth state mismatch');
        return redirectWithStateCleanup(`${settingsUrl}?youtube_error=invalid_state`);
    }

    const redirectUri = process.env.YOUTUBE_REDIRECT_URI || PRODUCTION_REDIRECT_URI;

    try {
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

        if (!tokenResponse.ok || tokens.error) {
            console.error('Token exchange error:', tokens);
            return redirectWithStateCleanup(`${settingsUrl}?youtube_error=token_error`);
        }

        const response = redirectWithStateCleanup(`${settingsUrl}?youtube_connected=true`);
        response.cookies.set('youtube_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: tokens.expires_in || 3600,
            path: '/',
        });

        if (tokens.refresh_token) {
            response.cookies.set('youtube_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30,
                path: '/',
            });
        }

        return response;
    } catch (oauthError) {
        console.error('YouTube OAuth callback error:', oauthError);
        return redirectWithStateCleanup(`${settingsUrl}?youtube_error=unknown`);
    }
}
