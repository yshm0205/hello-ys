"use server";

import PaymentCompleteEmail from "@/components/emails/PaymentCompleteEmail";
import WelcomeEmail from "@/components/emails/WelcomeEmail";
import { resend } from "@/lib/resend/client";

interface SendWelcomeEmailParams {
  email: string;
  userName: string;
  planName?: string;
  locale?: "en" | "ko";
}

interface SendPaymentCompleteEmailParams {
  email: string;
  userName: string;
  amount: number;
  grantedCredits: number;
}

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://flowspot-kr.vercel.app"
  );
}

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL || "FlowSpot <onboarding@resend.dev>";
}

export async function sendWelcomeEmail({
  email,
  userName,
  planName = "Basic",
  locale = "en",
}: SendWelcomeEmailParams) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/${locale}/dashboard`;

  const subjects = {
    en: "Welcome to FlowSpot",
    ko: "FlowSpot 가입을 환영합니다",
  };

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject: subjects[locale],
      react: WelcomeEmail({
        userName,
        planName,
        dashboardUrl,
        locale,
      }),
    });

    if (error) {
      console.error("Resend Error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email Sending Failed:", error);
    return { error: "Failed to send email" };
  }
}

export async function sendPaymentCompleteEmail({
  email,
  userName,
  amount,
  grantedCredits,
}: SendPaymentCompleteEmailParams) {
  const baseUrl = getBaseUrl();
  const locale = "ko";

  try {
    const { data, error } = await resend.emails.send({
      from: getFromEmail(),
      to: [email],
      subject: "[FlowSpot] 올인원 패스 결제가 완료되었습니다",
      react: PaymentCompleteEmail({
        userName,
        amount: `₩${amount.toLocaleString()}`,
        grantedCredits: `${grantedCredits.toLocaleString()}cr`,
        lecturesUrl: `${baseUrl}/${locale}/dashboard/lectures`,
        scriptsUrl: `${baseUrl}/${locale}/dashboard/scripts-v2`,
      }),
    });

    if (error) {
      console.error("Payment Complete Email Error:", error);
      return { error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Payment Complete Email Failed:", error);
    return { error: "Failed to send payment complete email" };
  }
}
