"use client";

import { Badge, Box, Button, Card, Group, SimpleGrid, Text } from "@mantine/core";
import { Gift, MessageCircle, Sparkles, Star, Ticket } from "lucide-react";

import { Link } from "@/i18n/routing";

const benefits = [
  { icon: MessageCircle, label: "비밀 카톡방 초대" },
  { icon: Sparkles, label: "업데이트 주제 얼리액세스" },
  { icon: Ticket, label: "피드백권 3개" },
  { icon: Star, label: "월간 랜덤 크레딧 추첨" },
];

export function ReviewEventBanner() {
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
              리뷰 이벤트
            </Badge>
            <Text size="xs" c="gray.6" fw={600}>
              수강생 전용 혜택
            </Text>
          </Group>
          <Text fw={800} size="lg" style={{ color: "var(--mantine-color-text)" }}>
            후기를 남기면 운영진이 바로 확인하고 혜택을 연결해드려요.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={6} mt="sm">
            {benefits.map((benefit) => (
              <Group key={benefit.label} gap={7} wrap="nowrap">
                <benefit.icon size={15} color="#8b5cf6" />
                <Text size="sm" c="gray.7">
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
          leftSection={<Gift size={16} />}
        >
          후기 작성하기
        </Button>
      </Group>
    </Card>
  );
}
