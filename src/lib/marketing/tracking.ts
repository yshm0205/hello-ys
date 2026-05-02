export const MARKETING_TOKEN_COOKIE = "flowspot_marketing_token";
export const MARKETING_SESSION_STORAGE_KEY = "flowspot_marketing_session";
export const MARKETING_SESSION_COOKIE = "flowspot_marketing_session";

function readBrowserCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${name}=`;
  const matched = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  if (!matched) return null;
  try {
    return decodeURIComponent(matched.slice(prefix.length));
  } catch {
    return null;
  }
}

export function getMarketingSessionKeyFromBrowser(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.localStorage.getItem(MARKETING_SESSION_STORAGE_KEY) ||
      readBrowserCookie(MARKETING_SESSION_COOKIE)
    );
  } catch {
    return readBrowserCookie(MARKETING_SESSION_COOKIE);
  }
}

export function getMarketingTokenFromBrowser(): string | null {
  return readBrowserCookie(MARKETING_TOKEN_COOKIE);
}
