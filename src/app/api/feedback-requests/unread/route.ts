import { NextResponse } from "next/server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: true, unreadCount: 0, items: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("feedback_requests")
      .select("id, title, request_type, responded_at")
      .eq("user_id", user.id)
      .eq("status", "answered")
      .is("user_read_at", null)
      .order("responded_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("[FeedbackRequests unread] error:", error);
      return NextResponse.json({ success: true, unreadCount: 0, items: [] });
    }

    return NextResponse.json({
      success: true,
      unreadCount: data?.length ?? 0,
      items: (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        requestType: row.request_type,
        respondedAt: row.responded_at,
      })),
    });
  } catch (error) {
    console.error("[FeedbackRequests unread] unexpected:", error);
    return NextResponse.json({ success: true, unreadCount: 0, items: [] });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
