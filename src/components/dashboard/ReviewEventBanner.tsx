"use client";

import { useEffect, useState } from "react";
import { Alert, Badge, Box, Button, Card, Divider, Group, Progress, SimpleGrid, Stack, Text } from "@mantine/core";
import { CheckCircle2, Gift, MessageCircle, MessageSquareText, Sparkles, Star, Ticket } from "lucide-react";

import { Link } from "@/i18n/routing";

type EligibilityState = {
  eligible: boolean;
  canSubmit: boolean;
  windowClosed: boolean;
  alreadySubmitted: boolean;
  reachedThreshold: boolean;
  daysLeft: number;
  vodsCompleted: number;
  vodThreshold: number;
  windowDays: number;
  review: {
    feedbackTicketsGranted: number;
    feedbackTicketsRemaining: number;
    status: string;
  } | null;
  kakaoInviteUrl?: string | null;
  kakaoInvitePassword?: string | null;
  unreadFeedbackCount?: number;
};

const benefits = [
  { icon: MessageCircle, label: "비밀 카톡방 초대" },
  { icon: Sparkles, label: "업데이트 얼리액세스" },
  { icon: Ticket, label: "피드백권 3회" },
  { icon: Star, label: "월 1명 400크레딧" },
];

export function ReviewEventBanner() {
  const [state, setState] = useState<EligibilityState | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let ignore = false;
    fetch("/api/reviews/eligibility", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setState(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!ignore) setLoaded(true);
      });
    return () => {
      ignore = true;
    };
  }, []);

  if (!loaded || !state) return null;

  // 이미 제출 완료 — 혜택 활성화됨 펼쳐진 패널
  if (state.alreadySubmitted && state.review) {
    const unread = state.unreadFeedbackCount ?? 0;
    return (
      <Card
        radius="lg"
        p="lg"
        style={{
          border: "1px solid rgba(22, 163, 74, 0.28)",
          background:
            "linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(139, 92, 246, 0.06) 60%, #ffffff)",
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
            <Group gap="sm" wrap="nowrap" align="flex-start">
              <CheckCircle2 size={22} color="#16a34a" />
              <Box>
                <Text fw={800} size="lg">
                  후기 이벤트 혜택
                </Text>
                <Text size="sm" c="gray.6">
                  후기 제출 완료 · 모든 혜택이 활성화됐어요
                </Text>
              </Box>
            </Group>
            <Badge color="green" variant="light" radius="xl" size="lg">
              활성화됨
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            <Badge color="violet" variant="light" size="md" radius="md" style={{ justifyContent: "flex-start", padding: "10px 12px", height: "auto" }}>
              🎫 피드백권 {state.review.feedbackTicketsRemaining}회
            </Badge>
            <Badge color="orange" variant="light" size="md" radius="md" style={{ justifyContent: "flex-start", padding: "10px 12px", height: "auto" }}>
              💬 카톡방 입장
            </Badge>
            <Badge color="grape" variant="light" size="md" radius="md" style={{ justifyContent: "flex-start", padding: "10px 12px", height: "auto" }}>
              ✨ 업데이트 얼리액세스
            </Badge>
            <Badge color="yellow" variant="light" size="md" radius="md" style={{ justifyContent: "flex-start", padding: "10px 12px", height: "auto" }}>
              ⭐ 월 400cr 추첨
            </Badge>
          </SimpleGrid>

          {unread > 0 && (
            <Alert
              color="green"
              variant="light"
              icon={<MessageSquareText size={18} />}
              style={{ border: "1px solid #86efac" }}
            >
              <Group justify="space-between" align="center" wrap="nowrap">
                <Text fw={700} c="green.8" size="sm">
                  💬 피드백 답변 {unread}개가 도착했어요
                </Text>
                <Button
                  component={Link}
                  href="/dashboard/feedback"
                  prefetch={false}
                  size="xs"
                  color="green"
                  radius="lg"
                >
                  확인하기
                </Button>
              </Group>
            </Alert>
          )}

          <Divider variant="dashed" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
            {state.kakaoInviteUrl ? (
              <Stack gap={6}>
                <Button
                  component="a"
                  href={state.kakaoInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="yellow"
                  c="black"
                  radius="lg"
                  leftSection={<MessageCircle size={16} />}
                  fullWidth
                >
                  비밀 카카오톡방 입장하기
                </Button>
                {state.kakaoInvitePassword && (
                  <Text size="xs" c="gray.7">
                    입장 비밀번호:{" "}
                    <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#1f2937" }}>
                      {state.kakaoInvitePassword}
                    </span>
                  </Text>
                )}
              </Stack>
            ) : (
              <Alert color="violet" variant="light">
                <Text size="xs">카톡방 초대는 운영진 확인 후 안내됩니다.</Text>
              </Alert>
            )}

            <Button
              component={Link}
              href="/dashboard/feedback"
              prefetch={false}
              radius="lg"
              variant="light"
              color="violet"
              leftSection={<Ticket size={16} />}
              fullWidth
            >
              피드백 요청하기 ({state.review.feedbackTicketsRemaining}회 남음)
            </Button>
          </SimpleGrid>
        </Stack>
      </Card>
    );
  }

  // 윈도우 종료 or 무자격 → 숨김
  if (!state.eligible) return null;

  // 진행도 카드 (윈도우 내 항상 표시)
  const progressValue = Math.min(100, (state.vodsCompleted / state.vodThreshold) * 100);
  const thresholdReached = state.vodsCompleted >= state.vodThreshold;
  const ctaLabel = state.canSubmit ? "혜택 해제하기" : "자세히 보기";
  const progressLabel = thresholdReached
    ? "3/3 수강 완료 — 해제 준비 완료"
    : `강의 ${state.vodsCompleted}/${state.vodThreshold} 수강`;

  return (
    <Card
      radius="lg"
      p="lg"
      style={{
        border: "1px solid rgba(139, 92, 246, 0.22)",
        background:
          "linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.08) 54%, rgba(255, 255, 255, 0.96))",
      }}
    >
      <Group justify="space-between" align="center" gap="md">
        <Box style={{ flex: 1, minWidth: 260 }}>
          <Group gap="xs" mb={8}>
            <Badge color="violet" variant="filled" radius="xl">
              후기 이벤트
            </Badge>
            <Badge color="pink" variant="light" radius="xl">
              D-{state.daysLeft}
            </Badge>
            <Badge color={thresholdReached ? "green" : "gray"} variant="light" radius="xl">
              {progressLabel}
            </Badge>
          </Group>
          <Text fw={800} size="lg" style={{ color: "var(--mantine-color-text)" }}>
            강의 듣고 후기 남기면 피드백권·400크레딧 추첨·카톡방이 해제돼요
          </Text>
          <Progress
            value={progressValue}
            color={thresholdReached ? "green" : "violet"}
            size="sm"
            radius="xl"
            mt={10}
            mb={6}
          />
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing={6} mt="xs">
            {benefits.map((benefit) => (
              <Group key={benefit.label} gap={6} wrap="nowrap">
                <benefit.icon size={14} color="#8b5cf6" />
                <Text size="xs" c="gray.7">
                  {benefit.label}
                </Text>
              </Group>
            ))}
          </SimpleGrid>
        </Box>
        <Button
          component={Link}
          href="/dashboard/review"
          prefetch={false}
          radius="xl"
          color="violet"
          variant={state.canSubmit ? "filled" : "light"}
          leftSection={<Gift size={16} />}
        >
          {ctaLabel}
        </Button>
      </Group>
    </Card>
  );
}
