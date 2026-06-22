import { createClient } from "@/utils/supabase/server";

export const SCRIPT_GENERATOR_API_URL =
  process.env.SCRIPT_GENERATOR_API_URL || "https://script-generator-api-civ5.onrender.com";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

const DEFAULT_ENTERTAINMENT_REACTION_ALLOWED_ACCOUNTS = "hmys0205hmys";

function normalizeAccountKey(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

function splitAccountList(value: string) {
  return value
    .split(/[,;\s]+/)
    .map((item) => normalizeAccountKey(item))
    .filter(Boolean);
}

function accountMatchKeys(user?: AuthenticatedUser | null) {
  const keys = new Set<string>();
  const id = normalizeAccountKey(user?.id);
  const email = normalizeAccountKey(user?.email);
  if (id) keys.add(id);
  if (email) {
    keys.add(email);
    keys.add(email.split("@")[0]);
  }
  return keys;
}

export function getEntertainmentReactionAllowedAccounts() {
  return splitAccountList(
    process.env.ENTERTAINMENT_REACTION_ALLOWED_ACCOUNTS ||
      DEFAULT_ENTERTAINMENT_REACTION_ALLOWED_ACCOUNTS,
  );
}

export function isEntertainmentReactionAllowed(user?: AuthenticatedUser | null) {
  const allowed = new Set(getEntertainmentReactionAllowedAccounts());
  for (const key of accountMatchKeys(user)) {
    if (allowed.has(key)) return true;
  }
  return false;
}

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
