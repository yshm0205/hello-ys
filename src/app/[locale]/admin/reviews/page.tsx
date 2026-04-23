import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type StudentReview = {
  id: string;
  user_id: string;
  email: string;
  rating: number;
  headline: string | null;
  content: string;
  channel_name: string | null;
  proof_url: string | null;
  status: string;
  marketing_consent: boolean;
  feedback_tickets_granted: number;
  feedback_tickets_remaining: number;
  monthly_draw_eligible: boolean;
  created_at: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminReviewsPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("student_reviews")
    .select(
      "id, user_id, email, rating, headline, content, channel_name, proof_url, status, marketing_consent, feedback_tickets_granted, feedback_tickets_remaining, monthly_draw_eligible, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const reviews = (data || []) as StudentReview[];
  const submittedCount = reviews.length;
  const consentCount = reviews.filter((review) => review.marketing_consent).length;
  const ticketCount = reviews.reduce(
    (sum, review) => sum + (review.feedback_tickets_remaining || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">수강 후기</h1>
        <p className="text-muted-foreground">
          후기 이벤트 제출 내역과 혜택 지급 대상을 확인합니다.
        </p>
      </div>

      {error && (
        <Card>
          <CardHeader>
            <CardTitle>후기 테이블을 불러오지 못했습니다.</CardTitle>
            <CardDescription>
              Supabase 마이그레이션 `20260423_create_student_reviews.sql` 적용 여부를 확인하세요.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>제출 후기</CardDescription>
            <CardTitle>{submittedCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>마케팅 활용 동의</CardDescription>
            <CardTitle>{consentCount}건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>잔여 피드백권</CardDescription>
            <CardTitle>{ticketCount}개</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>최근 후기</CardTitle>
          <CardDescription>최대 100건까지 최신순으로 표시합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제출일</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>평점</TableHead>
                  <TableHead>후기</TableHead>
                  <TableHead>혜택</TableHead>
                  <TableHead>상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      아직 제출된 후기가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(review.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{review.email || review.user_id}</div>
                        {review.channel_name && (
                          <div className="text-xs text-muted-foreground">{review.channel_name}</div>
                        )}
                        {review.proof_url && (
                          <a
                            href={review.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            작업물 링크
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{"★".repeat(review.rating)}</TableCell>
                      <TableCell className="max-w-[420px]">
                        {review.headline && <div className="font-medium">{review.headline}</div>}
                        <div className="line-clamp-3 text-sm text-muted-foreground">
                          {review.content}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="secondary">
                            피드백권 {review.feedback_tickets_remaining}/
                            {review.feedback_tickets_granted}
                          </Badge>
                          {review.monthly_draw_eligible && (
                            <Badge variant="outline">월간 크레딧 추첨</Badge>
                          )}
                          {review.marketing_consent && (
                            <Badge variant="outline">마케팅 동의</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge>{review.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
