import { z } from "zod";

const lectureOnlyGrantSchema = z.object({
  lecture_access_expires_at: z.iso.datetime({ offset: true }),
});

// Only pass admin-controlled app_metadata, never self-editable user_metadata.
export function hasLectureOnlyAccess(appMetadata: unknown, now = Date.now()) {
  const grant = lectureOnlyGrantSchema.safeParse(appMetadata);
  return grant.success && Date.parse(grant.data.lecture_access_expires_at) > now;
}
