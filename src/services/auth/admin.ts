"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * 현재 사용자가 어드민인지 확인합니다.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return false;
  }

  const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
  return adminEmails.includes(user.email);
}
