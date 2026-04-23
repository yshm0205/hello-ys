import { FeedbackRequestsAdminClient } from "./FeedbackRequestsAdminClient";

export const dynamic = "force-dynamic";

export default function AdminFeedbackRequestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">피드백 요청</h1>
        <p className="text-muted-foreground">
          수강생이 제출한 1:1 피드백 요청을 확인하고 답변 상태를 기록합니다.
        </p>
      </div>
      <FeedbackRequestsAdminClient />
    </div>
  );
}
