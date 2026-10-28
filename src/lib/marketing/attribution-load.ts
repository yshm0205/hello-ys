import "server-only";
import { z } from "zod";
import { createAdminClient } from "@/utils/supabase/admin";
import { getInternalAdminUsers } from "@/lib/admin/internal-users";
import { attributionPayload, paymentSchema } from "./attribution-model";
import { buildAttributionReport } from "./attribution-report";
import type { ReportRange } from "./attribution-report";
import type { AttributionEvent, AttributionPayment } from "./attribution-model";

const rowSchema = z.object({ id: z.string(), created_at: z.string(), session_key: z.string(), payload: attributionPayload });

export function defaultAttributionDates() {
  const now = Date.now() + 9 * 3600000;
  return { today: new Date(now).toISOString().slice(0, 10),
    monthAgo: new Date(now - 29 * 86400000).toISOString().slice(0, 10) };
}

export async function loadAttributionReport(range: ReportRange) {
  const admin = createAdminClient();
  const events: AttributionEvent[] = [];
  const payments: AttributionPayment[] = [];
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
  const internalUsers = new Set((await getInternalAdminUsers()).map((user) => user.id));
  return buildAttributionReport({ events, payments, internalUsers, range });
}
