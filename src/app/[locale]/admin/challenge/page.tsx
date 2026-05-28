import { ChallengeAdminClient } from "./ChallengeAdminClient";

export const dynamic = "force-dynamic";

export default function AdminChallengePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">챌린지 운영</h1>
        <p className="text-muted-foreground">
          쇼핑 쇼츠 챌린지 참여자, 미션 제출, 할인권 후보를 관리합니다.
        </p>
      </div>
      <ChallengeAdminClient />
    </div>
  );
}
