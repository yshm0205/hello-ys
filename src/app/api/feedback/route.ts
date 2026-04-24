import { NextRequest, NextResponse } from "next/server";

import { getResendClient } from "@/lib/resend/client";
import { createClient } from "@/utils/supabase/server";

const FEEDBACK_COOLDOWN_MS = 60 * 1000;
const FEEDBACK_WINDOW_MS = 10 * 60 * 1000;
const FEEDBACK_MAX_PER_WINDOW = 3;
const feedbackAttemptCache = new Map<string, number[]>();

function isSameOriginRequest(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) {
    return false;
  }

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function getClientAddress(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function reserveFeedbackAttempt(key: string) {
  const now = Date.now();
  const recent = (feedbackAttemptCache.get(key) || []).filter(
    (timestamp) => now - timestamp < FEEDBACK_WINDOW_MS,
  );

  if (recent.length > 0 && now - recent[recent.length - 1] < FEEDBACK_COOLDOWN_MS) {
    return {
      allowed: false as const,
      retryAfterMs: FEEDBACK_COOLDOWN_MS - (now - recent[recent.length - 1]),
    };
  }

  if (recent.length >= FEEDBACK_MAX_PER_WINDOW) {
    return {
      allowed: false as const,
      retryAfterMs: FEEDBACK_WINDOW_MS - (now - recent[0]),
    };
  }

  recent.push(now);
  feedbackAttemptCache.set(key, recent);
  return {
    allowed: true as const,
    retryAfterMs: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json({ error: "Email service is not configured." }, { status: 503 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string" || message.trim().length < 5) {
      return NextResponse.json({ error: "메시지를 5자 이상 입력해 주세요." }, { status: 400 });
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

    const rateLimitKey = `${user.id}:${getClientAddress(request)}`;
    const rateLimit = reserveFeedbackAttempt(rateLimitKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "문의는 잠시 후 다시 보내주세요.",
          retryAfterSeconds: Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000)),
        },
        { status: 429 },
      );
    }

    const { error } = await resend.emails.send({
      from: "Feedback <onboarding@resend.dev>",
      to: process.env.RESEND_FROM_EMAIL || "admin@example.com",
      subject: `New Feedback from ${user.email || "Visitor"}`,
      text: `
User: ${user.email || "Anonymous"} (${user.id || "N/A"})
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
