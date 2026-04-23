"use client";

import { useState } from "react";
import {
  ActionIcon,
  Alert,
  Box,
  Button,
  CopyButton,
  Group,
  List,
  Modal,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import {
  Check,
  Copy,
  MessageCircle,
  PartyPopper,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";

import { Link } from "@/i18n/routing";

type Props = {
  opened: boolean;
  onClose: () => void;
  kakaoInviteUrl: string | null;
  kakaoInvitePassword: string | null;
  feedbackTicketsRemaining: number;
  feedbackRequestUrl?: string | null;
};

const checklist = [
  { icon: MessageCircle, label: "비밀 카톡방 초대" },
  { icon: Sparkles, label: "업데이트 주제 얼리액세스" },
  { icon: Ticket, label: "1:1 피드백권 3회" },
  { icon: Star, label: "월 1명 400크레딧 추첨 자동 응모" },
];

export function ReviewCelebrationModal({
  opened,
  onClose,
  kakaoInviteUrl,
  kakaoInvitePassword,
  feedbackTicketsRemaining,
  feedbackRequestUrl,
}: Props) {
  const [kakaoOpened, setKakaoOpened] = useState(false);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      fullScreen={false}
      radius="xl"
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.65, blur: 4 }}
      styles={{
        content: {
          background:
            "radial-gradient(circle at top, rgba(139, 92, 246, 0.15), transparent 50%), linear-gradient(180deg, #ffffff, #fff7ed)",
        },
        body: { padding: 24 },
      }}
    >
      <Stack align="center" gap="md" mt="xs">
        <ThemeIcon
          size={72}
          radius="xl"
          variant="gradient"
          gradient={{ from: "violet", to: "pink", deg: 135 }}
        >
          <PartyPopper size={36} />
        </ThemeIcon>

        <Title order={2} ta="center" style={{ lineHeight: 1.3 }}>
          혜택이 모두 활성화됐어요!
        </Title>
        <Text c="gray.6" ta="center" size="sm" maw={420}>
          후기 제출이 저장되었습니다. 아래 단계로 혜택을 지금 바로 사용하실 수 있어요.
        </Text>

        <Box
          w="100%"
          style={{
            background: "rgba(139, 92, 246, 0.06)",
            border: "1px solid rgba(139, 92, 246, 0.15)",
            borderRadius: 14,
            padding: 16,
          }}
        >
          <List
            spacing="xs"
            size="sm"
            icon={
              <ThemeIcon color="green" size={20} radius="xl">
                <Check size={12} />
              </ThemeIcon>
            }
          >
            {checklist.map((item) => (
              <List.Item key={item.label}>
                <Group gap={8} wrap="nowrap">
                  <item.icon size={15} color="#8b5cf6" />
                  <Text size="sm" fw={500}>
                    {item.label}
                  </Text>
                </Group>
              </List.Item>
            ))}
          </List>
        </Box>

        {kakaoInviteUrl ? (
          <Stack gap="xs" w="100%">
            <Button
              component="a"
              href={kakaoInviteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setKakaoOpened(true)}
              size="lg"
              radius="xl"
              color="yellow"
              c="black"
              fullWidth
              leftSection={<MessageCircle size={18} />}
            >
              {kakaoOpened ? "카톡방 다시 열기" : "비밀 카카오톡방 입장하기"}
            </Button>

            {kakaoInvitePassword && (
              <Alert color="yellow" variant="light" radius="lg">
                <Group justify="space-between" wrap="nowrap" gap="xs">
                  <Box>
                    <Text size="xs" c="gray.6" mb={2}>
                      입장 비밀번호
                    </Text>
                    <Text
                      fw={700}
                      size="lg"
                      style={{ fontFamily: "monospace", letterSpacing: "0.1em" }}
                    >
                      {kakaoInvitePassword}
                    </Text>
                  </Box>
                  <CopyButton value={kakaoInvitePassword}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? "복사됨" : "비밀번호 복사"}>
                        <ActionIcon
                          onClick={copy}
                          color={copied ? "green" : "yellow"}
                          variant="filled"
                          size="lg"
                          radius="md"
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Text size="xs" c="gray.6" mt={8}>
                  오픈채팅 입장 시 위 비밀번호를 입력해주세요.
                </Text>
              </Alert>
            )}
          </Stack>
        ) : (
          <Alert color="violet" variant="light" w="100%">
            카카오톡방 초대 링크는 운영진 확인 후 채널톡 또는 이메일로 안내됩니다.
          </Alert>
        )}

        {feedbackRequestUrl && (
          <Button
            component={Link}
            href={feedbackRequestUrl}
            prefetch={false}
            onClick={onClose}
            variant="light"
            color="violet"
            radius="xl"
            fullWidth
            leftSection={<Ticket size={16} />}
          >
            피드백권 신청하기 (남은 {feedbackTicketsRemaining}회)
          </Button>
        )}

        <Button variant="subtle" color="gray" radius="xl" onClick={onClose}>
          닫고 혜택 페이지 보기
        </Button>
      </Stack>
    </Modal>
  );
}
