"use client";

import { useEffect, useState } from "react";
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

const benefits = [
  {
    icon: MessageCircle,
    title: "수강생 비밀 카카오톡 단톡방 초대",
    description: "운영 팁, 질문, 공지, 업데이트 소식을 수강생끼리 빠르게 공유합니다.",
  },
  {
    icon: Sparkles,
    title: "추후 업데이트 주제 얼리액세스",
    description: "새 강의/툴 업데이트 주제를 먼저 보고 필요한 내용을 제안할 수 있습니다.",
  },
  {
    icon: Ticket,
    title: "피드백권 3개",
    description: "채널 방향, 주제, 스크립트에 대해 운영진 피드백을 요청할 수 있습니다.",
  },
  {
    icon: Star,
    title: "월마다 랜덤 크레딧 뽑기",
    description: "후기 제출자는 월간 랜덤 크레딧 추첨 대상에 자동 포함됩니다.",
  },
];

export function ReviewEventContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<SubmittedReview | null>(null);
  const [kakaoInviteUrl, setKakaoInviteUrl] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [headline, setHeadline] = useState("");
  const [content, setContent] = useState("");
  const [channelName, setChannelName] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadReview() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const data = await res.json();
        if (ignore) return;

        if (res.ok) {
          setReview(data.review || null);
          setKakaoInviteUrl(data.kakaoInviteUrl || null);
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
  }, []);

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
        }
        return;
      }

      setReview(data.review);
      setKakaoInviteUrl(data.kakaoInviteUrl || null);
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
                수강생 후기 이벤트
              </Badge>
              <Title order={2} style={{ color: "var(--mantine-color-text)" }}>
                후기를 남기면, 운영진이 혜택을 바로 연결합니다.
              </Title>
              <Text c="gray.6" mt="sm">
                외부 폼으로 나가지 않고 FlowSpot 안에서 제출됩니다. 제출된 후기는 운영진 검수 후
                익명 마케팅 소재와 서비스 개선에만 사용합니다.
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
                월간 크레딧 추첨 대상
              </Badge>
              <Badge color="grape" variant="light" size="lg">
                업데이트 얼리액세스 대상
              </Badge>
              <Badge color="orange" variant="light" size="lg">
                비밀 카톡방 초대 대상
              </Badge>
            </SimpleGrid>
            {kakaoInviteUrl ? (
              <Button
                component="a"
                href={kakaoInviteUrl}
                target="_blank"
                rel="noopener noreferrer"
                mt="lg"
                color="yellow"
                c="black"
                leftSection={<MessageCircle size={16} />}
              >
                비밀 카카오톡방 입장하기
              </Button>
            ) : (
              <Alert color="violet" variant="light" mt="lg">
                카카오톡방 초대 링크는 운영진 확인 후 채널톡 또는 이메일로 안내됩니다.
              </Alert>
            )}
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
                    수강 후기 작성
                  </Text>
                  <Text size="sm" c="gray.6">
                    어떤 점이 도움됐는지, 아쉬운 점은 무엇인지 솔직하게 남겨주세요.
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
                placeholder="수강 전 고민, 실제로 도움된 부분, 적용해본 결과를 적어주세요."
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
