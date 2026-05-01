"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Alert,
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Group,
  Loader,
  Rating,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { CheckCircle2, Gift, MessageCircle, Send, Sparkles, Star, Ticket } from "lucide-react";

import { ReviewCelebrationModal } from "./ReviewCelebrationModal";

type SubmittedReview = {
  id: string;
  rating: number;
  headline: string | null;
  content: string;
  channelName: string | null;
  status: string;
  feedbackTicketsGranted: number;
  feedbackTicketsRemaining: number;
  monthlyDrawEligible: boolean;
  createdAt: string;
};

type ReviewEligibility = {
  canSubmit: boolean;
  windowClosed: boolean;
  daysLeft: number;
  vodsCompleted: number;
  vodThreshold: number;
  windowDays: number;
};

const benefits = [
  {
    icon: MessageCircle,
    title: "비밀 카톡방 초대",
    description:
      "작은 단톡방에서 수강생들과 직접 소통하고, 운영진에게 바로 질문할 수 있습니다.",
  },
  {
    icon: Sparkles,
    title: "업데이트 주제 얼리액세스",
    description:
      "새 강의·툴 업데이트를 먼저 체험하고 원하는 내용을 제안할 수 있습니다.",
  },
  {
    icon: Ticket,
    title: "1:1 피드백권 3회",
    description:
      "작성한 스크립트/기획을 운영진이 직접 검토해드립니다. (이용권 기간 내 사용)",
  },
  {
    icon: Star,
    title: "월 1명 400크레딧 추첨",
    description:
      "후기 제출자 전원 자동 응모. 매달 1명을 뽑아 400크레딧(₩39,000 상당)을 지급합니다.",
  },
];

export function ReviewEventContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<SubmittedReview | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [kakaoInviteUrl, setKakaoInviteUrl] = useState<string | null>(null);
  const [kakaoInvitePassword, setKakaoInvitePassword] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [channelName, setChannelName] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "celebration";

  // 미리보기 모드 — ?preview=celebration 으로 축하 모달 확인
  useEffect(() => {
    if (isPreview) {
      setKakaoInviteUrl("https://open.kakao.com/o/g9CeeMri");
      setKakaoInvitePassword("00001111");
      setCelebrationOpen(true);
    }
  }, [isPreview]);

  useEffect(() => {
    let ignore = false;

    async function loadReview() {
      try {
        const [reviewRes, eligibilityRes] = await Promise.all([
          fetch("/api/reviews", { cache: "no-store" }),
          fetch("/api/reviews/eligibility", { cache: "no-store" }),
        ]);
        const data = await reviewRes.json();
        const eligibilityData = await eligibilityRes.json().catch(() => null);
        if (ignore) return;

        if (eligibilityData) {
          setEligibility({
            canSubmit: Boolean(eligibilityData.canSubmit),
            windowClosed: Boolean(eligibilityData.windowClosed),
            daysLeft: Number(eligibilityData.daysLeft ?? 0),
            vodsCompleted: Number(eligibilityData.vodsCompleted ?? 0),
            vodThreshold: Number(eligibilityData.vodThreshold ?? 0),
            windowDays: Number(eligibilityData.windowDays ?? 7),
          });
        }

        if (reviewRes.ok) {
          setReview(data.review || null);
          // 미리보기 모드에서는 하드코딩된 카카오 값 유지
          if (!isPreview) {
            setKakaoInviteUrl(data.kakaoInviteUrl || null);
            setKakaoInvitePassword(data.kakaoInvitePassword || null);
          }
        } else {
          setError(data.error || "후기 이벤트 정보를 불러오지 못했습니다.");
        }
      } catch {
        if (!ignore) setError("후기 이벤트 정보를 불러오지 못했습니다.");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadReview();
    return () => {
      ignore = true;
    };
  }, [isPreview]);

  const reviewLocked = !review && !!eligibility && eligibility.windowClosed;

  async function submitReview() {
    setError(null);

    if (content.trim().length < 30) {
      setError("후기는 최소 30자 이상 작성해주세요.");
      return;
    }

    if (!marketingConsent) {
      setError("후기 이벤트 혜택을 받으려면 익명 마케팅 활용 동의가 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          headline,
          content,
          channelName,
          proofUrl,
          marketingConsent,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "후기 제출에 실패했습니다.");
        if (data.review) {
          setReview(data.review);
          setKakaoInviteUrl(data.kakaoInviteUrl || null);
          setKakaoInvitePassword(data.kakaoInvitePassword || null);
        }
        return;
      }

      setReview(data.review);
      setKakaoInviteUrl(data.kakaoInviteUrl || null);
      setKakaoInvitePassword(data.kakaoInvitePassword || null);
      setCelebrationOpen(true);
    } catch {
      setError("후기 제출에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Container size="md" py="xl">
        <Group justify="center" py="xl">
          <Loader color="violet" />
          <Text c="gray.6">후기 이벤트 정보를 불러오는 중...</Text>
        </Group>
      </Container>
    );
  }

  return (
    <Container size="lg" py="lg">
      <ReviewCelebrationModal
        opened={celebrationOpen}
        onClose={() => setCelebrationOpen(false)}
        kakaoInviteUrl={kakaoInviteUrl}
        kakaoInvitePassword={kakaoInvitePassword}
        feedbackTicketsRemaining={review?.feedbackTicketsRemaining ?? 3}
        feedbackRequestUrl="/dashboard/feedback"
      />
      <Stack gap="lg">
        <Card
          radius="xl"
          p="xl"
          style={{
            border: "1px solid rgba(139, 92, 246, 0.2)",
            background:
              "radial-gradient(circle at top left, rgba(139, 92, 246, 0.18), transparent 32%), linear-gradient(135deg, #ffffff, #fff7ed)",
          }}
        >
          <Group justify="space-between" align="flex-start" gap="lg">
            <Box style={{ maxWidth: 720 }}>
              <Badge color="violet" radius="xl" mb="sm">
                구매자 전용 혜택
              </Badge>
              <Title order={2} style={{ color: "var(--mantine-color-text)" }}>
                혜택을 확인하고 편하게 후기 남겨주세요.
              </Title>
              <Text c="gray.6" mt="sm">
                강의를 전부 보지 않아도 괜찮습니다. 둘러본 첫인상, 기대되는 점, 좋았던 부분을
                짧게 남기면 구매자 전용 혜택이 열립니다.
              </Text>
            </Box>
            <ThemeIcon size={56} radius="xl" color="violet" variant="light">
              <Gift size={28} />
            </ThemeIcon>
          </Group>
        </Card>

        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {benefits.map((benefit) => (
            <Card key={benefit.title} radius="lg" p="lg" withBorder>
              <Group align="flex-start" gap="md" wrap="nowrap">
                <ThemeIcon color="violet" variant="light" radius="xl" size={42}>
                  <benefit.icon size={20} />
                </ThemeIcon>
                <Box>
                  <Text fw={700}>{benefit.title}</Text>
                  <Text size="sm" c="gray.6" mt={4}>
                    {benefit.description}
                  </Text>
                </Box>
              </Group>
            </Card>
          ))}
        </SimpleGrid>

        {review ? (
          <Card radius="lg" p="xl" withBorder>
            <Group gap="sm" mb="md">
              <CheckCircle2 size={22} color="#16a34a" />
              <Title order={3}>후기 제출 완료</Title>
            </Group>
            <Text c="gray.7">
              제출이 저장되었습니다. 피드백권 {review.feedbackTicketsGranted || 3}개와 월간 랜덤
              크레딧 추첨 대상이 기록되어 있습니다.
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mt="lg">
              <Badge color="green" variant="light" size="lg">
                피드백권 {review.feedbackTicketsRemaining ?? 3}개 사용 가능
              </Badge>
              <Badge color="violet" variant="light" size="lg">
                월 1명 400크레딧 추첨 응모
              </Badge>
              <Badge color="grape" variant="light" size="lg">
                업데이트 주제 얼리액세스
              </Badge>
              <Badge color="orange" variant="light" size="lg">
                비밀 카톡방 초대 대상
              </Badge>
            </SimpleGrid>
            {kakaoInviteUrl ? (
              <Stack gap="xs" mt="lg">
                <Button
                  component="a"
                  href={kakaoInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="yellow"
                  c="black"
                  leftSection={<MessageCircle size={16} />}
                >
                  비밀 카카오톡방 입장하기
                </Button>
                {kakaoInvitePassword && (
                  <Alert color="yellow" variant="light">
                    <Text size="sm" fw={600}>
                      입장 비밀번호: <span style={{ fontFamily: "monospace" }}>{kakaoInvitePassword}</span>
                    </Text>
                    <Text size="xs" c="gray.6" mt={4}>
                      오픈채팅 입장 시 위 비밀번호를 입력해주세요.
                    </Text>
                  </Alert>
                )}
              </Stack>
            ) : (
              <Alert color="violet" variant="light" mt="lg">
                카카오톡방 초대 링크는 운영진 확인 후 채널톡 또는 이메일로 안내됩니다.
              </Alert>
            )}
          </Card>
        ) : reviewLocked ? (
          <Card radius="lg" p="xl" withBorder>
            <Stack gap="md">
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              <Group justify="space-between" align="flex-start" gap="md">
                <Box>
                  <Text fw={700} size="lg">
                    후기 이벤트 기간이 종료되었습니다
                  </Text>
                  <Text size="sm" c="gray.6" mt={6}>
                    결제 후 {eligibility?.windowDays ?? 14}일 동안만 후기 이벤트에 참여할 수 있습니다.
                  </Text>
                </Box>
                <Badge color="gray" variant="light" size="lg">
                  참여 종료
                </Badge>
              </Group>
            </Stack>
          </Card>
        ) : (
          <Card radius="lg" p="xl" withBorder>
            <Stack gap="md">
              {error && (
                <Alert color="red" variant="light">
                  {error}
                </Alert>
              )}

              <Group justify="space-between" align="center">
                <Box>
                  <Text fw={700} size="lg">
                    후기 남기고 혜택 받기
                  </Text>
                  <Text size="sm" c="gray.6">
                    강의를 둘러본 첫인상, 기대되는 점, 좋았던 부분만 간단히 남겨도 괜찮습니다.
                  </Text>
                </Box>
                <Rating value={rating} onChange={setRating} size="lg" color="yellow" />
              </Group>

              <TextInput
                label="한 줄 요약"
                placeholder="예: 주제 찾는 시간이 확 줄었습니다"
                value={headline}
                onChange={(event) => setHeadline(event.currentTarget.value)}
                maxLength={80}
              />

              <Textarea
                label="후기 내용"
                description="최소 30자 이상 작성해주세요."
                placeholder="예) 아직 전부 보진 못했지만 구성과 자료가 기대 이상입니다. 특히 쇼츠 주제 잡기와 스크립트 흐름을 바로 적용해볼 수 있을 것 같아요."
                value={content}
                onChange={(event) => setContent(event.currentTarget.value)}
                autosize
                minRows={6}
                maxRows={12}
                maxLength={2500}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="채널명 또는 닉네임"
                  placeholder="선택 입력"
                  value={channelName}
                  onChange={(event) => setChannelName(event.currentTarget.value)}
                  maxLength={80}
                />
                <TextInput
                  label="작업물/채널 링크"
                  placeholder="선택 입력, https://..."
                  value={proofUrl}
                  onChange={(event) => setProofUrl(event.currentTarget.value)}
                  maxLength={300}
                />
              </SimpleGrid>

              <Checkbox
                checked={marketingConsent}
                onChange={(event) => setMarketingConsent(event.currentTarget.checked)}
                label="후기 내용이 익명 처리 후 랜딩/마케팅 소재로 활용될 수 있음에 동의합니다."
              />

              <Group justify="space-between" align="center">
                <Text size="xs" c="gray.5">
                  제출 후 수정이 필요하면 채널톡으로 요청해주세요.
                </Text>
                <Button
                  color="violet"
                  radius="xl"
                  loading={isSubmitting}
                  onClick={submitReview}
                  rightSection={<Send size={16} />}
                >
                  후기 제출하고 혜택 받기
                </Button>
              </Group>
            </Stack>
          </Card>
        )}

        <Text size="xs" c="gray.5" ta="center">
          피드백권 사용과 크레딧 추첨은 운영 정책에 따라 검수 후 제공됩니다. 문의는{" "}
          <Anchor href="/support">고객지원</Anchor> 또는 채널톡을 이용해주세요.
        </Text>
      </Stack>
    </Container>
  );
}
