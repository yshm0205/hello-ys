import { createClient } from "@/utils/supabase/server";

export const SCRIPT_GENERATOR_API_URL =
  process.env.SCRIPT_GENERATOR_API_URL || "https://script-generator-api-civ5.onrender.com";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? undefined,
  };
}

export async function postToScriptGenerator<T>(
  path: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const apiKey = (process.env.API_SECRET_KEY || "").trim();

  if (!apiKey) {
    throw new Error("missing_api_secret_key");
  }

  const response = await fetch(`${SCRIPT_GENERATOR_API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || (data && typeof data === "object" && "success" in data && !data.success)) {
    const errorMessage =
      data && typeof data === "object" && "error" in data && typeof data.error === "string"
        ? data.error
        : `script_generator_error_${response.status}`;
    throw new Error(errorMessage);
  }

  return data as T;
}
