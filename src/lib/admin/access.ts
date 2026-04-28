export type AdminAccessLevel = "none" | "marketing" | "full";

type UserMetadataLike = Record<string, unknown> | null | undefined;

function parseEmailList(value?: string | null) {
  return (value || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getFullAdminEmails() {
  return parseEmailList(process.env.ADMIN_EMAILS);
}

export function getMarketingAdminEmails() {
  return parseEmailList(process.env.MARKETING_ADMIN_EMAILS);
}

export function getAdminAccessLevel(
  email?: string | null,
  userMetadata?: UserMetadataLike,
): AdminAccessLevel {
  const normalizedEmail = email?.trim().toLowerCase();
  const metadataLevel =
    typeof userMetadata?.adminAccessLevel === "string"
      ? userMetadata.adminAccessLevel.trim().toLowerCase()
      : null;

  if (metadataLevel === "full") {
    return "full";
  }

  if (metadataLevel === "marketing") {
    return "marketing";
  }

  if (normalizedEmail && getFullAdminEmails().includes(normalizedEmail)) {
    return "full";
  }

  if (normalizedEmail && getMarketingAdminEmails().includes(normalizedEmail)) {
    return "marketing";
  }

  return "none";
}

export function canAccessAdminPath(accessLevel: AdminAccessLevel, pathname: string) {
  if (accessLevel === "full") {
    return true;
  }

  if (accessLevel === "marketing") {
    return pathname === "/admin/overview";
  }

  return false;
}
