import { createAdminClient } from "@/utils/supabase/admin";

type InternalUserRow = {
  id: string;
  email: string;
};

export function getInternalAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
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
