"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
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
  Trash2,
  UserRound,
} from "lucide-react";

import { Link } from "@/i18n/routing";

type ChallengeEnrollment = {
  id: string;
  email: string;
  cohort: string;
  status: string;
  accessStartsAt: string;
  accessEndsAt: string | null;
  bonusCreditsGranted: number;
  discountStatus: string;
  discountAmount: number;
  updatedAt: string;
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
  canComment: boolean;
  canManage: boolean;
  submissions: MissionSubmission[];
  feedSubmissions: FeedSubmission[];
};

const APPLICATION_URL =
  "https://steep-radar-52f.notion.site/e45579f5dd6d43d0878a86b3869d7b54";
const CHALLENGE_GUIDE_URL =
  "https://app.notion.com/p/3-36f847bd025f81709723e03f5d4c3da4?pvs=48";
const FLOWSPOT_USAGE_GUIDE_URL =
  "https://app.notion.com/p/FlowSpot-362847bd025f8050b03ce759b7ac39b0";

const NOTICE_SECTIONS = [
  {
    title: "전체 진행 흐름",
    items: [
      "신청서에 작성한 이메일과 같은 이메일로 FlowSpot에 가입/로그인합니다.",
      "챌린지 게시판에서 1일차, 2일차, 3일차 미션을 순서대로 제출합니다.",
      "막히는 부분은 기수별 오픈채팅방 또는 게시글 댓글로 질문합니다.",
    ],
  },
  {
    title: "1일차",
    items: [
      "VOD 04. 레드오션도 블루오션으로 바꾸는 채널 조합법을 봅니다.",
      "내가 만들 쇼핑 쇼츠 채널 방향을 1개 정리합니다.",
      "1차 인증 글에 채널 방향, 보는 사람, 차별점을 제출합니다.",
    ],
  },
  {
    title: "2일차",
    items: [
      "1차 인증 제출 후 VOD 08이 열립니다.",
      "VOD 08. 영상 주제 찾기 실전 예시를 보고 상품/주제 후보 3개를 찾습니다.",
      "2차 인증 글에 후보 3개와 고른 이유를 제출합니다.",
    ],
  },
  {
    title: "3일차",
    items: [
      "2차 인증 제출 후 FlowSpot으로 첫 쇼츠 스크립트를 만듭니다.",
      "3차 인증 글에 완성한 주제와 챌린지 후기를 제출합니다.",
      "3일 미션을 모두 제출하면 챌린지 완료 대상으로 확인됩니다.",
    ],
  },
  {
    title: "권한 오픈 기준",
    items: [
      "처음에는 챌린지 게시판과 VOD 04만 열립니다.",
      "1차 인증 제출 후 VOD 08이 열립니다.",
      "2차 인증 제출 후 3차 인증을 진행합니다.",
      "질문 글은 막히는 부분을 바로 남길 수 있도록 언제든 작성할 수 있습니다.",
    ],
  },
];

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

const DAY_3_MARKETING_CONSENT_TEXT =
  "[마케팅 활용 동의]\n제출한 별점과 후기는 익명 처리 후 FlowSpot 후기/홍보 자료로 활용될 수 있음에 동의합니다.";

function hasDay3MarketingConsent(content?: string | null) {
  return Boolean(content?.includes(DAY_3_MARKETING_CONSENT_TEXT));
}

function appendDay3MarketingConsent(content: string) {
  const trimmed = content.trim();
  if (hasDay3MarketingConsent(trimmed)) return trimmed;
  return `${trimmed}\n\n${DAY_3_MARKETING_CONSENT_TEXT}`;
}

const DAY_GUIDES = [
  {
    day: 1,
    board: "1차 인증",
    title: "내 쇼핑 쇼츠 채널 방향 잡기",
    badge: "VOD 04",
    description:
      "레드오션도 블루오션으로 바꾸는 채널 조합법을 보고, 내가 가져갈 쇼핑 채널 방향을 정리합니다.",
    actions: [{ label: "VOD 04 보러가기", href: "/dashboard/lectures/vod_04" }],
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
    actions: [{ label: "VOD 08 보러가기", href: "/dashboard/lectures/vod_08" }],
    template:
      "1. 소재 후보 1 + 고른 이유:\n2. 소재 후보 2 + 고른 이유:\n3. 소재 후보 3 + 고른 이유:\n4. 이 중 가장 먼저 만들고 싶은 소재:",
    placeholder:
      "예: 1. 접이식 빨래바구니 - 원룸 공간 문제와 연결 가능\n2. 실리콘 싱크대 덮개 - 주방 공간 확장 포인트\n3. 자석형 케이블 홀더 - 책상 정리 전후 장면을 만들기 좋음",
  },
  {
    day: 3,
    board: "3차 인증",
    title: "첫 쇼츠 스크립트 완성 후기",
    badge: "실습",
    description:
      "FlowSpot으로 첫 쇼츠 스크립트를 만든 뒤, 챌린지 전후로 달라진 점과 앞으로의 방향을 정리합니다. 영상 피드백을 받고 싶다면 참고 링크 칸에 영상 링크를 넣습니다.",
    actions: [
      { label: "FlowSpot 사용 가이드", href: FLOWSPOT_USAGE_GUIDE_URL, external: true },
      { label: "FlowSpot 열기", href: "/dashboard/batch" },
    ],
    template:
      "별점: ★★★★★\n다음 기수 분들이 참고할 수 있도록, 직접 해보신 체험 후기를 남겨주세요.\n\n1. 완성한 쇼츠 주제/상품은 무엇인가요?\n\n2. 챌린지 시작 전 가장 막혔던 점은 무엇인가요?\n\n3. 강의 또는 FlowSpot을 써보고 달라진 점은 무엇인가요?\n\n4. 가장 도움이 된 부분은 무엇인가요?\n\n5. 한 줄 후기를 남겨주세요.\n\n선택. 영상까지 제작했다면 참고 링크 칸에 영상 링크를 남겨주세요.",
    placeholder:
      "예: 별점 ★★★★★\n처음에는 어떤 상품을 골라야 할지 막혔는데, 채널 방향을 먼저 잡고 나니 소재를 고르는 기준이 생겼습니다.",
  },
  {
    day: 5,
    board: "질문",
    title: "챌린지/강의/FlowSpot 질문하기",
    badge: "Q&A",
    description:
      "채널 방향, 소재 선정, 스크립트 작성, 프로그램 사용 중 막히는 지점을 질문합니다.",
    actions: [],
    template:
      "1. 지금 막힌 부분:\n2. 시도해본 것:\n3. 보고 있는 채널 또는 소재:\n4. 답변받고 싶은 질문:",
    placeholder:
      "예: 생활꿀템 쇼츠를 하고 싶은데 너무 흔한 느낌이 듭니다. 원룸/자취 쪽으로 좁히는 게 좋을지, 육아템 쪽으로 가는 게 좋을지 고민됩니다.",
  },
] as const;

const BOARD_FILTERS = [
  { value: "all", label: "전체" },
  { value: "mission", label: "미션 인증" },
  { value: "question", label: "질문" },
] as const;

type BoardFilter = (typeof BOARD_FILTERS)[number]["value"];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "제출", color: "violet" },
  reviewed: { label: "확인", color: "violet" },
  approved: { label: "완료", color: "green" },
  needs_revision: { label: "보완", color: "orange" },
};

const COMMENT_MAX_LENGTH = 1000;
const CHALLENGE_DISCOUNT_WINDOW_MS = 48 * 60 * 60 * 1000;
const CHALLENGE_DISCOUNT_CHECKOUT_URL = "/checkout/allinone?coupon=CHALLENGE20";

const OFFICIAL_AUTHOR_IDS = new Set(["hmys0205", "hmys0205hmys"]);

const AUTO_TITLE_SUFFIX_BY_DAY: Record<number, string> = {
  1: "채널 방향 인증",
  2: "소재 후보 인증",
  3: "최종 스크립트 인증",
};

function maskDisplayId(value: string) {
  if (value.length <= 2) return `${value[0] || ""}***`;
  if (value.length <= 4) return `${value.slice(0, 2)}***`;
  return `${value.slice(0, 4)}***`;
}

function getAuthorDisplayId(email: string | null | undefined, fallback = "참여자") {
  const localPart = (email || "").split("@")[0]?.trim();
  if (!localPart) return fallback;
  if (OFFICIAL_AUTHOR_IDS.has(localPart.toLowerCase())) return "원초적 인사이트";
  return maskDisplayId(localPart);
}

function getAutoSubmissionTitle(day: number, enrollment: ChallengeEnrollment | null) {
  const suffix = AUTO_TITLE_SUFFIX_BY_DAY[day];
  if (!suffix || !enrollment) return "";
  return `[${enrollment.cohort} ${day}일차] ${getAuthorDisplayId(enrollment.email)} ${suffix}`;
}

const UNLOCKING_SUBMISSION_STATUSES = new Set(["submitted", "reviewed", "approved", "needs_revision"]);

function hasUnlockedSubmission(submissionsByDay: Map<number, MissionSubmission>, day: number) {
  const submission = submissionsByDay.get(day);
  return Boolean(submission && UNLOCKING_SUBMISSION_STATUSES.has(submission.status));
}

function isChallengeDayUnlocked(day: number, submissionsByDay: Map<number, MissionSubmission>) {
  if (day === 1 || day === 5) return true;
  if (day === 2) return hasUnlockedSubmission(submissionsByDay, 1);
  if (day === 3) return hasUnlockedSubmission(submissionsByDay, 2);
  if (day === 4) return hasUnlockedSubmission(submissionsByDay, 3);
  return false;
}

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
  const [selectedNotice, setSelectedNotice] = useState(false);
  const [comments, setComments] = useState<ChallengeComment[]>([]);
  const [commentsBySubmissionId, setCommentsBySubmissionId] = useState<
    Record<string, ChallengeComment[]>
  >({});
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentDraft, setCommentDraft] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentDraft, setEditingCommentDraft] = useState("");
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deletingSubmissionId, setDeletingSubmissionId] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [day3MarketingConsent, setDay3MarketingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChallengeResponse | null>(null);
  const [drafts, setDrafts] = useState<
    Record<number, { title: string; content: string; referenceUrl: string }>
  >({});
  const selectedSubmissionIdRef = useRef<string | null>(null);

  const visibleComments = useMemo(() => {
    if (!selectedSubmission) return [];
    return comments.filter((comment) => comment.submissionId === selectedSubmission.id);
  }, [comments, selectedSubmission]);

  const submissionsByDay = useMemo(() => {
    const entries = new Map<number, MissionSubmission>();
    (data?.submissions || []).forEach((submission) => {
      entries.set(submission.day, submission);
    });
    return entries;
  }, [data?.submissions]);

  const unlockedDays = useMemo(() => {
    return new Set<number>(
      DAY_GUIDES.filter((guide) => isChallengeDayUnlocked(guide.day, submissionsByDay)).map(
        (guide) => guide.day,
      ),
    );
  }, [submissionsByDay]);

  const activeGuide = DAY_GUIDES.find((item) => item.day === activeDay) || null;
  const activeSubmission = activeDay ? submissionsByDay.get(activeDay) : undefined;
  const challengeDiscountExpiresAt = useMemo(() => {
    const enrollment = data?.enrollment;
    if (
      !enrollment ||
      !["candidate", "granted"].includes(enrollment.discountStatus) ||
      enrollment.discountAmount <= 0
    ) {
      return null;
    }

    const updatedAt = new Date(enrollment.updatedAt).getTime();
    if (!Number.isFinite(updatedAt)) return null;
    return new Date(updatedAt + CHALLENGE_DISCOUNT_WINDOW_MS);
  }, [data?.enrollment]);
  const hasActiveChallengeDiscount = Boolean(
    challengeDiscountExpiresAt && challengeDiscountExpiresAt.getTime() > Date.now(),
  );
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
        if (selectedSubmissionIdRef.current === submissionId) {
          setCommentError(json.error || "댓글을 불러오지 못했습니다.");
          setComments([]);
        }
        return;
      }
      const nextComments = (json.comments || []) as ChallengeComment[];
      setCommentsBySubmissionId((prev) => ({
        ...prev,
        [submissionId]: nextComments,
      }));
      if (!options.silent && selectedSubmissionIdRef.current === submissionId) {
        setComments(nextComments);
      }
    } catch {
      if (options.silent) return;
      if (selectedSubmissionIdRef.current === submissionId) {
        setCommentError("댓글을 불러오지 못했습니다.");
        setComments([]);
      }
    } finally {
      if (!options.silent && selectedSubmissionIdRef.current === submissionId) {
        setCommentsLoading(false);
      }
    }
  }

  function openSubmission(submission: FeedSubmission) {
    selectedSubmissionIdRef.current = submission.id;
    setSelectedSubmission(submission);
    setSelectedNotice(false);
    setCommentDraft("");
    setEditingCommentId(null);
    setEditingCommentDraft("");
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

  function openNotice() {
    selectedSubmissionIdRef.current = null;
    setSelectedSubmission(null);
    setSelectedNotice(true);
    setComments([]);
    setCommentDraft("");
    setEditingCommentId(null);
    setEditingCommentDraft("");
    setCommentError(null);
    setCommentsLoading(false);
  }

  function closeSubmission() {
    selectedSubmissionIdRef.current = null;
    setSelectedSubmission(null);
    setSelectedNotice(false);
    setCommentsLoading(false);
    setEditingCommentId(null);
    setEditingCommentDraft("");
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
    if (!unlockedDays.has(day)) {
      return;
    }

    const guide = getGuide(day);
    const submission = submissionsByDay.get(day);
    setDay3MarketingConsent(day === 3 && hasDay3MarketingConsent(submission?.content));

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
    setDay3MarketingConsent(false);
  }

  async function submit(day: number) {
    const guide = getGuide(day);
    const draft = getDraft(day, guide.title);
    const autoTitle = getAutoSubmissionTitle(day, data?.enrollment || null);
    const submissionTitle = autoTitle || draft.title.trim();
    const rawSubmissionContent = draft.content.trim();
    const submissionContent = day === 3
      ? appendDay3MarketingConsent(draft.content)
      : draft.content;
    setError(null);

    if (submissionTitle.length < 2) {
      setError("게시글 제목을 입력해주세요.");
      return;
    }

    if (day === 3 && !day3MarketingConsent) {
      setError("3일차 인증은 후기/홍보 자료 활용 동의가 필요합니다.");
      return;
    }

    if (rawSubmissionContent.length < 10) {
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
          title: submissionTitle,
          content: submissionContent,
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
          enrollment: json.enrollment || prev.enrollment,
          submissions: [...withoutOwnDay, json.submission].sort((a, b) => a.day - b.day),
          feedSubmissions: nextFeed.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
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
    const targetSubmissionId = selectedSubmission.id;
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
          submissionId: targetSubmissionId,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCommentError(json.error || "댓글 저장에 실패했습니다.");
        return;
      }
      if (selectedSubmissionIdRef.current === targetSubmissionId) {
        setComments((prev) => [...prev, json.comment]);
      }
      setCommentsBySubmissionId((prev) => ({
        ...prev,
        [targetSubmissionId]: [...(prev[targetSubmissionId] || []), json.comment],
      }));
      if (selectedSubmissionIdRef.current === targetSubmissionId) {
        setCommentDraft("");
      }
    } catch {
      setCommentError("댓글 저장에 실패했습니다.");
    } finally {
      setSavingComment(false);
    }
  }

  function replaceCommentInState(nextComment: ChallengeComment) {
    if (selectedSubmissionIdRef.current === nextComment.submissionId) {
      setComments((prev) =>
        prev.map((comment) => (comment.id === nextComment.id ? nextComment : comment)),
      );
    }
    setCommentsBySubmissionId((prev) => {
      const current = prev[nextComment.submissionId] || [];
      return {
        ...prev,
        [nextComment.submissionId]: current.map((comment) =>
          comment.id === nextComment.id ? nextComment : comment,
        ),
      };
    });
  }

  function removeCommentFromState(submissionId: string, commentId: string) {
    if (selectedSubmissionIdRef.current === submissionId) {
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    }
    setCommentsBySubmissionId((prev) => ({
      ...prev,
      [submissionId]: (prev[submissionId] || []).filter((comment) => comment.id !== commentId),
    }));
  }

  function startEditComment(comment: ChallengeComment) {
    setCommentError(null);
    setEditingCommentId(comment.id);
    setEditingCommentDraft(comment.content);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditingCommentDraft("");
  }

  async function saveCommentEdit(comment: ChallengeComment) {
    const content = editingCommentDraft.trim();
    setCommentError(null);

    if (!content) {
      setCommentError("댓글 내용을 입력해주세요.");
      return;
    }

    setUpdatingCommentId(comment.id);
    try {
      const res = await fetch("/api/challenge/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId: comment.id,
          content,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCommentError(json.error || "댓글 수정에 실패했습니다.");
        return;
      }

      replaceCommentInState(json.comment as ChallengeComment);
      cancelEditComment();
    } catch {
      setCommentError("댓글 수정에 실패했습니다.");
    } finally {
      setUpdatingCommentId(null);
    }
  }

  async function deleteComment(comment: ChallengeComment) {
    if (!selectedSubmission) return;
    const targetSubmissionId = selectedSubmission.id;
    if (!window.confirm("댓글을 삭제할까요?")) return;

    setCommentError(null);
    setDeletingCommentId(comment.id);
    try {
      const res = await fetch(`/api/challenge/comments?commentId=${comment.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (!res.ok) {
        setCommentError(json.error || "댓글 삭제에 실패했습니다.");
        return;
      }

      removeCommentFromState(targetSubmissionId, comment.id);
      if (editingCommentId === comment.id) {
        cancelEditComment();
      }
    } catch {
      setCommentError("댓글 삭제에 실패했습니다.");
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function deleteSubmission(submission: FeedSubmission) {
    if (!data?.canManage) return;
    if (!window.confirm("이 인증글을 삭제할까요?")) return;

    setError(null);
    setDeletingSubmissionId(submission.id);
    try {
      const res = await fetch(`/api/challenge?submissionId=${submission.id}`, {
        method: "DELETE",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "인증글 삭제에 실패했습니다.");
        return;
      }

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: prev.submissions.filter((item) => item.id !== submission.id),
          feedSubmissions: prev.feedSubmissions.filter((item) => item.id !== submission.id),
        };
      });
      setCommentsBySubmissionId((prev) => {
        const next = { ...prev };
        delete next[submission.id];
        return next;
      });
      closeSubmission();
    } catch {
      setError("인증글 삭제에 실패했습니다.");
    } finally {
      setDeletingSubmissionId(null);
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
  const missionTasks = [
    {
      day: 1,
      label: "1일차",
      title: "채널 방향 잡기",
      description: "VOD 04를 보고 내 쇼핑 쇼츠 채널 방향을 정리합니다.",
      actionLabel: "VOD 04 보기",
      href: "/dashboard/lectures/vod_04",
      submitLabel: "1차 인증 작성",
    },
    {
      day: 2,
      label: "2일차",
      title: "소재 후보 찾기",
      description: "VOD 08을 보고 내 채널에 맞는 상품/소재 후보 3개를 뽑습니다.",
      actionLabel: "VOD 08 보기",
      href: "/dashboard/lectures/vod_08",
      submitLabel: "2차 인증 작성",
    },
    {
      day: 3,
      label: "3일차",
      title: "첫 스크립트 만들기",
      description: "FlowSpot으로 첫 쇼핑 쇼츠 스크립트를 만들고 결과를 제출합니다.",
      actionLabel: "FlowSpot 열기",
      href: "/dashboard/batch",
      submitLabel: "3차 인증 작성",
    },
  ];
  const activeAutoTitle = activeDay ? getAutoSubmissionTitle(activeDay, data.enrollment) : "";

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

        {completedCount >= 3 && (
          <Card radius={8} p={{ base: "md", sm: "lg" }} withBorder bg={BRAND.softer}>
            <Group justify="space-between" align="center" gap="md">
              <Box>
                <Badge color="violet" variant="filled" radius={2} mb="xs">
                  챌린지 수료 완료
                </Badge>
                <Title order={3} fz={{ base: 19, sm: 22 }}>
                  3일 미션을 끝까지 완료했습니다.
                </Title>
                <Text size="sm" c="gray.7" mt={6}>
                  {hasActiveChallengeDiscount && challengeDiscountExpiresAt
                    ? `완료자 전용 추가 ${data.enrollment.discountAmount.toLocaleString(
                        "ko-KR",
                      )}원 할인이 ${challengeDiscountExpiresAt.toLocaleString("ko-KR", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}까지 열려 있습니다.`
                    : "완료자 할인 기간이 종료되었습니다."}
                </Text>
              </Box>
              {hasActiveChallengeDiscount && (
                <Button
                  component={Link}
                  href={CHALLENGE_DISCOUNT_CHECKOUT_URL}
                  color="violet"
                  radius={4}
                  rightSection={<ExternalLink size={16} />}
                  style={{ background: BRAND.primary, flexShrink: 0 }}
                >
                  수료 완료 후 할인받기
                </Button>
              )}
            </Group>
          </Card>
        )}

        <Card radius={8} p={{ base: "md", sm: "lg" }} withBorder>
          <Group justify="space-between" align="flex-end" gap="sm" mb="md">
            <Box>
              <Title order={3} fz={{ base: 18, sm: 20 }}>
                오늘 할 일
              </Title>
              <Text size="sm" c="gray.6" mt={4}>
                강의 시청, FlowSpot 실습, 인증글 작성까지 여기서 바로 이어갑니다.
              </Text>
            </Box>
            <Badge color="violet" variant="light" radius={2}>
              {completedCount}/3 완료
            </Badge>
          </Group>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="sm">
            {missionTasks.map((task) => {
              const submission = submissionsByDay.get(task.day);
              const status = getStatus(submission);
              const unlocked = unlockedDays.has(task.day);
              return (
                <Box
                  key={task.day}
                  style={{
                    padding: "var(--mantine-spacing-md)",
                    borderRadius: 8,
                    border: `1px solid ${submission ? BRAND.border : BRAND.line}`,
                    background: submission ? BRAND.soft : "#fff",
                  }}
                >
                  <Stack gap="sm">
                    <Group justify="space-between" gap="xs" wrap="nowrap">
                      <Badge color="violet" variant="light" radius={2}>
                        {task.label}
                      </Badge>
                      <Badge color={status.color} variant="light" radius={2}>
                        {status.label}
                      </Badge>
                    </Group>
                    <Box>
                      <Text fw={800} size="sm">
                        {task.title}
                      </Text>
                      <Text size="xs" c="gray.6" mt={4} lh={1.5}>
                        {task.description}
                      </Text>
                    </Box>
                    <Group gap={6} wrap="nowrap">
                      {unlocked ? (
                        <Button
                          component={Link}
                          href={task.href}
                          prefetch={false}
                          size="xs"
                          color="violet"
                          variant="light"
                          radius={4}
                          style={{ flex: 1 }}
                        >
                          {task.actionLabel}
                        </Button>
                      ) : (
                        <Button
                          size="xs"
                          color="gray"
                          variant="light"
                          radius={4}
                          disabled
                          style={{ flex: 1 }}
                        >
                          {task.actionLabel}
                        </Button>
                      )}
                      <Button
                        size="xs"
                        color="violet"
                        variant={submission ? "light" : "filled"}
                        radius={4}
                        onClick={() => openComposer(task.day)}
                        disabled={!data.canSubmit || !unlocked}
                        style={{ flex: 1, background: !submission && unlocked ? BRAND.primary : undefined }}
                      >
                        {submission ? "인증 수정" : task.submitLabel}
                      </Button>
                    </Group>
                  </Stack>
                </Box>
              );
            })}
          </SimpleGrid>
        </Card>

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
                {selectedSubmission || selectedNotice ? (
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
            {!selectedSubmission && !selectedNotice && (
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
                const unlocked = unlockedDays.has(guide.day);
                return (
                  <Button
                    key={guide.day}
                    size="xs"
                    variant={submission ? "light" : "outline"}
                    color={submission ? "violet" : "gray"}
                    radius={4}
                    onClick={() => openComposer(guide.day)}
                    disabled={!unlocked}
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

          {selectedNotice ? (
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
                  <Badge color="violet" variant="light" radius={2}>공지</Badge>
                  <Badge color="gray" variant="outline" radius={2}>고정</Badge>
                </Group>

                <Title order={2} fz={{ base: 20, sm: 26 }}>
                  원초적 인사이트 3일 쇼핑 쇼츠 채널 기획 챌린지 진행 안내
                </Title>
                <Group gap={6} mt={10}>
                  <UserRound size={14} color={BRAND.muted} />
                  <Text size="sm" c="gray.6">운영자</Text>
                  <Text size="sm" c="gray.5">·</Text>
                  <Text size="sm" c="gray.6">고정 공지</Text>
                </Group>

                <Divider my="lg" />

                <Stack gap="lg">
                  {NOTICE_SECTIONS.map((section) => (
                    <Box key={section.title}>
                      <Text fw={900} size="md" mb="xs">
                        {section.title}
                      </Text>
                      <Stack gap={6}>
                        {section.items.map((item) => (
                          <Group key={item} gap="xs" align="flex-start" wrap="nowrap">
                            <Text c="violet" fw={900} lh={1.6}>•</Text>
                            <Text size="sm" lh={1.7}>{item}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  ))}
                </Stack>

                <Group mt="xl">
                  <Button
                    component="a"
                    href={CHALLENGE_GUIDE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="violet"
                    radius={4}
                    rightSection={<ExternalLink size={16} />}
                    style={{ background: BRAND.primary }}
                  >
                    노션 진행 안내서 열기
                  </Button>
                </Group>
              </Box>
            </Box>
          ) : selectedSubmission ? (
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
                  <Text size="sm" c="gray.6">{formatDateTime(selectedSubmission.createdAt)}</Text>
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

                {(selectedSubmission.isMine || data.canManage) && (
                  <Group justify="flex-end" mt="lg">
                    {data.canManage && (
                      <Button
                        variant="light"
                        color="red"
                        radius={4}
                        leftSection={<Trash2 size={16} />}
                        loading={deletingSubmissionId === selectedSubmission.id}
                        onClick={() => deleteSubmission(selectedSubmission)}
                      >
                        삭제
                      </Button>
                    )}
                    {selectedSubmission.isMine && (
                      <Button
                        variant="light"
                        color="violet"
                        radius={4}
                        leftSection={<PencilLine size={16} />}
                        onClick={() => openComposer(selectedSubmission.day)}
                      >
                        수정하기
                      </Button>
                    )}
                  </Group>
                )}
              </Box>

              <Divider />

              <Box px={{ base: "md", sm: "lg" }} py="lg" bg={BRAND.softer}>
                <Group gap="xs" mb="md">
                  <MessageCircle size={17} color={BRAND.primary} />
                  <Text fw={900}>댓글 {visibleComments.length}</Text>
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
                ) : visibleComments.length === 0 ? (
                  <Text size="sm" c="gray.6" mb="md">
                    아직 댓글이 없습니다. 첫 댓글을 남겨보세요.
                  </Text>
                ) : (
                  <Stack gap="xs" mb="md">
                    {visibleComments.map((comment) => (
                      <Box
                        key={comment.id}
                        p="sm"
                        style={{
                          border: "1px solid #e4e7ec",
                          borderRadius: 4,
                          background: "#fff",
                        }}
                      >
                        <Group justify="space-between" align="flex-start" gap="xs" mb={4}>
                          <Group gap={6}>
                            <Text size="sm" fw={800}>{comment.authorLabel}</Text>
                            {comment.isMine && <Badge size="xs" color="violet" variant="light" radius={2}>내 댓글</Badge>}
                            <Text size="xs" c="gray.5">·</Text>
                            <Text size="xs" c="gray.5">{formatDateTime(comment.createdAt)}</Text>
                            {comment.updatedAt !== comment.createdAt && (
                              <Text size="xs" c="gray.5">수정됨</Text>
                            )}
                          </Group>
                          {comment.isMine && editingCommentId !== comment.id && (
                            <Group gap={4}>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="gray"
                                leftSection={<PencilLine size={12} />}
                                onClick={() => startEditComment(comment)}
                              >
                                수정
                              </Button>
                              <Button
                                size="compact-xs"
                                variant="subtle"
                                color="red"
                                leftSection={<Trash2 size={12} />}
                                loading={deletingCommentId === comment.id}
                                onClick={() => deleteComment(comment)}
                              >
                                삭제
                              </Button>
                            </Group>
                          )}
                        </Group>
                        {editingCommentId === comment.id ? (
                          <Stack gap="xs">
                            <Textarea
                              value={editingCommentDraft}
                              onChange={(event) => setEditingCommentDraft(event.currentTarget.value)}
                              autosize
                              minRows={2}
                              maxRows={8}
                              maxLength={COMMENT_MAX_LENGTH}
                              disabled={updatingCommentId === comment.id}
                            />
                            <Group justify="space-between" gap={6} align="center">
                              <Text
                                size="xs"
                                c={editingCommentDraft.length >= COMMENT_MAX_LENGTH ? "red.6" : "gray.5"}
                              >
                                {editingCommentDraft.length.toLocaleString("ko-KR")} /{" "}
                                {COMMENT_MAX_LENGTH.toLocaleString("ko-KR")}자
                              </Text>
                              <Group gap={6}>
                                <Button size="xs" variant="light" color="gray" radius={4} onClick={cancelEditComment}>
                                  취소
                                </Button>
                                <Button
                                  size="xs"
                                  color="violet"
                                  radius={4}
                                  loading={updatingCommentId === comment.id}
                                  onClick={() => saveCommentEdit(comment)}
                                  style={{ background: BRAND.primary }}
                                >
                                  수정 완료
                                </Button>
                              </Group>
                            </Group>
                          </Stack>
                        ) : (
                          <Text size="sm" style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>
                            {comment.content}
                          </Text>
                        )}
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
                  maxLength={COMMENT_MAX_LENGTH}
                  disabled={!data.canComment}
                />
                <Group justify="space-between" mt="sm" align="flex-start" gap="sm">
                  <Box>
                    <Text size="xs" c="gray.6">
                      질문, 응원, 개선 피드백을 짧게 남길 수 있습니다.
                    </Text>
                    <Text
                      size="xs"
                      c={commentDraft.length >= COMMENT_MAX_LENGTH ? "red.6" : "gray.5"}
                      mt={2}
                    >
                      {commentDraft.length.toLocaleString("ko-KR")} /{" "}
                      {COMMENT_MAX_LENGTH.toLocaleString("ko-KR")}자
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    color="violet"
                    radius={4}
                    loading={savingComment}
                    disabled={!data.canComment}
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
                    <Table.Tr onClick={openNotice} style={{ cursor: "pointer", background: BRAND.softer }}>
                      <Table.Td>
                        <Badge color="violet" variant="light" radius={2}>공지</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700} c="gray.8">
                          처음 오셨다면 클릭해서 챌린지 진행 순서와 권한 오픈 기준을 확인해주세요.
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.7">운영자</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="gray.6">고정</Text>
                      </Table.Td>
                    </Table.Tr>
                    <Table.Tr style={{ display: "none" }}>
                      <Table.Td>
                        <Badge color="violet" variant="light" radius={2}>공지</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={700} c="gray.8">
                          글쓰기에서 미션 인증 또는 질문 말머리를 선택하면 맞춤 양식이 열립니다.
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
                              {formatDate(submission.createdAt)}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Box>

              <Stack hiddenFrom="sm" gap={0}>
                <UnstyledButton onClick={openNotice} style={{ width: "100%", textAlign: "left" }}>
                  <Box px="md" py="sm" bg={BRAND.softer}>
                    <Group gap="xs" wrap="nowrap">
                      <Badge color="violet" variant="light" radius={2}>공지</Badge>
                      <Text size="sm" fw={700} c="gray.8">
                        처음 오셨다면 클릭해서 진행 순서와 권한 오픈 기준을 확인해주세요.
                      </Text>
                    </Group>
                  </Box>
                </UnstyledButton>
                <Box px="md" py="sm" bg={BRAND.softer} style={{ display: "none" }}>
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
                              {formatDate(submission.createdAt)}
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
                const unlocked = unlockedDays.has(guide.day);
                return (
                  <UnstyledButton
                    key={guide.day}
                    onClick={() => selectGuide(guide.day)}
                    disabled={!unlocked}
                    style={{
                      border: `1px solid ${selected ? BRAND.primary : BRAND.line}`,
                      borderRadius: 4,
                      background: selected ? BRAND.soft : "#fff",
                      padding: 12,
                      cursor: unlocked ? "pointer" : "not-allowed",
                      opacity: unlocked ? 1 : 0.45,
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

              {activeAutoTitle ? (
                <Box>
                  <Text size="sm" fw={500} mb={4}>
                    제목
                  </Text>
                  <Box
                    p="sm"
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 4,
                      background: "#f9fafb",
                    }}
                  >
                    <Text size="sm" fw={800}>
                      {activeAutoTitle}
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      인증글 제목은 기수, 일차, 작성자 표시명으로 자동 생성됩니다.
                    </Text>
                  </Box>
                </Box>
              ) : (
                <TextInput
                  label="제목"
                  value={getDraft(activeDay, activeGuide.title).title}
                  onChange={(event) => updateDraft(activeDay, { title: event.currentTarget.value })}
                  disabled={!data.canSubmit}
                  maxLength={120}
                />
              )}

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

              {activeDay === 3 && (
                <Checkbox
                  checked={day3MarketingConsent}
                  onChange={(event) => setDay3MarketingConsent(event.currentTarget.checked)}
                  disabled={!data.canSubmit}
                  label="[필수] 제출한 별점과 후기는 익명 처리 후 FlowSpot 후기/홍보 자료로 활용될 수 있습니다."
                />
              )}

              <TextInput
                label="참고 링크 (본인/운영자만 확인)"
                description="다른 참여자에게 공개되지 않습니다. 영상 피드백을 받고 싶다면 제작한 쇼츠 영상 링크를 여기에 넣어주세요."
                placeholder="https://..."
                value={getDraft(activeDay, activeGuide.title).referenceUrl}
                onChange={(event) => updateDraft(activeDay, { referenceUrl: event.currentTarget.value })}
                disabled={!data.canSubmit}
                maxLength={500}
              />

              <Group justify="space-between">
                <Group gap="sm">
                  {activeGuide.actions.map((action) =>
                    "external" in action && action.external ? (
                      <Anchor
                        key={action.label}
                        href={action.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        c="violet"
                      >
                        {action.label}
                      </Anchor>
                    ) : (
                      <Anchor
                        key={action.label}
                        component={Link}
                        href={action.href}
                        size="sm"
                        c="violet"
                      >
                        {action.label}
                      </Anchor>
                    ),
                  )}
                </Group>
                <Button
                  color="violet"
                  radius={4}
                  loading={savingDay === activeDay}
                  disabled={!data.canSubmit}
                  onClick={() => submit(activeDay)}
                  rightSection={<Send size={16} />}
                  style={{ background: BRAND.primary }}
                >
                  {activeSubmission
                    ? activeDay === 3
                      ? "수료 내용 수정"
                      : "수정 저장"
                    : activeDay === 3
                      ? "수료 완료 후 할인받기"
                      : "등록"}
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Container>
  );
}
