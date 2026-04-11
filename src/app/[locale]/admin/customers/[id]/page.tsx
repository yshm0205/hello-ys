import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { createAdminClient } from "@/utils/supabase/admin";

type CustomerUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
};

type CustomerPlan = {
  credits: number;
  plan_type: string;
  expires_at: string | null;
} | null;

type CustomerPayment = {
  id: string;
  order_name: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
};

type LectureMeta = {
  part_number: number;
  part_title: string;
  vod_number: number;
  vod_title: string;
  duration_minutes: number;
};

type LectureProgressRow = {
  vod_id: string;
  last_position: number | null;
  completed_at: string | null;
};

type CustomerLectureProgressItem = {
  vodId: string;
  title: string;
  partLabel: string;
  vodNumber: number;
  durationMinutes: number;
  watchedMinutes: number;
  watchedSeconds: number;
  progressPercent: number;
  completed: boolean;
  completedAt: string | null;
};

type CustomerLectureStats = {
  startedCount: number;
  completedCount: number;
  totalLectureCount: number;
  totalDurationMinutes: number;
  watchedMinutes: number;
  courseProgressPercent: number;
  furthestLectureLabel: string | null;
  items: CustomerLectureProgressItem[];
};

type CustomerDetail = {
  user: CustomerUser;
  userPlan: CustomerPlan;
  payments: CustomerPayment[];
  lectureStats: CustomerLectureStats;
};

const planLabels: Record<string, string> = {
  free: "무료",
  pro: "Pro",
  allinone: "올인원",
};

function buildLectureVodId(vodNumber: number): string {
  return `vod_${String(vodNumber).padStart(2, "0")}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR");
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

async function getCustomerDetail(userId: string): Promise<CustomerDetail | null> {
  const supabase = createAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, email, full_name, avatar_url, created_at")
    .eq("id", userId)
    .single();

  if (!user) return null;

  const { data: userPlan } = await supabase
    .from("user_plans")
    .select("credits, plan_type, expires_at")
    .eq("user_id", userId)
    .single();

  const { data: payments } = await supabase
    .from("toss_payments")
    .select("id, order_name, amount, credits, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  const [{ data: progressRows }, { data: lectures }] = await Promise.all([
    supabase
      .from("lecture_progress")
      .select("vod_id, last_position, completed_at")
      .eq("user_id", userId),
    supabase
      .from("lectures")
      .select("part_number, part_title, vod_number, vod_title, duration_minutes")
      .eq("is_published", true)
      .order("vod_number", { ascending: true }),
  ]);

  const lectureMap = new Map<string, LectureMeta>();
  for (const lecture of (lectures || []) as LectureMeta[]) {
    lectureMap.set(buildLectureVodId(lecture.vod_number), lecture);
  }

  const items = ((progressRows || []) as LectureProgressRow[])
    .map((row) => {
      const lecture = lectureMap.get(row.vod_id);
      if (!lecture) return null;

      const durationMinutes = lecture.duration_minutes || 0;
      const watchedSecondsRaw = Math.max(0, Math.round(row.last_position || 0));
      const maxSeconds = durationMinutes > 0 ? durationMinutes * 60 : watchedSecondsRaw;
      const watchedSeconds = row.completed_at ? maxSeconds : Math.min(watchedSecondsRaw, maxSeconds);
      const watchedMinutes = Math.min(durationMinutes || Math.ceil(watchedSeconds / 60), Math.ceil(watchedSeconds / 60));
      const progressPercent =
        durationMinutes > 0
          ? Math.min(100, Math.round((watchedSeconds / (durationMinutes * 60)) * 100))
          : row.completed_at
            ? 100
            : 0;

      return {
        vodId: row.vod_id,
        title: lecture.vod_title,
        partLabel: `Part ${lecture.part_number}. ${lecture.part_title}`,
        vodNumber: lecture.vod_number,
        durationMinutes,
        watchedMinutes,
        watchedSeconds,
        progressPercent,
        completed: Boolean(row.completed_at),
        completedAt: row.completed_at,
      } satisfies CustomerLectureProgressItem;
    })
    .filter((item): item is CustomerLectureProgressItem => Boolean(item))
    .sort((a, b) => a.vodNumber - b.vodNumber);

  const completedCount = items.filter((item) => item.completed).length;
  const watchedMinutes = items.reduce((sum, item) => sum + item.watchedMinutes, 0);
  const totalLectureCount = (lectures || []).length;
  const totalDurationMinutes = ((lectures || []) as LectureMeta[]).reduce(
    (sum, lecture) => sum + (lecture.duration_minutes || 0),
    0,
  );
  const furthestLecture = items[items.length - 1];

  return {
    user: user as CustomerUser,
    userPlan: (userPlan as CustomerPlan) ?? null,
    payments: (payments || []) as CustomerPayment[],
    lectureStats: {
      startedCount: items.length,
      completedCount,
      totalLectureCount,
      totalDurationMinutes,
      watchedMinutes,
      courseProgressPercent:
        totalLectureCount > 0 ? Math.round((completedCount / totalLectureCount) * 100) : 0,
      furthestLectureLabel: furthestLecture
        ? `${furthestLecture.partLabel} / ${furthestLecture.title}`
        : null,
      items,
    },
  };
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getCustomerDetail(id);
  const t = await getTranslations("Admin.customers");

  if (!detail) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <p className="text-muted-foreground">사용자를 찾을 수 없습니다.</p>
      </div>
    );
  }

  const { user, userPlan, payments, lectureStats } = detail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/customers"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("title")}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("detailTitle")}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full"
                />
              ) : null}
              <div>
                <p className="font-medium text-foreground">
                  {user.full_name || user.email}
                </p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">{t("joinedAt")}</p>
                <p className="font-medium text-foreground">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("creditBalance")}</p>
                <p className="font-medium text-foreground">{userPlan?.credits ?? 0}cr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>플랜 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">플랜</p>
                <Badge variant={userPlan?.plan_type === "free" ? "secondary" : "default"}>
                  {planLabels[userPlan?.plan_type || "free"] || userPlan?.plan_type}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">보유 크레딧</p>
                <p className="font-medium text-foreground">{userPlan?.credits ?? 0}cr</p>
              </div>
              <div>
                <p className="text-muted-foreground">만료일</p>
                <p className="font-medium text-foreground">
                  {userPlan?.expires_at
                    ? new Date(userPlan.expires_at).toLocaleDateString("ko-KR")
                    : "-"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>강의 시청 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">시작한 강의</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {lectureStats.startedCount}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  / {lectureStats.totalLectureCount}개
                </span>
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">완료한 강의</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {lectureStats.completedCount}개
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">추정 시청 시간</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {lectureStats.watchedMinutes}분
              </p>
              <p className="text-xs text-muted-foreground">
                전체 강의 {lectureStats.totalDurationMinutes}분 기준
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">완료 기준 진도율</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {lectureStats.courseProgressPercent}%
              </p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">가장 멀리 본 강의</p>
            <p className="mt-2 font-medium text-foreground">
              {lectureStats.furthestLectureLabel || "아직 시작한 강의가 없습니다."}
            </p>
          </div>

          {lectureStats.items.length > 0 ? (
            <div className="space-y-3">
              {lectureStats.items.map((item) => (
                <div
                  key={item.vodId}
                  className="rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{item.title}</p>
                        <Badge variant={item.completed ? "default" : "secondary"}>
                          {item.completed ? "완료" : "시청 중"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.partLabel}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.completedAt ? `완료 시각: ${formatDate(item.completedAt)}` : "완료 전"}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">현재 위치</span>
                      <span className="font-medium text-foreground">
                        {formatClock(item.watchedSeconds)} / {item.durationMinutes}분
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>추정 시청 {item.watchedMinutes}분</span>
                      <span>{item.progressPercent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">아직 시청 기록이 없습니다.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>결제 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{payment.order_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {payment.amount.toLocaleString("ko-KR")}원 (+{payment.credits}cr)
                    </p>
                    <Badge
                      variant={payment.status === "DONE" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">결제 내역이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
