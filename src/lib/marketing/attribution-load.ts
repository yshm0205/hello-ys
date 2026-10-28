import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { attributionPayload, paymentSchema } from "./attribution-model";
import { buildAttributionReport } from "./attribution-report";
import { buildWeeklyFunnel, PAY_CTA_IDS, saturdayWeeks, SELECT_CTA_IDS } from "./attribution-funnel";
import type { ReportRange } from "./attribution-report";
import type { CheckoutClick, FunnelFilter } from "./attribution-funnel";
import type { AttributionEvent, AttributionPayment } from "./attribution-model";

const rowSchema = z.object({ id: z.string(), created_at: z.string(), session_key: z.string(), payload: attributionPayload });
const clickSchema = z.object({ session_key: z.string(), created_at: z.string(), cta_id: z.string() });
type Admin = ReturnType<typeof createAdminClient>;

export function defaultAttributionDates() {
  const now = Date.now() + 9 * 3600000;
  return { today: new Date(now).toISOString().slice(0, 10),
    monthAgo: new Date(now - 29 * 86400000).toISOString().slice(0, 10) };
}

async function loadEvents(admin: Admin, range: ReportRange) {
  const events: AttributionEvent[] = [];
  const lookback = new Date(Date.parse(range.start) - 30 * 86400000).toISOString();
  for (let offset = 0; ; offset += 1000) {
    const result = await admin.from("marketing_session_events")
      .select("id,session_key,payload,created_at").eq("event_type", "attribution_v2")
      .gte("created_at", lookback).lt("created_at", range.end)
      .order("created_at").order("id").range(offset, offset + 999);
    if (result.error) throw result.error;
    const batch = z.array(rowSchema).parse(result.data);
    events.push(...batch);
    if (batch.length < 1000) break;
  }
  return events;
}

async function loadPayments(admin: Admin) {
  const payments: AttributionPayment[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await admin.from("toss_payments")
      .select("id,user_id,order_id,session_key,amount,status,created_at,metadata")
      .eq("metadata->>planType", "allinone").in("status", ["DONE", "PARTIAL_CANCELLED"])
      .order("created_at").order("id").range(offset, offset + 999);
    if (result.error) throw result.error;
    const batch = z.array(paymentSchema).parse(result.data);
    payments.push(...batch);
    if (batch.length < 1000) break;
  }
  return payments;
}

async function loadCheckoutClicks(admin: Admin, range: ReportRange) {
  const clicks: CheckoutClick[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await admin.from("marketing_session_events")
      .select("session_key,created_at,cta_id").eq("event_type", "cta_click")
      .in("cta_id", [...SELECT_CTA_IDS, ...PAY_CTA_IDS])
      .gte("created_at", range.start).lt("created_at", range.end)
      .order("created_at").order("id").range(offset, offset + 999);
    if (result.error) throw result.error;
    const batch = z.array(clickSchema).parse(result.data);
    clicks.push(...batch);
    if (batch.length < 1000) break;
  }
  return clicks;
}

async function internalUserIds() {
  return new Set((await getInternalAdminUsers()).map((user) => user.id));
}

export async function loadAttributionReport(range: ReportRange) {
  const admin = createAdminClient();
  const [events, payments, internalUsers] = await Promise.all([loadEvents(admin, range), loadPayments(admin), internalUserIds()]);
  return buildAttributionReport({ events, payments, internalUsers, range });
}

export async function loadWeeklyFunnel(weekCount: number, filter: FunnelFilter) {
  const now = Date.now();
  const weeks = saturdayWeeks(now, weekCount);
  const admin = createAdminClient();
  const range = { start: weeks[0].start, end: weeks[weeks.length - 1].end };
  const [events, payments, checkoutClicks, internalUsers] = await Promise.all([
    loadEvents(admin, range), loadPayments(admin), loadCheckoutClicks(admin, range), internalUserIds()]);
  const firstRecord = events.find((event) => !event.payload.test)?.created_at ?? null;
  const firstLeave = events.find((event) => event.payload.kind === "leave" && !event.payload.test)?.created_at ?? null;
  return { now, weeks: buildWeeklyFunnel({ events, payments, internalUsers, checkoutClicks, weeks, filter }), firstRecord, firstLeave };
}
