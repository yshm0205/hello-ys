import { createAdminClient } from "@/utils/supabase/admin";

type InternalUserRow = {
  id: string;
  email: string;
};

const DEFAULT_INTERNAL_METRIC_EMAILS = [
  "dyj05194@gmail.com",
  "duj05194@gmail.com",
  "hmys0205hmys@gmail.com",
  "lhmkys0205@gmail.com",
  "myengjun01@gmail.com",
  "review@flowspot.kr",
  "somangg748@gmail.com",
  "yesung051918@gmail.com",
  "yshm0205@gmail.com",
  "yshm0205yshm@gmail.com",
  "ytapitest2023@gmail.com",
] as const;

export function getInternalAdminEmails() {
  const merged = [
    ...DEFAULT_INTERNAL_METRIC_EMAILS,
    ...(process.env.ADMIN_EMAILS || "").split(","),
    ...(process.env.METRICS_EXCLUDED_EMAILS || "").split(","),
    ...(process.env.INTERNAL_METRIC_EXCLUDE_EMAILS || "").split(","),
  ]
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(merged));
}

export async function getInternalAdminUsers() {
  const adminEmails = getInternalAdminEmails();

  if (adminEmails.length === 0) {
    return [] as InternalUserRow[];
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id, email")
    .in("email", adminEmails);

  return ((data || []) as InternalUserRow[]).map((user) => ({
    id: user.id,
    email: user.email.toLowerCase(),
  }));
}
