import { createAdminClient } from "@/utils/supabase/admin";

export type PublicMarketingReview = {
  id: string;
  rating: number;
  headline: string | null;
  content: string;
  displayName: string;
  createdAt: string;
};

export type PublicMarketingReviewsSummary = {
  reviews: PublicMarketingReview[];
  totalCount: number;
  averageRating: number;
};

export const MARKETING_REVIEWS_FALLBACK: PublicMarketingReviewsSummary = {
  reviews: [],
  totalCount: 0,
  averageRating: 0,
};

function maskReviewerName(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return "구매자**님";

  const withoutSuffix = trimmed.endsWith("님") ? trimmed.slice(0, -1).trim() : trimmed;
  const chars = Array.from(withoutSuffix);
  return `${chars.slice(0, Math.min(2, chars.length)).join("")}**님`;
}

export async function getMarketingReviews(limit = 20): Promise<PublicMarketingReviewsSummary> {
  const supabase = createAdminClient();
  const { data, error, count } = await supabase
    .from("student_reviews")
    .select("id, rating, headline, content, channel_name, created_at", { count: "exact" })
    .eq("marketing_consent", true)
    .in("status", ["submitted", "approved"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const reviews = (data || []).map((row) => ({
    id: row.id,
    rating: Number(row.rating) || 5,
    headline: row.headline,
    content: row.content,
    displayName: maskReviewerName(row.channel_name),
    createdAt: row.created_at,
  }));

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return {
    reviews,
    totalCount: count ?? reviews.length,
    averageRating,
  };
}
