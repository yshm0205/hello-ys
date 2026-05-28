"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Lock,
  Send,
  Sparkles,
} from "lucide-react";

import { Link } from "@/i18n/routing";

type ChallengeEnrollment = {
  id: string;
  cohort: string;
  status: string;
  accessStartsAt: string;
  accessEndsAt: string | null;
  bonusCreditsGranted: number;
  discountStatus: string;
  discountAmount: number;
};

type MissionSubmission = {
  id: string;
  day: number;
  title: string;
  content: string;
  referenceUrl: string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ChallengeResponse = {
  enrollment: ChallengeEnrollment | null;
  canSubmit: boolean;
  submissions: MissionSubmission[];
};

const APPLICATION_URL =
  "https://steep-radar-52f.notion.site/e45579f5dd6d43d0878a86b3869d7b54";

const DAY_GUIDES = [
  {
    day: 1,
    title: "내 쇼핑 쇼츠 채널 방향 잡기",
    badge: "VOD 04",
    description:
      "레드오션도 블루오션으로 바꾸는 채널 조합법을 보고, 내가 가져갈 쇼핑 채널 방향을 한 문단으로 정리합니다.",
    placeholder:
      "예: 생활꿀템을 단순 소개하는 채널이 아니라, 좁은 원룸에서 공간을 아끼는 사람들을 위한 쇼핑 쇼츠 채널로 잡겠습니다. 타깃은 자취 초보와 1인 가구이고, 첫 인상은 '이걸 왜 이제 알았지?'가 되게 만들고 싶습니다.",
  },
  {
    day: 2,
    title: "상품/소재 후보 3개 찾기",
    badge: "VOD 08",
    description:
      "영상 주제 찾기 실전 예시를 기준으로, 내 채널에 맞는 상품 또는 소재 후보 3개를 뽑고 이유를 적습니다.",
    placeholder:
      "예: 1. 접이식 빨래바구니 - 원룸 공간 문제와 연결 가능\n2. 실리콘 싱크대 덮개 - 주방 공간 확장 포인트\n3. 자석형 케이블 홀더 - 책상 정리 전후 장면을 만들기 좋음",
  },
  {
    day: 3,
    title: "FlowSpot으로 첫 쇼츠 스크립트 만들기",
    badge: "실습",
    description:
      "FlowSpot으로 만든 첫 쇼츠 스크립트 또는 스크립트 링크를 제출합니다. 완성도가 낮아도 흐름을 끝까지 만든 것이 중요합니다.",
    placeholder:
      "FlowSpot에서 만든 스크립트를 붙여넣거나, 저장된 스크립트 링크를 함께 남겨주세요. 어떤 소재로 만들었는지도 적어주면 확인이 빠릅니다.",
  },
] as const;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "제출 완료", color: "blue" },
  reviewed: { label: "확인 완료", color: "violet" },
  approved: { label: "완료 인정", color: "green" },
  needs_revision: { label: "보완 필요", color: "orange" },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChallengeContent() {
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { title: string; content: string; referenceUrl: string }>
  >({});

  const submissionsByDay = useMemo(() => {
    const entries = new Map<number, MissionSubmission>();
    (data?.submissions || []).forEach((submission) => {
      entries.set(submission.day, submission);
    });
    return entries;
  }, [data?.submissions]);

  async function load() {
    try {
      const res = await fetch("/api/challenge", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "챌린지 정보를 불러오지 못했습니다.");
        return;
      }

      setData(json);
      const nextDrafts: Record<number, { title: string; content: string; referenceUrl: string }> = {};
      (json.submissions || []).forEach((submission: MissionSubmission) => {
        nextDrafts[submission.day] = {
          title: submission.title,
          content: submission.content,
          referenceUrl: submission.referenceUrl || "",
        };
      });
      setDrafts(nextDrafts);
    } catch {
      setError("챌린지 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getDraft(day: number, fallbackTitle: string) {
    return drafts[day] || { title: fallbackTitle, content: "", referenceUrl: "" };
  }

  function updateDraft(day: number, patch: Partial<{ title: string; content: string; referenceUrl: string }>) {
    const guide = DAY_GUIDES.find((item) => item.day === day);
    setDrafts((prev) => ({
      ...prev,
      [day]: {
        ...getDraft(day, guide?.title || ""),
        ...patch,
      },
    }));
  }

  async function submit(day: number) {
    const guide = DAY_GUIDES.find((item) => item.day === day);
    const draft = getDraft(day, guide?.title || "");
    setError(null);

    if (draft.title.trim().length < 2) {
      setError("미션 제목을 입력해주세요.");
      return;
    }

    if (draft.content.trim().length < 10) {
      setError("미션 내용을 10자 이상 입력해주세요.");
      return;
    }

    setSavingDay(day);
    try {
      const res = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          title: draft.title,
          content: draft.content,
          referenceUrl: draft.referenceUrl,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "미션 제출에 실패했습니다.");
        return;
      }

      setData((prev) => {
        if (!prev) return prev;
        const withoutDay = prev.submissions.filter((item) => item.day !== day);
        return {
          ...prev,
          submissions: [...withoutDay, json.submission].sort((a, b) => a.day - b.day),
        };
      });
    } catch {
      setError("미션 제출에 실패했습니다.");
    } finally {
      setSavingDay(null);
    }
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader color="violet" />
          <Text c="gray.6">챌린지 정보를 불러오는 중...</Text>
        </Group>
      </Container>
    );
  }

  if (!data?.enrollment) {
    return (
      <Container size="md" py="lg">
        <Card radius="xl" p="xl" withBorder>
          <Stack gap="md">
            <ThemeIcon size={54} radius="xl" color="gray" variant="light">
              <Lock size={26} />
            </ThemeIcon>
            <Box>
              <Badge color="gray" variant="light" mb="sm">
                선발 후 이용 가능
              </Badge>
              <Title order={2}>챌린지 참여 권한이 아직 없습니다</Title>
              <Text c="gray.6" mt="sm">
                Notion 신청서를 제출한 뒤 선발되면 이 페이지에서 1~3일차 미션을 제출할 수 있습니다.
              </Text>
            </Box>
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}
            <Group>
              <Button
                component="a"
                href={APPLICATION_URL}
                target="_blank"
                rel="noopener noreferrer"
                color="violet"
                radius="lg"
                rightSection={<ExternalLink size={16} />}
              >
                챌린지 신청서 열기
              </Button>
            </Group>
          </Stack>
        </Card>
      </Container>
    );
  }

  const completedCount = data.submissions.filter((item) =>
    ["submitted", "reviewed", "approved"].includes(item.status),
  ).length;

  return (
    <Container size="lg" py="lg">
      <Stack gap="lg">
        <Card
          radius="xl"
          p="xl"
          style={{
            border: "1px solid rgba(139, 92, 246, 0.2)",
            background:
              "radial-gradient(circle at top left, rgba(139, 92, 246, 0.14), transparent 34%), linear-gradient(135deg, #ffffff, #f8fafc)",
          }}
        >
          <Group justify="space-between" align="flex-start" gap="lg">
            <Box style={{ maxWidth: 760 }}>
              <Badge color="violet" radius="xl" mb="sm">
                {data.enrollment.cohort} 쇼핑 쇼츠 챌린지
              </Badge>
              <Title order={2}>3일 안에 채널 방향부터 첫 스크립트까지 잡기</Title>
              <Text c="gray.6" mt="sm">
                각 날짜별 미션을 제출하면 운영자가 확인합니다. 성실 참여자는 이후 올인원 패스 할인권 후보로 검토됩니다.
              </Text>
            </Box>
            <ThemeIcon size={56} radius="xl" color="violet" variant="light">
              <Sparkles size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        {error && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card radius="lg" p="lg" withBorder>
            <Group gap="sm">
              <ThemeIcon color="violet" variant="light" radius="lg">
                <ClipboardList size={18} />
              </ThemeIcon>
              <Box>
                <Text size="sm" c="gray.6">제출 현황</Text>
                <Text fw={700}>{completedCount}/3일차</Text>
              </Box>
            </Group>
          </Card>
          <Card radius="lg" p="lg" withBorder>
            <Group gap="sm">
              <ThemeIcon color="blue" variant="light" radius="lg">
                <CalendarDays size={18} />
              </ThemeIcon>
              <Box>
                <Text size="sm" c="gray.6">참여 기수</Text>
                <Text fw={700}>{data.enrollment.cohort}</Text>
              </Box>
            </Group>
          </Card>
          <Card radius="lg" p="lg" withBorder>
            <Group gap="sm">
              <ThemeIcon color="green" variant="light" radius="lg">
                <CheckCircle2 size={18} />
              </ThemeIcon>
              <Box>
                <Text size="sm" c="gray.6">지급 크레딧</Text>
                <Text fw={700}>{data.enrollment.bonusCreditsGranted}cr</Text>
              </Box>
            </Group>
          </Card>
        </SimpleGrid>

        {!data.canSubmit && (
          <Alert color="yellow" variant="light">
            현재 미션 제출 가능 기간이 아닙니다. 운영자 안내를 확인해주세요.
          </Alert>
        )}

        <Stack gap="md">
          {DAY_GUIDES.map((guide) => {
            const submission = submissionsByDay.get(guide.day);
            const draft = getDraft(guide.day, guide.title);
            const status = submission
              ? STATUS_LABELS[submission.status] || { label: submission.status, color: "gray" }
              : null;
            const isSaving = savingDay === guide.day;

            return (
              <Card key={guide.day} radius="lg" p="xl" withBorder>
                <Stack gap="md">
                  <Group justify="space-between" align="flex-start">
                    <Box>
                      <Group gap="xs" mb={6}>
                        <Badge color="violet" variant="light">
                          {guide.day}일차
                        </Badge>
                        <Badge color="gray" variant="outline">
                          {guide.badge}
                        </Badge>
                        {status && (
                          <Badge color={status.color} variant="light">
                            {status.label}
                          </Badge>
                        )}
                      </Group>
                      <Title order={3}>{guide.title}</Title>
                      <Text c="gray.6" size="sm" mt={4}>
                        {guide.description}
                      </Text>
                    </Box>
                    {submission && (
                      <Text size="xs" c="gray.5">
                        마지막 제출 {formatDate(submission.updatedAt)}
                      </Text>
                    )}
                  </Group>

                  {submission?.adminNote && (
                    <Alert color="violet" variant="light">
                      <Text fw={600} size="sm">운영자 메모</Text>
                      <Text size="sm" mt={4} style={{ whiteSpace: "pre-wrap" }}>
                        {submission.adminNote}
                      </Text>
                    </Alert>
                  )}

                  <TextInput
                    label="미션 제목"
                    value={draft.title}
                    onChange={(event) => updateDraft(guide.day, { title: event.currentTarget.value })}
                    disabled={!data.canSubmit}
                    maxLength={120}
                  />
                  <Textarea
                    label="미션 제출 내용"
                    description="운영자가 확인할 수 있게 구체적으로 적어주세요."
                    placeholder={guide.placeholder}
                    value={draft.content}
                    onChange={(event) => updateDraft(guide.day, { content: event.currentTarget.value })}
                    autosize
                    minRows={6}
                    maxRows={14}
                    maxLength={5000}
                    disabled={!data.canSubmit}
                  />
                  <TextInput
                    label="참고 링크"
                    description="FlowSpot 저장 링크, 채널 링크, 캡처 링크 등이 있으면 넣어주세요."
                    placeholder="https://..."
                    value={draft.referenceUrl}
                    onChange={(event) =>
                      updateDraft(guide.day, { referenceUrl: event.currentTarget.value })
                    }
                    disabled={!data.canSubmit}
                    maxLength={500}
                  />

                  <Group justify="space-between" align="center">
                    <Anchor component={Link} href="/dashboard/batch" size="sm" c="violet">
                      FlowSpot으로 스크립트 만들기
                    </Anchor>
                    <Button
                      color="violet"
                      radius="lg"
                      loading={isSaving}
                      disabled={!data.canSubmit}
                      onClick={() => submit(guide.day)}
                      rightSection={<Send size={16} />}
                    >
                      {submission ? "수정 제출" : "미션 제출"}
                    </Button>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
