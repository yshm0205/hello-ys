import { z } from "zod";
import { findKeyContent } from "./key-content-links";

export const attributionInput = z.object({
  id: z.uuid(),
  visitorId: z.uuid(),
  visitId: z.uuid(),
  kind: z.enum(["page", "identity", "purchase_click", "login_click"]),
  path: z.string().max(200),
  source: z.object({
    source: z.string().max(120),
    medium: z.string().max(120),
    campaign: z.string().max(200),
    content: z.string().max(120),
    placement: z.string().max(40),
  }).nullable(),
  referrerHost: z.string().max(200).nullable(),
  token: z.uuid(),
  test: z.boolean().default(false),
}).strict();
export type AttributionInput = z.infer<typeof attributionInput>;

export const attributionPayload = attributionInput.omit({ token: true, id: true }).extend({
  version: z.literal(2),
  userId: z.uuid().nullable(),
  audience: z.enum(["unknown", "prospect", "customer", "access_only", "internal"]),
  purpose: z.enum(["landing", "checkout", "login", "course"]),
});
export type AttributionPayload = z.infer<typeof attributionPayload>;
export type AttributionEvent = Readonly<{
  id: string;
  created_at: string;
  session_key: string;
  payload: AttributionPayload;
}>;

export const paymentSchema = z.object({
  id: z.string(), user_id: z.string(), order_id: z.string().nullable(),
  session_key: z.string().nullable(), amount: z.number(), status: z.string(),
  created_at: z.string(), metadata: z.record(z.string(), z.unknown()).nullable(),
});
export type AttributionPayment = z.infer<typeof paymentSchema>;

export function paymentTime(payment: AttributionPayment) {
  for (const field of ["paidAt", "paymentConfirmedAt", "confirmedAt", "manualSettledAt"]) {
    const value = payment.metadata?.[field];
    if (typeof value === "string" && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  }
  return new Date(payment.created_at).toISOString();
}

export function paymentNet(payment: AttributionPayment) {
  const meta = payment.metadata;
  if (meta?.planType !== "allinone" || meta.complimentary === true || payment.amount <= 0) return 0;
  if (payment.status !== "DONE" && payment.status !== "PARTIAL_CANCELLED") return 0;
  const raw = meta.cancelledAmount;
  const cancelled = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : 0;
  if (!Number.isFinite(cancelled)) return 0;
  return Math.max(0, payment.amount - cancelled);
}

export function pagePurpose(path: string) {
  const clean = path.replace(/^\/(ko|en)(?=\/|$)/, "") || "/";
  if (clean === "/") return "landing";
  if (clean === "/checkout/allinone") return "checkout";
  if (clean === "/login") return "login";
  if (clean === "/dashboard/lectures" || /^\/dashboard\/lectures\/[^/]+$/.test(clean)) return "course";
  return null;
}

export function keySource(source: AttributionInput["source"]) {
  if (!source || source.source !== "youtube" || source.medium !== "organic_video") return null;
  return findKeyContent(source.content)?.id ?? null;
}
