import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/utils/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "메시지를 5자 이상 입력해주세요." }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: "메시지가 너무 깁니다." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    // Send email to admin
    const { error } = await resend.emails.send({
      from: "Feedback <onboarding@resend.dev>", // Change this to your verificated domain in production
      to: process.env.RESEND_FROM_EMAIL || "admin@example.com", // Send to self
      subject: `New Feedback from ${user?.email || "Visitor"}`,
      text: `
User: ${user?.email || "Anonymous"} (${user?.id || "N/A"})
Message:
${message}
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Feedback error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
