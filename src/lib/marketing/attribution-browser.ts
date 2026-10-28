import { z } from "zod";
import { MARKETING_SESSION_COOKIE, MARKETING_SESSION_STORAGE_KEY, MARKETING_TOKEN_COOKIE } from "./tracking";

const VISIT_KEY = "flowspot_marketing_visit_v2";
const visitSchema = z.object({ id: z.uuid(), lastActive: z.number() });
const INACTIVITY_MS = 30 * 60 * 1000;

function cookie(name: string) {
  return document.cookie.split(";").map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`))?.slice(name.length + 1) ?? "";
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; Path=/; Max-Age=2592000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
}

export function nextVisit(previous: unknown, now: number, createId: () => string) {
  const parsed = visitSchema.safeParse(previous);
  const recent = parsed.success && now >= parsed.data.lastActive && now - parsed.data.lastActive < INACTIVITY_MS;
  return { id: recent ? parsed.data.id : createId(), lastActive: now };
}

export function attributionIdentity() {
  const stored = localStorage.getItem(MARKETING_SESSION_STORAGE_KEY) || cookie(MARKETING_SESSION_COOKIE);
  const visitorId = z.uuid().safeParse(stored).success ? stored : crypto.randomUUID();
  localStorage.setItem(MARKETING_SESSION_STORAGE_KEY, visitorId);
  writeCookie(MARKETING_SESSION_COOKIE, visitorId);
  const storedToken = cookie(MARKETING_TOKEN_COOKIE);
  const token = z.uuid().safeParse(storedToken).success ? storedToken : crypto.randomUUID();
  writeCookie(MARKETING_TOKEN_COOKIE, token);
  const raw = localStorage.getItem(VISIT_KEY);
  let previous: unknown = null;
  if (raw) {
    try { previous = JSON.parse(raw); }
    catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  }
  const visit = nextVisit(previous, Date.now(), () => crypto.randomUUID());
  localStorage.setItem(VISIT_KEY, JSON.stringify(visit));
  return { visitorId, visitId: visit.id, token };
}

export function entrySource() {
  const query = new URLSearchParams(location.search);
  if (!query.has("utm_source")) return null;
  return {
    source: (query.get("utm_source") ?? "").slice(0, 120),
    medium: (query.get("utm_medium") ?? "").slice(0, 120),
    campaign: (query.get("utm_campaign") ?? "").slice(0, 200),
    content: (query.get("utm_content") ?? "").slice(0, 120),
    placement: (query.get("placement") ?? "").slice(0, 40),
  };
}
