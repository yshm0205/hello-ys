"use client";

import { useEffect, useState } from "react";
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
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { ArrowLeft, CheckCircle2, Clock, FileText, Inbox, Send, Ticket } from "lucide-react";

import { Link } from "@/i18n/routing";

type FeedbackRequest = {
  id: string;
  requestType: string;
  title: string;
  description: string;
  referenceUrl: string | null;
  status: string;
  adminResponse: string | null;
  respondedAt: string | null;
  closedAt: string | null;
  createdAt: string;
};

type ReviewSummary = {
  id: string;
  feedbackTicketsGranted: number;
  feedbackTicketsRemaining: number;
};

const TYPE_LABELS: Record<string, string> = {
  channel: "채널 방향",
  topic: "주제 기획",
  script: "스크립트",
  other: "기타",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  submitted: { label: "접수됨", color: "violet" },
  in_progress: { label: "검토 중", color: "blue" },
  answered: { label: "답변 완료", color: "green" },
  closed: { label: "종료", color: "gray" },
  rejected: { label: "반려", color: "red" },
};

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function FeedbackRequestContent() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewSummary | null>(null);
  const [requests, setRequests] = useState<FeedbackRequest[]>([]);

  const [requestType, setRequestType] = useState<string | null>("script");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/feedback-requests", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setReview(data.review);
        setRequests(data.requests || []);
      } else {
        setError(data.error || "피드백 정보를 불러오지 못했습니다.");
      }
    } catch {
      setError("피드백 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit() {
    setError(null);
    if (!requestType) {
      setError("요청 유형을 선택해주세요.");
      return;
    }
    if (title.trim().length < 2) {
      setError("제목을 2자 이상 입력해주세요.");
      return;
    }
    if (description.trim().length < 30) {
      setError("요청 내용을 30자 이상 작성해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, title, description, referenceUrl }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "피드백 요청 제출에 실패했습니다.");
        return;
      }

      setRequests((prev) => [data.request, ...prev]);
      setReview((prev) =>
        prev ? { ...prev, feedbackTicketsRemaining: data.feedbackTicketsRemaining } : prev,
      );
      setTitle("");
      setDescription("");
      setReferenceUrl("");
      setRequestType("script");
    } catch {
      setError("피드백 요청 제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader color="violet" />
          <Text c="gray.6">피드백 정보를 불러오는 중...</Text>
        </Group>
      </Container>
    );
  }

  const remaining = review?.feedbackTicketsRemaining ?? 0;
  const canSubmit = !!review && remaining > 0;

  return (
    <Container size="md" py="lg">
      <Stack gap="lg">
        <Box>
          <Anchor component={Link} href="/dashboard/review" size="sm" c="gray.6">
            <Group gap={4} style={{ display: "inline-flex" }}>
              <ArrowLeft size={14} />
              후기 혜택 페이지로
            </Group>
          </Anchor>
        </Box>

        <Card
          radius="xl"
          p="xl"
          style={{
            border: "1px solid rgba(139, 92, 246, 0.2)",
            background:
              "radial-gradient(circle at top left, rgba(139, 92, 246, 0.14), transparent 32%), linear-gradient(135deg, #ffffff, #fff7ed)",
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Badge color="violet" radius="xl" mb="sm">
                1:1 피드백 요청
              </Badge>
              <Title order={2}>피드백권으로 운영진 검토 받기</Title>
              <Text c="gray.6" mt="xs">
                채널 방향, 주제, 스크립트에 대해 자세한 검토를 요청할 수 있습니다. 제출하시면 접수
                알림을 받고, 24~48시간 내 이메일 또는 채널톡으로 답변드립니다.
              </Text>
            </Box>
            <ThemeIcon size={56} radius="xl" color="violet" variant="light">
              <Ticket size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        {!review && (
          <Alert color="yellow" variant="light" icon={<Inbox size={16} />}>
            <Text fw={600} size="sm">
              수강 후기를 먼저 남기면 피드백권 3회가 활성화됩니다.
            </Text>
            <Anchor component={Link} href="/dashboard/review" size="sm">
              후기 이벤트 페이지로 이동 →
            </Anchor>
          </Alert>
        )}

        {review && (
          <Card radius="lg" p="lg" withBorder>
            <Group justify="space-between" align="center">
              <Group gap="sm">
                <ThemeIcon color={remaining > 0 ? "violet" : "gray"} variant="light" size={42} radius="xl">
                  <Ticket size={20} />
                </ThemeIcon>
                <Box>
                  <Text fw={700}>
                    남은 피드백권 {remaining}회 / 총 {review.feedbackTicketsGranted}회
                  </Text>
                  <Text size="sm" c="gray.6">
                    제출 시 1회 차감됩니다. 소진 시까지 유효해요.
                  </Text>
                </Box>
              </Group>
            </Group>
          </Card>
        )}

        <Card radius="lg" p="xl" withBorder>
          <Stack gap="md">
            <Title order={4}>새 피드백 요청</Title>
            {error && (
              <Alert color="red" variant="light">
                {error}
              </Alert>
            )}

            <Select
              label="요청 유형"
              value={requestType}
              onChange={setRequestType}
              data={[
                { value: "channel", label: "채널 방향 (컨셉, 타겟, 차별화)" },
                { value: "topic", label: "주제 기획 (아이디어, 훅, 소재)" },
                { value: "script", label: "스크립트 (훅·바디 전체 검토)" },
                { value: "other", label: "기타" },
              ]}
              allowDeselect={false}
              disabled={!canSubmit}
            />

            <TextInput
              label="제목"
              placeholder="예) 새 채널 컨셉 피드백 요청"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              maxLength={120}
              disabled={!canSubmit}
            />

            <Textarea
              label="요청 내용"
              description="최소 30자 이상. 배경, 현재 고민, 원하는 피드백 방향을 구체적으로 적어주세요."
              placeholder={
                "예) 현재 요리 쇼츠 채널을 운영 중인데, 조회수가 1000 내외에서 정체되고 있습니다. 타겟 오디언스를 20대 자취생으로 좁힐지, 기존처럼 폭넓게 갈지 고민입니다. 최근 3개 영상 링크를 첨부합니다."
              }
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              autosize
              minRows={6}
              maxRows={14}
              maxLength={3000}
              disabled={!canSubmit}
            />

            <TextInput
              label="참고 링크 (선택)"
              placeholder="https:// ... (스크립트 문서, 영상 URL, 채널 링크 등)"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.currentTarget.value)}
              maxLength={500}
              disabled={!canSubmit}
            />

            <Group justify="space-between" align="center">
              <Text size="xs" c="gray.5">
                제출 즉시 피드백권 1회가 차감됩니다.
              </Text>
              <Button
                color="violet"
                radius="xl"
                loading={submitting}
                disabled={!canSubmit}
                onClick={submit}
                rightSection={<Send size={16} />}
              >
                피드백 요청 제출
              </Button>
            </Group>
          </Stack>
        </Card>

        <Divider label="내 피드백 요청 내역" labelPosition="center" />

        {requests.length === 0 ? (
          <Card radius="lg" p="xl" withBorder>
            <Group justify="center" gap="xs" c="gray.6">
              <Inbox size={18} />
              <Text size="sm">아직 제출한 피드백 요청이 없습니다.</Text>
            </Group>
          </Card>
        ) : (
          <Stack gap="sm">
            {requests.map((req) => {
              const status = STATUS_LABELS[req.status] || { label: req.status, color: "gray" };
              return (
                <Card key={req.id} radius="lg" p="lg" withBorder>
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Box style={{ flex: 1 }}>
                      <Group gap="xs" mb={6}>
                        <Badge color={status.color} variant="light" size="sm">
                          {status.label}
                        </Badge>
                        <Badge color="gray" variant="outline" size="sm">
                          {TYPE_LABELS[req.requestType] || req.requestType}
                        </Badge>
                        <Text size="xs" c="gray.5">
                          <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                          {formatDate(req.createdAt)}
                        </Text>
                      </Group>
                      <Text fw={600}>{req.title}</Text>
                      <Text size="sm" c="gray.7" mt={4} style={{ whiteSpace: "pre-wrap" }}>
                        {req.description}
                      </Text>
                      {req.referenceUrl && (
                        <Anchor
                          href={req.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="xs"
                          mt={6}
                        >
                          <Group gap={4} style={{ display: "inline-flex" }}>
                            <FileText size={12} />
                            {req.referenceUrl}
                          </Group>
                        </Anchor>
                      )}
                      {req.adminResponse && (
                        <Box
                          mt="md"
                          p="sm"
                          style={{
                            background: "rgba(22, 163, 74, 0.06)",
                            border: "1px solid rgba(22, 163, 74, 0.2)",
                            borderRadius: 10,
                          }}
                        >
                          <Group gap="xs" mb={4}>
                            <CheckCircle2 size={14} color="#16a34a" />
                            <Text size="xs" fw={600} c="green.7">
                              운영진 답변 · {formatDate(req.respondedAt)}
                            </Text>
                          </Group>
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {req.adminResponse}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
