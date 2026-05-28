"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
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
  ArrowLeft,
  ExternalLink,
  FileText,
  Lock,
  MessageCircle,
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

type ChallengeComment = {
  id: string;
  submissionId: string;
  content: string;
  authorLabel: string;
  isMine: boolean;
  createdAt: string;
  updatedAt: string;
};

type ChallengeResponse = {
  enrollment: ChallengeEnrollment | null;
  canSubmit: boolean;
  submissions: MissionSubmission[];
  feedSubmissions: FeedSubmission[];
};

const APPLICATION_URL =
  "https://steep-radar-52f.notion.site/e45579f5dd6d43d0878a86b3869d7b54";

const BRAND = {
  primary: "#8b5cf6",
  primaryDark: "#7c3aed",
  accent: "#ec4899",
  soft: "rgba(139, 92, 246, 0.08)",
  softer: "rgba(139, 92, 246, 0.04)",
  border: "rgba(139, 92, 246, 0.2)",
  line: "#e5e7eb",
  muted: "#6b7280",
};

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
  {
    day: 4,
    board: "수강후기",
    title: "강의와 FlowSpot을 써본 후기",
    badge: "후기",
    description:
      "강의를 보거나 FlowSpot을 써보며 막혔던 점, 달라진 점, 앞으로 적용할 방향을 남깁니다.",
    template:
      "1. 시작 전 막혔던 점:\n2. 강의 또는 FlowSpot을 써보고 달라진 점:\n3. 가장 도움이 된 부분:\n4. 앞으로 만들 쇼츠 방향:\n5. 다른 참여자에게 해주고 싶은 말:",
    placeholder:
      "예: 소재를 찾는 데 시간이 오래 걸렸는데, 채널 방향을 먼저 잡고 나니 어떤 상품을 골라야 할지 기준이 생겼습니다.",
  },
  {
    day: 5,
    board: "질문",
    title: "챌린지/강의/FlowSpot 질문하기",
    badge: "Q&A",
    description:
      "채널 방향, 소재 선정, 스크립트 작성, 프로그램 사용 중 막히는 지점을 질문합니다.",
    template:
      "1. 지금 막힌 부분:\n2. 시도해본 것:\n3. 보고 있는 채널 또는 소재:\n4. 답변받고 싶은 질문:",
    placeholder:
      "예: 생활꿀템 쇼츠를 하고 싶은데 너무 흔한 느낌이 듭니다. 원룸/자취 쪽으로 좁히는 게 좋을지, 육아템 쪽으로 가는 게 좋을지 고민됩니다.",
  },
] as const;

const BOARD_FILTERS = [
  { value: "all", label: "전체" },
  { value: "mission", label: "미션 인증" },
  { value: "review", label: "수강후기" },
  { value: "question", label: "질문" },
] as const;

type BoardFilter = (typeof BOARD_FILTERS)[number]["value"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "제출", color: "violet" },
  reviewed: { label: "확인", color: "violet" },
  approved: { label: "완료", color: "green" },
  needs_revision: { label: "보완", color: "orange" },
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getGuide(day: number) {
  return DAY_GUIDES.find((item) => item.day === day) || DAY_GUIDES[0];
}

function getSubmissionFilter(day: number): BoardFilter {
  if (day === 4) return "review";
  if (day === 5) return "question";
  return "mission";
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
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [selectedSubmission, setSelectedSubmission] = useState<FeedSubmission | null>(null);
  const [comments, setComments] = useState<ChallengeComment[]>([]);
  const [commentsBySubmissionId, setCommentsBySubmissionId] = useState<
    Record<string, ChallengeComment[]>
  >({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { title: string; content: string; referenceUrl: string }>
  >({});
  const selectedSubmissionIdRef = useRef<string | null>(null);

  const submissionsByDay = useMemo(() => {
    const entries = new Map<number, MissionSubmission>();
    (data?.submissions || []).forEach((submission) => {
      entries.set(submission.day, submission);
    });
    return entries;
  }, [data?.submissions]);

  const activeGuide = DAY_GUIDES.find((item) => item.day === activeDay) || null;
  const activeSubmission = activeDay ? submissionsByDay.get(activeDay) : undefined;
  const feedSubmissions = useMemo(() => data?.feedSubmissions || [], [data?.feedSubmissions]);
  const filteredFeedSubmissions = useMemo(() => {
    if (boardFilter === "all") return feedSubmissions;
    return feedSubmissions.filter((submission) => getSubmissionFilter(submission.day) === boardFilter);
  }, [boardFilter, feedSubmissions]);

  async function load() {
    try {
      const res = await fetch("/api/challenge", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "챌린지 정보를 불러오지 못했습니다.");
        return;
      }

      const nextFeedSubmissions = (json.feedSubmissions || []) as FeedSubmission[];
      setData({ ...json, feedSubmissions: nextFeedSubmissions });
      nextFeedSubmissions.slice(0, 3).forEach((submission) => {
        void loadComments(submission.id, { silent: true });
      });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadComments(
    submissionId: string,
    options: { silent?: boolean; force?: boolean } = {},
  ) {
    const cachedComments = commentsBySubmissionId[submissionId];
    if (!options.force && cachedComments) {
      if (!options.silent && selectedSubmissionIdRef.current === submissionId) {
        setComments(cachedComments);
        setCommentsLoading(false);
        setCommentError(null);
      }
      return;
    }

    if (!options.silent && selectedSubmissionIdRef.current === submissionId) {
      setCommentsLoading(true);
      setCommentError(null);
    }
    try {
      const res = await fetch(`/api/challenge/comments?submissionId=${submissionId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) {
        if (options.silent) return;
        setCommentError(json.error || "댓글을 불러오지 못했습니다.");
        setComments([]);
        return;
      }
      const nextComments = (json.comments || []) as ChallengeComment[];
      setCommentsBySubmissionId((prev) => ({
        ...prev,
        [submissionId]: nextComments,
      }));
      if (!options.silent) {
        setComments(nextComments);
      }
    } catch {
      if (options.silent) return;
      setCommentError("댓글을 불러오지 못했습니다.");
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }

  function openSubmission(submission: FeedSubmission) {
    selectedSubmissionIdRef.current = submission.id;
    setSelectedSubmission(submission);
    setCommentDraft("");
    const cachedComments = commentsBySubmissionId[submission.id];
    if (cachedComments) {
      setComments(cachedComments);
      setCommentsLoading(false);
      setCommentError(null);
      return;
    }

    setComments([]);
    setCommentsLoading(true);
    void loadComments(submission.id);
  }

  function closeSubmission() {
    selectedSubmissionIdRef.current = null;
    setSelectedSubmission(null);
    setCommentsLoading(false);
  }

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
        content: submission?.content || prev[day]?.content || guide.template,
        referenceUrl: submission?.referenceUrl || prev[day]?.referenceUrl || "",
      },
    }));
    setActiveDay(day);
  }

  function openComposer(day?: number) {
    setError(null);
    setComposerOpen(true);
    if (day) {
      selectGuide(day);
      return;
    }
    if (boardFilter === "review") {
      selectGuide(4);
      return;
    }
    if (boardFilter === "question") {
      selectGuide(5);
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

      const nextSelected = (json.feedSubmission as FeedSubmission | undefined) || null;
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
      if (nextSelected) {
        selectedSubmissionIdRef.current = nextSelected.id;
        setSelectedSubmission(nextSelected);
        setCommentsBySubmissionId((prev) => ({
          ...prev,
          [nextSelected!.id]: prev[nextSelected!.id] || [],
        }));
        setComments([]);
        setCommentDraft("");
      }
    } catch {
      setError("게시글 저장에 실패했습니다.");
    } finally {
      setSavingDay(null);
    }
  }

  async function submitComment() {
    if (!selectedSubmission) return;
    const content = commentDraft.trim();
    setCommentError(null);

    if (!content) {
      setCommentError("댓글 내용을 입력해주세요.");
      return;
    }

    setSavingComment(true);
    try {
      const res = await fetch("/api/challenge/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCommentError(json.error || "댓글 저장에 실패했습니다.");
        return;
      }
      setComments((prev) => [...prev, json.comment]);
      setCommentsBySubmissionId((prev) => ({
        ...prev,
        [selectedSubmission.id]: [...(prev[selectedSubmission.id] || []), json.comment],
      }));
      setCommentDraft("");
    } catch {
      setCommentError("댓글 저장에 실패했습니다.");
    } finally {
      setSavingComment(false);
    }
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader color="violet" />
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
                color="violet"
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
    item.day <= 3 && ["submitted", "reviewed", "approved"].includes(item.status),
  ).length;

  return (
    <Container size="xl" py={{ base: "sm", md: "md" }} px={{ base: "xs", sm: "md" }}>
      <Stack gap="md">
        <Box
          style={{
            border: `1px solid ${BRAND.line}`,
            borderRadius: 8,
            overflow: "hidden",
            background: "#fff",
          }}
        >
          <Box
            px={{ base: "md", md: "xl" }}
            py={{ base: "md", md: "lg" }}
            style={{
              minHeight: 112,
              background:
                "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(236, 72, 153, 0.06) 58%, #ffffff)",
              borderBottom: `1px solid ${BRAND.line}`,
            }}
          >
            <Group justify="space-between" align="center" gap="lg" wrap="nowrap">
              <Box style={{ minWidth: 0 }}>
                <Group gap={6} mb={10}>
                  <Badge color="violet" variant="filled" radius={2}>FlowSpot Cafe</Badge>
                  <Badge color="violet" variant="light" radius={2}>{data.enrollment.cohort}</Badge>
                </Group>
                <Title order={1} fz={{ base: 25, sm: 32, md: 36 }} lh={1.08} c={BRAND.primaryDark}>
                  쇼핑 쇼츠 챌린지
                </Title>
                <Text c="gray.7" size="sm" mt={10}>
                  이전 기수와 현재 기수의 인증글을 보고 내 미션도 게시글처럼 남깁니다.
                </Text>
                <Button
                  hiddenFrom="sm"
                  mt="md"
                  color="violet"
                  radius={4}
                  leftSection={<PencilLine size={16} />}
                  onClick={() => openComposer()}
                  disabled={!data.canSubmit}
                >
                  글쓰기
                </Button>
              </Box>
              <Box visibleFrom="sm" ta="right">
                <Text fw={900} fz={30} c={BRAND.primary}>{completedCount}/3</Text>
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

        <Card radius={8} p={0} withBorder>
          <Box px={{ base: "md", sm: "lg" }} py="md">
            <Group justify="space-between" align="flex-end" gap="sm">
              <Box>
                <Title order={3} fz={{ base: 18, sm: 20 }}>
                  {selectedSubmission ? "글 상세보기" : "전체글보기"}
                </Title>
                <Text size="sm" c="gray.6">
                  {selectedSubmission
                    ? "본문을 읽고 댓글로 질문이나 피드백을 남길 수 있습니다."
                    : `${BOARD_FILTERS.find((item) => item.value === boardFilter)?.label || "전체"} 최신순 ${filteredFeedSubmissions.length}개`}
                </Text>
              </Box>
              <Group gap={6} visibleFrom="sm">
                {selectedSubmission ? (
                  <Button
                    size="xs"
                    variant="light"
                    color="gray"
                    radius={4}
                    leftSection={<ArrowLeft size={14} />}
                    onClick={closeSubmission}
                  >
                    목록으로
                  </Button>
                ) : (
                  <>
                    <Search size={14} color={BRAND.muted} />
                    <Text size="xs" c="gray.6">기수와 작성자는 익명 표시됩니다</Text>
                  </>
                )}
              </Group>
            </Group>
            {!selectedSubmission && (
              <Group mt="md" gap={6} wrap="wrap">
                {BOARD_FILTERS.map((filter) => {
                  const count =
                    filter.value === "all"
                      ? feedSubmissions.length
                      : feedSubmissions.filter(
                          (submission) => getSubmissionFilter(submission.day) === filter.value,
                        ).length;
                  const selected = boardFilter === filter.value;
                  return (
                    <Button
                      key={filter.value}
                      size="xs"
                      radius={4}
                      color={selected ? "violet" : "gray"}
                      variant={selected ? "filled" : "light"}
                      style={selected ? { background: BRAND.primary } : undefined}
                      onClick={() => setBoardFilter(filter.value)}
                    >
                      {filter.label} {count}
                    </Button>
                  );
                })}
              </Group>
            )}
            <Group mt="md" gap={6} wrap="wrap">
              <Badge color="violet" variant="light" radius={2}>
                내 인증 {completedCount}/3
              </Badge>
              {DAY_GUIDES.map((guide) => {
                const submission = submissionsByDay.get(guide.day);
                return (
                  <Button
                    key={guide.day}
                    size="xs"
                    variant={submission ? "light" : "outline"}
                    color={submission ? "violet" : "gray"}
                    radius={4}
                    onClick={() => openComposer(guide.day)}
                    style={submission ? { color: BRAND.primaryDark } : undefined}
                  >
                    {guide.board}
                  </Button>
                );
              })}
              <Button
                visibleFrom="sm"
                size="xs"
                color="violet"
                radius={4}
                leftSection={<PencilLine size={14} />}
                onClick={() => openComposer()}
                disabled={!data.canSubmit}
                style={{ background: BRAND.primary }}
              >
                글쓰기
              </Button>
            </Group>
          </Box>
          <Divider />

          {selectedSubmission ? (
            <Box>
              <Box px={{ base: "md", sm: "lg" }} py="lg">
                <Button
                  hiddenFrom="sm"
                  size="xs"
                  variant="subtle"
                  color="gray"
                  radius={4}
                  leftSection={<ArrowLeft size={14} />}
                  onClick={closeSubmission}
                  mb="sm"
                >
                  목록으로
                </Button>

                <Group gap={6} mb="sm">
                  <Badge color="gray" variant="outline" radius={2}>{selectedSubmission.cohort}</Badge>
                  <Badge color="violet" variant="light" radius={2}>{getGuide(selectedSubmission.day).board}</Badge>
                  {selectedSubmission.isMine && <Badge color="violet" variant="light" radius={2}>내 글</Badge>}
                  <Badge color={getStatus(selectedSubmission).color} variant="light" radius={2}>
                    {getStatus(selectedSubmission).label}
                  </Badge>
                </Group>

                <Title order={2} fz={{ base: 20, sm: 26 }}>
                  {selectedSubmission.title}
                </Title>
                <Group gap={6} mt={10}>
                  <UserRound size={14} color={BRAND.muted} />
                  <Text size="sm" c="gray.6">{selectedSubmission.authorLabel}</Text>
                  <Text size="sm" c="gray.5">·</Text>
                  <Text size="sm" c="gray.6">{formatDateTime(selectedSubmission.updatedAt)}</Text>
                </Group>

                <Divider my="lg" />
                <Text style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                  {selectedSubmission.content}
                </Text>

                {selectedSubmission.referenceUrl && (
                  <Anchor
                    href={selectedSubmission.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    mt="md"
                    display="inline-block"
                    c="violet"
                  >
                    참고 링크 열기
                  </Anchor>
                )}

                {selectedSubmission.isMine && (
                  <Group justify="flex-end" mt="lg">
                    <Button
                      variant="light"
                      color="violet"
                      radius={4}
                      leftSection={<PencilLine size={16} />}
                      onClick={() => openComposer(selectedSubmission.day)}
                    >
                      수정하기
                    </Button>
                  </Group>
                )}
              </Box>

              <Divider />

              <Box px={{ base: "md", sm: "lg" }} py="lg" bg={BRAND.softer}>
                <Group gap="xs" mb="md">
                  <MessageCircle size={17} color={BRAND.primary} />
                  <Text fw={900}>댓글 {comments.length}</Text>
                </Group>

                {commentError && (
                  <Alert color="red" variant="light" mb="md">
                    {commentError}
                  </Alert>
                )}

                {commentsLoading ? (
                  <Group py="md">
                    <Loader size="sm" color="violet" />
                    <Text size="sm" c="gray.6">댓글을 불러오는 중...</Text>
                  </Group>
                ) : comments.length === 0 ? (
                  <Text size="sm" c="gray.6" mb="md">
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
                  </Text>
                ) : (
                  <Stack gap="xs" mb="md">
                    {comments.map((comment) => (
                      <Box
                        key={comment.id}
                        p="sm"
                        style={{
                          border: "1px solid #e4e7ec",
                          borderRadius: 4,
                          background: "#fff",
                        }}
                      >
                        <Group gap={6} mb={4}>
                          <Text size="sm" fw={800}>{comment.authorLabel}</Text>
                          {comment.isMine && <Badge size="xs" color="violet" variant="light" radius={2}>내 댓글</Badge>}
                          <Text size="xs" c="gray.5">·</Text>
                          <Text size="xs" c="gray.5">{formatDateTime(comment.createdAt)}</Text>
                        </Group>
                        <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                          {comment.content}
                        </Text>
                      </Box>
                    ))}
                  </Stack>
                )}

                <Textarea
                  placeholder="댓글을 입력해주세요."
                  value={commentDraft}
                  onChange={(event) => setCommentDraft(event.currentTarget.value)}
                  autosize
                  minRows={3}
                  maxRows={8}
                  maxLength={1000}
                  disabled={!data.canSubmit}
                />
                <Group justify="space-between" mt="sm">
                  <Text size="xs" c="gray.6">
                    질문, 응원, 개선 피드백을 짧게 남길 수 있습니다.
                  </Text>
                  <Button
                    size="sm"
                    color="violet"
                    radius={4}
                    loading={savingComment}
                    disabled={!data.canSubmit}
                    onClick={submitComment}
                    rightSection={<Send size={15} />}
                    style={{ background: BRAND.primary }}
                  >
                    댓글 등록
                  </Button>
                </Group>
              </Box>
            </Box>
          ) : (
            <>
              <Box visibleFrom="sm">
                <Table verticalSpacing={9} horizontalSpacing="md" highlightOnHover>
                  <Table.Thead style={{ background: BRAND.softer }}>
                    <Table.Tr>
                      <Table.Th style={{ width: 92 }}>말머리</Table.Th>
                      <Table.Th>제목</Table.Th>
                      <Table.Th style={{ width: 116 }}>작성자</Table.Th>
                      <Table.Th style={{ width: 112, whiteSpace: "nowrap" }}>작성일</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    <Table.Tr>
                      <Table.Td>
                        <Badge color="violet" variant="light" radius={2}>공지</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700} c="gray.8">
                          글쓰기에서 미션 인증, 수강후기, 질문 말머리를 선택하면 맞춤 양식이 열립니다.
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.7">운영자</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.6">고정</Text>
                      </Table.Td>
                    </Table.Tr>
                    {filteredFeedSubmissions.map((submission) => {
                      const guide = getGuide(submission.day);

                      return (
                        <Table.Tr
                          key={submission.id}
                          onClick={() => openSubmission(submission)}
                          style={{ cursor: "pointer" }}
                        >
                          <Table.Td>
                            <Badge color="violet" variant="outline" radius={2}>{guide.board}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={6} wrap="nowrap">
                              <Text size="sm" fw={submission.isMine ? 800 : 500} truncate>
                                {submission.title}
                              </Text>
                              {submission.isMine && (
                                <Badge color="violet" variant="light" size="xs" radius={2}>내 글</Badge>
                              )}
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm" c="gray.7" truncate>{submission.authorLabel}</Text>
                          </Table.Td>
                          <Table.Td style={{ whiteSpace: "nowrap" }}>
                            <Text size="sm" c="gray.6" style={{ whiteSpace: "nowrap" }}>
                              {formatDate(submission.updatedAt)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>

              <Stack hiddenFrom="sm" gap={0}>
                <Box px="md" py="sm" bg={BRAND.softer}>
                  <Group gap="xs" wrap="nowrap">
                    <Badge color="violet" variant="light" radius={2}>공지</Badge>
                    <Text size="sm" fw={700} c="gray.8">
                      글쓰기에서 말머리를 선택하면 맞춤 양식이 열립니다.
                    </Text>
                  </Group>
                </Box>
                <Divider />

                {filteredFeedSubmissions.length === 0 ? (
                  <Box px="md" py="xl" ta="center">
                    <ThemeIcon mx="auto" size={44} radius="xl" color="violet" variant="light">
                      <FileText size={22} />
                    </ThemeIcon>
                    <Text fw={800} mt="sm">아직 올라온 게시글이 없습니다</Text>
                    <Text size="sm" c="gray.6" mt={4}>
                      첫 게시글을 남기면 이곳에 최신순으로 표시됩니다.
                    </Text>
                  </Box>
                ) : (
                  filteredFeedSubmissions.map((submission) => {
                    const guide = getGuide(submission.day);
                    const status = getStatus(submission);
                    return (
                      <UnstyledButton
                        key={submission.id}
                        onClick={() => openSubmission(submission)}
                        style={{ width: "100%", textAlign: "left" }}
                      >
                        <Box px="md" py="md" style={{ borderBottom: "1px solid #edf0f3" }}>
                          <Group gap={6} mb={6}>
                            <Badge color="gray" variant="outline" radius={2}>{submission.cohort}</Badge>
                            <Badge color="violet" variant="light" radius={2}>{guide.board}</Badge>
                            {submission.isMine && <Badge color="violet" variant="light" radius={2}>내 글</Badge>}
                            <Badge color={status.color} variant="light" radius={2}>{status.label}</Badge>
                          </Group>
                          <Text fw={800} size="sm" lineClamp={2}>{submission.title}</Text>
                          <Text size="sm" c="gray.6" mt={4} lineClamp={2}>
                            {clipPreview(submission.content)}
                          </Text>
                          <Group gap={6} mt={8}>
                            <UserRound size={13} color={BRAND.muted} />
                            <Text size="xs" c="gray.6">{submission.authorLabel}</Text>
                            <Text size="xs" c="gray.5">·</Text>
                            <Text size="xs" c="gray.6" style={{ whiteSpace: "nowrap" }}>
                              {formatDate(submission.updatedAt)}
                            </Text>
                          </Group>
                        </Box>
                      </UnstyledButton>
                    );
                  })
                )}
              </Stack>
            </>
          )}
        </Card>
      </Stack>

      <Modal
        opened={composerOpen}
        onClose={closeComposer}
        title={
          <Group gap="xs">
            {activeGuide && <Badge color="violet" variant="light" radius={2}>{activeGuide.board}</Badge>}
            <Text fw={800}>{activeSubmission ? "게시글 수정" : "글쓰기"}</Text>
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
                      border: `1px solid ${selected ? BRAND.primary : BRAND.line}`,
                      borderRadius: 4,
                      background: selected ? BRAND.soft : "#fff",
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
              위에서 말머리를 선택하면 해당 게시글 양식이 열립니다.
            </Alert>
          )}

          {activeGuide && activeDay && (
            <>
              <Alert color="violet" variant="light">
                <Text fw={700}>{activeGuide.title}</Text>
                <Text size="sm" mt={4}>{activeGuide.description}</Text>
              </Alert>

              {activeSubmission?.adminNote && (
                <Alert color="violet" variant="light">
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
                description="양식이 본문에 들어가 있습니다. 각 항목 아래에 바로 작성해주세요."
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
                <Anchor component={Link} href="/dashboard/batch" size="sm" c="violet">
                  FlowSpot으로 스크립트 만들기
                </Anchor>
                <Button
                  color="violet"
                  radius={4}
                  loading={savingDay === activeDay}
                  disabled={!data.canSubmit}
                  onClick={() => submit(activeDay)}
                  rightSection={<Send size={16} />}
                  style={{ background: BRAND.primary }}
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
