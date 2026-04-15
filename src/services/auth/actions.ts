"use server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

function sanitizeNextPath(nextPath?: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

/**
 * Initiates the Google OAuth flow.
 * It redirects the user to Google's login page.
 */
export async function loginWithGoogle(nextPath?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const next = sanitizeNextPath(nextPath);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Google Login Error:", error);
    // In a real app, you might return an error state
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sends a Magic Link (passwordless login) to the user's email.
 */
export async function loginWithMagicLink(email: string, nextPath?: string) {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const next = sanitizeNextPath(nextPath);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Allows the user to be redirected to the dashboard after clicking the link
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Magic Link Error:", error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Signs in with email and password.
 */
export async function loginWithEmailPassword(
  email: string,
  password: string,
  nextPath?: string
) {
  const supabase = await createClient();
  const next = sanitizeNextPath(nextPath);

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Email/Password Login Error:", error);
    return { error: error.message };
  }

  redirect(`/ko${next}`);
}

/**
 * Signs out the current user and redirects to the home page.
 */
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/ko");
}
