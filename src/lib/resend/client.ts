import { Resend } from "resend";

let resendClient: Resend | null = null;

// Lazily initialize Resend so missing env vars do not break builds.
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}
