import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

async function checkAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) return null;
  return user;
}

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["submitted", "in_progress", "answered", "closed", "rejected"]),
  adminNote: z.string().max(2000).optional(),
  adminResponse: z.string().max(5000).optional(),
});

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("feedback_requests")
    .select(
      `id, user_id, review_id, request_type, title, description, reference_url,
       status, admin_note, admin_response, responded_at, closed_at, created_at, updated_at,
       users:user_id(email, full_name),
       reviews:review_id(headline, channel_name, feedback_tickets_remaining, feedback_tickets_granted)`,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Admin FeedbackRequests] GET error:", error);
    return NextResponse.json({ error: "조회 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true, requests: data || [] });
}

export async function PATCH(request: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id, status, adminNote, adminResponse } = parsed.data;
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = { status };
  if (typeof adminNote === "string") patch.admin_note = adminNote;
  if (typeof adminResponse === "string") patch.admin_response = adminResponse;
  if (status === "answered") patch.responded_at = now;
  if (status === "closed" || status === "rejected") patch.closed_at = now;

  const { data, error } = await supabase
    .from("feedback_requests")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[Admin FeedbackRequests] PATCH error:", error);
    return NextResponse.json({ error: "업데이트 실패" }, { status: 500 });
  }

  return NextResponse.json({ success: true, request: data });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
