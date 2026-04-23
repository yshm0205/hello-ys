"use client";

import { useEffect, useState } from "react";
import { Badge, Box, Button, Card, Group, Progress, SimpleGrid, Text } from "@mantine/core";
import { CheckCircle2, Gift, MessageCircle, Sparkles, Star, Ticket } from "lucide-react";

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

  // 이미 제출 완료 — 혜택 활성화됨 고정 표시
  if (state.alreadySubmitted && state.review) {
    return (
      <Card
        radius="lg"
        p="lg"
        style={{
          border: "1px solid rgba(22, 163, 74, 0.25)",
          background:
            "linear-gradient(135deg, rgba(22, 163, 74, 0.08), rgba(139, 92, 246, 0.05) 60%, #ffffff)",
        }}
      >
        <Group justify="space-between" align="center" gap="md">
          <Group gap="sm" wrap="nowrap">
            <CheckCircle2 size={22} color="#16a34a" />
            <Box>
              <Text fw={700} size="md">
                후기 이벤트 혜택이 활성화됐어요
              </Text>
              <Text size="sm" c="gray.6">
                피드백권 {state.review.feedbackTicketsRemaining}회 사용 가능 · 월간 크레딧 추첨
                대상
              </Text>
            </Box>
          </Group>
          <Button
            component={Link}
            href="/dashboard/review"
            prefetch={false}
            radius="xl"
            variant="light"
            color="violet"
            size="sm"
          >
            내 혜택 보기
          </Button>
        </Group>
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
