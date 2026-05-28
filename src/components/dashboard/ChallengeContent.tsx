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
  Divider,
  Grid,
  Group,
  Loader,
  Modal,
  SimpleGrid,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  ExternalLink,
  FileText,
  Lock,
  MessageSquareText,
  PencilLine,
  Search,
  Send,
  UserRound,
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
  cohort: string;
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

type FeedSubmission = MissionSubmission & {
  authorLabel: string;
  isMine: boolean;
};

type ChallengeResponse = {
  enrollment: ChallengeEnrollment | null;
  canSubmit: boolean;
  submissions: MissionSubmission[];
  feedSubmissions: FeedSubmission[];
};

const APPLICATION_URL =
  "https://steep-radar-52f.notion.site/e45579f5dd6d43d0878a86b3869d7b54";

const DAY_GUIDES = [
  {
    day: 1,
    board: "1차 인증",
    title: "내 쇼핑 쇼츠 채널 방향 잡기",
    badge: "VOD 04",
    description:
      "레드오션도 블루오션으로 바꾸는 채널 조합법을 보고, 내가 가져갈 쇼핑 채널 방향을 정리합니다.",
    template:
      "1. 내가 만들 쇼핑 쇼츠 채널 방향:\n2. 이 채널이 보는 사람:\n3. 흔한 쇼핑 채널과 다르게 가져갈 포인트:\n4. 지금 막히는 부분 또는 질문:",
    placeholder:
      "예: 생활꿀템을 단순 소개하는 채널이 아니라, 좁은 원룸에서 공간을 아끼는 사람들을 위한 쇼핑 쇼츠 채널로 잡겠습니다.",
  },
  {
    day: 2,
    board: "2차 인증",
    title: "상품/소재 후보 3개 찾기",
    badge: "VOD 08",
    description:
      "내 채널에 맞는 상품 또는 소재 후보 3개를 뽑고, 왜 이 소재가 맞는지 적습니다.",
    template:
      "1. 소재 후보 1 + 고른 이유:\n2. 소재 후보 2 + 고른 이유:\n3. 소재 후보 3 + 고른 이유:\n4. 이 중 가장 먼저 만들고 싶은 소재:",
    placeholder:
      "예: 1. 접이식 빨래바구니 - 원룸 공간 문제와 연결 가능\n2. 실리콘 싱크대 덮개 - 주방 공간 확장 포인트\n3. 자석형 케이블 홀더 - 책상 정리 전후 장면을 만들기 좋음",
  },
  {
    day: 3,
    board: "3차 인증",
    title: "FlowSpot으로 첫 쇼츠 스크립트 만들기",
    badge: "실습",
    description:
      "FlowSpot으로 만든 첫 쇼츠 스크립트 또는 저장 링크를 제출합니다.",
    template:
      "1. 선택한 소재/상품:\n2. FlowSpot으로 만든 스크립트 요약:\n3. 마음에 드는 훅 또는 장면:\n4. 수정하고 싶은 부분:\n5. 저장 링크 또는 참고 링크:",
    placeholder:
      "FlowSpot에서 만든 스크립트를 붙여넣거나, 저장된 스크립트 링크를 함께 남겨주세요.",
  },
] as const;

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "제출", color: "blue" },
  reviewed: { label: "확인", color: "violet" },
  approved: { label: "완료", color: "green" },
  needs_revision: { label: "보완", color: "orange" },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function getGuide(day: number) {
  return DAY_GUIDES.find((item) => item.day === day) || DAY_GUIDES[0];
}

function getStatus(submission?: MissionSubmission) {
  if (!submission) return { label: "미제출", color: "gray" };
  return STATUS_LABELS[submission.status] || { label: submission.status, color: "gray" };
}

function clipPreview(value: string, max = 96) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}...`;
}

export function ChallengeContent() {
  const [loading, setLoading] = useState(true);
  const [savingDay, setSavingDay] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<FeedSubmission | null>(null);
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

  const activeGuide = DAY_GUIDES.find((item) => item.day === activeDay) || null;
  const activeSubmission = activeDay ? submissionsByDay.get(activeDay) : undefined;
  const feedSubmissions = data?.feedSubmissions || [];

  async function load() {
    try {
      const res = await fetch("/api/challenge", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "챌린지 정보를 불러오지 못했습니다.");
        return;
      }

      setData({ ...json, feedSubmissions: json.feedSubmissions || [] });
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
    const guide = getGuide(day);
    setDrafts((prev) => ({
      ...prev,
      [day]: {
        ...getDraft(day, guide.title),
        ...patch,
      },
    }));
  }

  function selectGuide(day: number) {
    const guide = getGuide(day);
    const submission = submissionsByDay.get(day);

    setDrafts((prev) => ({
      ...prev,
      [day]: {
        title: submission?.title || prev[day]?.title || guide.title,
        content: submission?.content || prev[day]?.content || "",
        referenceUrl: submission?.referenceUrl || prev[day]?.referenceUrl || "",
      },
    }));
    setActiveDay(day);
  }

  function openComposer(day?: number) {
    setError(null);
    setViewingSubmission(null);
    setComposerOpen(true);
    if (day) {
      selectGuide(day);
      return;
    }
    setActiveDay(null);
  }

  function closeComposer() {
    setComposerOpen(false);
    setActiveDay(null);
    setError(null);
  }

  async function submit(day: number) {
    const guide = getGuide(day);
    const draft = getDraft(day, guide.title);
    setError(null);

    if (draft.title.trim().length < 2) {
      setError("게시글 제목을 입력해주세요.");
      return;
    }

    if (draft.content.trim().length < 10) {
      setError("본문을 10자 이상 입력해주세요.");
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
        setError(json.error || "게시글 저장에 실패했습니다.");
        return;
      }

      setData((prev) => {
        if (!prev) return prev;
        const withoutOwnDay = prev.submissions.filter((item) => item.day !== day);
        const withoutFeedDay = prev.feedSubmissions.filter(
          (item) => !(item.isMine && item.day === day),
        );
        const nextFeed = json.feedSubmission
          ? [json.feedSubmission as FeedSubmission, ...withoutFeedDay]
          : withoutFeedDay;

        return {
          ...prev,
          submissions: [...withoutOwnDay, json.submission].sort((a, b) => a.day - b.day),
          feedSubmissions: nextFeed.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
        };
      });
      closeComposer();
    } catch {
      setError("게시글 저장에 실패했습니다.");
    } finally {
      setSavingDay(null);
    }
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader color="blue" />
          <Text c="gray.6">챌린지 게시판을 불러오는 중...</Text>
        </Group>
      </Container>
    );
  }

  if (!data?.enrollment) {
    return (
      <Container size="md" py="lg">
        <Card radius="md" p="xl" withBorder>
          <Stack gap="md">
            <ThemeIcon size={54} radius="xl" color="gray" variant="light">
              <Lock size={26} />
            </ThemeIcon>
            <Box>
              <Badge color="gray" variant="light" mb="sm">
                선발 후 이용 가능
              </Badge>
              <Title order={2}>챌린지 게시판 권한이 아직 없습니다</Title>
              <Text c="gray.6" mt="sm">
                신청서를 제출한 뒤 선발되면 이곳에서 인증글을 볼 수 있습니다.
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
                color="blue"
                radius="md"
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
    <Container size="xl" py={{ base: "sm", md: "md" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="md">
        <Box
          style={{
            border: "1px solid #d7dde5",
            borderRadius: 4,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <Box
            px={{ base: "md", md: "xl" }}
            py={{ base: "lg", md: 34 }}
            style={{
              minHeight: 132,
              background:
                "linear-gradient(90deg, #eaf6ff 0%, #f8fbff 46%, #dff4ff 100%)",
              borderBottom: "1px solid #d7dde5",
            }}
          >
            <Group justify="space-between" align="center" gap="lg" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Group gap={6} mb={10}>
                  <Badge color="green" variant="filled" radius={2}>FlowSpot Cafe</Badge>
                  <Badge color="blue" variant="light" radius={2}>{data.enrollment.cohort}</Badge>
                </Group>
                <Title order={1} fz={{ base: 28, sm: 40, md: 48 }} lh={1.05} c="#0889d6">
                  쇼핑 쇼츠 챌린지
                </Title>
                <Text c="gray.7" size="sm" mt={10}>
                  이전 기수와 현재 기수의 인증글을 보고 내 미션도 게시글처럼 남깁니다.
                </Text>
                <Button
                  hiddenFrom="sm"
                  mt="md"
                  color="blue"
                  radius={4}
                  leftSection={<PencilLine size={16} />}
                  onClick={() => openComposer()}
                  disabled={!data.canSubmit}
                >
                  카페 글쓰기
                </Button>
              </Box>
              <Box visibleFrom="sm" ta="right">
                <Text fw={900} fz={32} c="#00a84f">{completedCount}/3</Text>
                <Text size="xs" c="gray.6">내 인증 현황</Text>
              </Box>
            </Group>
          </Box>
        </Box>

        {error && !composerOpen && (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        )}

        {!data.canSubmit && (
          <Alert color="yellow" variant="light">
            현재 미션 인증글 작성 가능 기간이 아닙니다. 운영자 안내를 확인해주세요.
          </Alert>
        )}

        <Grid gutter="md">
          <Grid.Col span={{ base: 12, md: 3 }} visibleFrom="md">
            <Stack gap="md">
              <Card radius={4} p={0} withBorder>
                <Box px="md" py="sm" style={{ borderBottom: "2px solid #111" }}>
                  <Text fw={900} size="sm">카페정보</Text>
                </Box>
                <Stack gap={10} p="md">
                  <Group gap="sm" wrap="nowrap">
                    <ThemeIcon size={40} radius="md" color="blue" variant="light">
                      <MessageSquareText size={20} />
                    </ThemeIcon>
                    <Box style={{ minWidth: 0 }}>
                      <Text fw={800} size="sm" truncate>원초적 인사이트</Text>
                      <Text size="xs" c="gray.6">쇼핑 쇼츠 챌린지</Text>
                    </Box>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text size="sm" c="gray.7">내 인증글</Text>
                    <Text size="sm" fw={800}>{completedCount}/3</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" c="gray.7">전체 글</Text>
                    <Text size="sm" fw={800}>{feedSubmissions.length}</Text>
                  </Group>
                  <Button
                    fullWidth
                    color="blue"
                    radius={4}
                    leftSection={<PencilLine size={16} />}
                    onClick={() => openComposer()}
                    disabled={!data.canSubmit}
                  >
                    카페 글쓰기
                  </Button>
                </Stack>
              </Card>

              <Card radius={4} p={0} withBorder>
                <Box px="md" py="sm" style={{ borderBottom: "1px solid #d7dde5" }}>
                  <Group gap={6}>
                    <Text c="green.7" fw={900}>★</Text>
                    <Text fw={900} size="sm">즐겨찾는 게시판</Text>
                  </Group>
                </Box>
                <Stack gap={0}>
                  <Box px="md" py={9} bg="gray.0">
                    <Text size="sm" fw={800}>전체글보기</Text>
                  </Box>
                  {DAY_GUIDES.map((guide) => {
                    const submission = submissionsByDay.get(guide.day);
                    return (
                      <UnstyledButton
                        key={guide.day}
                        onClick={() => openComposer(guide.day)}
                        style={{ width: "100%" }}
                      >
                        <Group justify="space-between" px="md" py={9} wrap="nowrap">
                          <Box>
                            <Text size="sm">{guide.board}</Text>
                            <Text size="xs" c="gray.5">{guide.badge}</Text>
                          </Box>
                          <Badge size="xs" color={submission ? "green" : "gray"} variant="light">
                            {submission ? "완료" : "작성"}
                          </Badge>
                        </Group>
                      </UnstyledButton>
                    );
                  })}
                </Stack>
              </Card>

              <Card radius={4} p="md" withBorder hiddenFrom="md">
                <SimpleGrid cols={3} spacing="xs">
                  {DAY_GUIDES.map((guide) => {
                    const submission = submissionsByDay.get(guide.day);
                    return (
                      <Button
                        key={guide.day}
                        size="xs"
                        variant={submission ? "light" : "outline"}
                        color={submission ? "green" : "gray"}
                        radius={4}
                        onClick={() => openComposer(guide.day)}
                      >
                        {guide.board}
                      </Button>
                    );
                  })}
                </SimpleGrid>
              </Card>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 9 }}>
            <Card radius={4} p={0} withBorder>
              <Box px={{ base: "md", sm: "lg" }} py="md">
                <Group justify="space-between" align="flex-end" gap="sm">
                  <Box>
                    <Title order={3} fz={{ base: 18, sm: 20 }}>전체글보기</Title>
                    <Text size="sm" c="gray.6">전체 기수 최신순 {feedSubmissions.length}개</Text>
                  </Box>
                  <Group gap={6} visibleFrom="sm">
                    <Search size={14} color="#6b7280" />
                    <Text size="xs" c="gray.6">기수와 작성자는 익명 표시됩니다</Text>
                  </Group>
                </Group>
              </Box>
              <Divider />

              <Box visibleFrom="sm">
                <Table verticalSpacing={9} horizontalSpacing="md" highlightOnHover>
                  <Table.Thead bg="gray.0">
                    <Table.Tr>
                      <Table.Th style={{ width: 92 }}>말머리</Table.Th>
                      <Table.Th>제목</Table.Th>
                      <Table.Th style={{ width: 116 }}>작성자</Table.Th>
                      <Table.Th style={{ width: 112 }}>작성일</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Badge color="red" variant="light" radius={2}>공지</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700} c="red.7">
                          글쓰기에서 1차, 2차, 3차 말머리를 선택하면 차수별 양식이 열립니다.
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.7">운영자</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.6">고정</Text>
                      </Table.Td>
                    </Table.Tr>
                    {feedSubmissions.map((submission) => {
                      const guide = getGuide(submission.day);

                      return (
                        <Table.Tr
                          key={submission.id}
                          onClick={() => setViewingSubmission(submission)}
                          style={{ cursor: "pointer" }}
                        >
                          <Table.Td>
                            <Badge color="blue" variant="outline" radius={2}>{guide.board}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={6} wrap="nowrap">
                              <Text size="sm" fw={submission.isMine ? 800 : 500} truncate>
                                {submission.title}
                              </Text>
                              {submission.isMine && (
                                <Badge color="green" variant="light" size="xs" radius={2}>내 글</Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="gray.7" truncate>{submission.authorLabel}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="gray.6">{formatDate(submission.updatedAt)}</Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>

              <Stack hiddenFrom="sm" gap={0}>
                <Box px="md" py="sm" bg="gray.0">
                  <Group gap="xs" wrap="nowrap">
                    <Badge color="red" variant="light" radius={2}>공지</Badge>
                    <Text size="sm" fw={700} c="red.7">
                      글쓰기에서 차수를 선택하면 양식이 열립니다.
                    </Text>
                  </Group>
                </Box>
                <Divider />

                {feedSubmissions.length === 0 ? (
                  <Box px="md" py="xl" ta="center">
                    <ThemeIcon mx="auto" size={44} radius="xl" color="gray" variant="light">
                      <FileText size={22} />
                    </ThemeIcon>
                    <Text fw={800} mt="sm">아직 올라온 인증글이 없습니다</Text>
                    <Text size="sm" c="gray.6" mt={4}>
                      첫 인증글을 남기면 이곳에 최신순으로 표시됩니다.
                    </Text>
                  </Box>
                ) : (
                  feedSubmissions.map((submission) => {
                    const guide = getGuide(submission.day);
                    const status = getStatus(submission);
                    return (
                      <UnstyledButton
                        key={submission.id}
                        onClick={() => setViewingSubmission(submission)}
                        style={{ width: "100%", textAlign: "left" }}
                      >
                        <Box px="md" py="md" style={{ borderBottom: "1px solid #edf0f3" }}>
                          <Group gap={6} mb={6}>
                            <Badge color="gray" variant="outline" radius={2}>{submission.cohort}</Badge>
                            <Badge color="blue" variant="light" radius={2}>{guide.board}</Badge>
                            {submission.isMine && <Badge color="green" variant="light" radius={2}>내 글</Badge>}
                            <Badge color={status.color} variant="light" radius={2}>{status.label}</Badge>
                          </Group>
                          <Text fw={800} size="sm" lineClamp={2}>{submission.title}</Text>
                          <Text size="sm" c="gray.6" mt={4} lineClamp={2}>
                            {clipPreview(submission.content)}
                          </Text>
                          <Group gap={6} mt={8}>
                            <UserRound size={13} color="#6b7280" />
                            <Text size="xs" c="gray.6">{submission.authorLabel}</Text>
                            <Text size="xs" c="gray.5">·</Text>
                            <Text size="xs" c="gray.6">{formatDate(submission.updatedAt)}</Text>
                          </Group>
                        </Box>
                      </UnstyledButton>
                    );
                  })
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>

      <Modal
        opened={!!viewingSubmission}
        onClose={() => setViewingSubmission(null)}
        title={
          viewingSubmission ? (
            <Group gap="xs">
              <Badge color="blue" variant="outline" radius={2}>{getGuide(viewingSubmission.day).board}</Badge>
              {viewingSubmission.isMine && <Badge color="green" variant="light" radius={2}>내 글</Badge>}
              <Text fw={800}>인증글 보기</Text>
            </Group>
          ) : null
        }
        size="lg"
        radius="md"
        centered
      >
        {viewingSubmission && (
          <Stack gap="md">
            <Box>
              <Title order={3}>{viewingSubmission.title}</Title>
              <Group gap="xs" mt={8}>
                <UserRound size={14} color="#6b7280" />
                <Text size="sm" c="gray.6">{viewingSubmission.authorLabel}</Text>
                <Text size="sm" c="gray.5">·</Text>
                <Text size="sm" c="gray.6">{formatDate(viewingSubmission.updatedAt)}</Text>
              </Group>
            </Box>
            <Divider />
            <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.75 }}>
              {viewingSubmission.content}
            </Text>
            {viewingSubmission.referenceUrl && (
              <Anchor href={viewingSubmission.referenceUrl} target="_blank" rel="noopener noreferrer">
                참고 링크 열기
              </Anchor>
            )}
            {viewingSubmission.isMine && (
              <Group justify="flex-end">
                <Button
                  variant="light"
                  color="blue"
                  leftSection={<PencilLine size={16} />}
                  onClick={() => {
                    const day = viewingSubmission.day;
                    setViewingSubmission(null);
                    openComposer(day);
                  }}
                >
                  수정하기
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>

      <Modal
        opened={composerOpen}
        onClose={closeComposer}
        title={
          <Group gap="xs">
            {activeGuide && <Badge color="blue" variant="light" radius={2}>{activeGuide.board}</Badge>}
            <Text fw={800}>{activeSubmission ? "인증글 수정" : "글쓰기"}</Text>
          </Group>
        }
        size="lg"
        radius="md"
        centered
      >
        <Stack gap="md">
          <Box>
            <Text fw={800} mb="xs">말머리 선택</Text>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              {DAY_GUIDES.map((guide) => {
                const selected = activeDay === guide.day;
                const submission = submissionsByDay.get(guide.day);
                return (
                  <UnstyledButton
                    key={guide.day}
                    onClick={() => selectGuide(guide.day)}
                    style={{
                      border: `1px solid ${selected ? "#228be6" : "#d7dde5"}`,
                      borderRadius: 4,
                      background: selected ? "#e7f5ff" : "#fff",
                      padding: 12,
                    }}
                  >
                    <Group justify="space-between" gap="xs" wrap="nowrap" mb={4}>
                      <Text fw={800} size="sm">{guide.board}</Text>
                      <Badge size="xs" color={submission ? "green" : "gray"} variant="light" radius={2}>
                        {submission ? "작성됨" : "미작성"}
                      </Badge>
                    </Group>
                    <Text size="xs" c="gray.6" lineClamp={2}>
                      {guide.title}
                    </Text>
                  </UnstyledButton>
                );
              })}
            </SimpleGrid>
          </Box>

          {!activeGuide && (
            <Alert color="gray" variant="light">
              위에서 1차, 2차, 3차 중 하나를 선택하면 해당 인증글 양식이 열립니다.
            </Alert>
          )}

          {activeGuide && activeDay && (
            <>
              <Alert color="blue" variant="light">
                <Text fw={700}>{activeGuide.title}</Text>
                <Text size="sm" mt={4}>{activeGuide.description}</Text>
              </Alert>

              <Card radius={4} p="md" withBorder bg="gray.0">
                <Group gap="xs" mb={8}>
                  <FileText size={16} color="#228be6" />
                  <Text fw={800} size="sm">작성 양식</Text>
                </Group>
                <Text size="sm" c="gray.7" style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                  {activeGuide.template}
                </Text>
              </Card>

              {activeSubmission?.adminNote && (
                <Alert color="blue" variant="light">
                  <Text fw={700} size="sm">운영자 메모</Text>
                  <Text size="sm" mt={4} style={{ whiteSpace: "pre-wrap" }}>
                    {activeSubmission.adminNote}
                  </Text>
                </Alert>
              )}

              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              <TextInput
                label="제목"
                value={getDraft(activeDay, activeGuide.title).title}
                onChange={(event) => updateDraft(activeDay, { title: event.currentTarget.value })}
                disabled={!data.canSubmit}
                maxLength={120}
              />

              <Textarea
                label="본문"
                description="위 양식을 참고해서 카페 인증글처럼 작성해주세요."
                placeholder={activeGuide.placeholder}
                value={getDraft(activeDay, activeGuide.title).content}
                onChange={(event) => updateDraft(activeDay, { content: event.currentTarget.value })}
                autosize
                minRows={8}
                maxRows={16}
                maxLength={5000}
                disabled={!data.canSubmit}
              />

              <TextInput
                label="참고 링크"
                description="FlowSpot 저장 링크, 채널 링크, 캡처 링크 등이 있으면 넣어주세요."
                placeholder="https://..."
                value={getDraft(activeDay, activeGuide.title).referenceUrl}
                onChange={(event) => updateDraft(activeDay, { referenceUrl: event.currentTarget.value })}
                disabled={!data.canSubmit}
                maxLength={500}
              />

              <Group justify="space-between">
                <Anchor component={Link} href="/dashboard/batch" size="sm" c="blue">
                  FlowSpot으로 스크립트 만들기
                </Anchor>
                <Button
                  color="blue"
                  radius={4}
                  loading={savingDay === activeDay}
                  disabled={!data.canSubmit}
                  onClick={() => submit(activeDay)}
                  rightSection={<Send size={16} />}
                >
                  {activeSubmission ? "수정 저장" : "등록"}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
