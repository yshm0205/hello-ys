"use client";

import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  List,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { Apple, Download, Lock, Monitor, PlayCircle, ShieldAlert } from "lucide-react";

import { Link } from "@/i18n/routing";
import { TOPIC_PROGRAM_FILES } from "@/lib/programs/config";

export function ProgramsContent({ canDownload }: { canDownload: boolean }) {
  return (
    <Container size="lg" py="lg">
      <Stack gap="lg">
        <div>
          <Title order={2} style={{ color: "var(--mantine-color-text)" }}>
            프로그램 다운로드
          </Title>
          <Text size="sm" c="gray.6" mt={4}>
            강의에서 쓰는 수강생 전용 프로그램이에요.
          </Text>
        </div>

        <Card padding="lg" radius="xl" withBorder>
          <Group justify="space-between" align="flex-start" mb="md">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                <Download size={18} />
              </ThemeIcon>
              <div>
                <Text fw={600}>주제 선정 프로그램</Text>
                <Text size="sm" c="gray.6">
                  유튜브에서 반응 좋은 영상 주제를 빠르게 찾아주는 툴
                </Text>
              </div>
            </Group>
            <Button
              component={Link}
              href="/dashboard/lectures/vod_11"
              prefetch={false}
              variant="subtle"
              color="violet"
              radius="lg"
              size="sm"
              leftSection={<PlayCircle size={16} />}
            >
              사용법 강의 보기
            </Button>
          </Group>

          {canDownload ? (
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
              {TOPIC_PROGRAM_FILES.map((file) => (
                <Card key={file.id} padding="md" radius="lg" withBorder bg="gray.0">
                  <Group gap="xs" mb={4}>
                    {file.os === "windows" ? <Monitor size={16} /> : <Apple size={16} />}
                    <Text fw={600} size="sm">
                      {file.label}
                    </Text>
                    <Badge size="xs" variant="light" color="gray">
                      {file.sizeLabel}
                    </Badge>
                  </Group>
                  <Text size="xs" c="gray.6" mb="sm">
                    {file.description}
                  </Text>
                  <Button
                    component="a"
                    href={`/api/programs/download?id=${file.id}`}
                    color="violet"
                    variant={file.os === "windows" ? "filled" : "light"}
                    radius="lg"
                    size="sm"
                    fullWidth
                    leftSection={<Download size={16} />}
                  >
                    다운로드
                  </Button>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Card padding="lg" radius="lg" withBorder bg="gray.0">
              <Group justify="space-between">
                <Group gap="sm">
                  <Lock size={18} />
                  <Text size="sm">올인원 패스 수강생만 받을 수 있는 프로그램이에요.</Text>
                </Group>
                <Button
                  component={Link}
                  href="/checkout/allinone"
                  prefetch={false}
                  color="violet"
                  radius="lg"
                  size="sm"
                >
                  올인원 패스 보기
                </Button>
              </Group>
            </Card>
          )}
        </Card>

        {canDownload && (
          <Alert
            color="yellow"
            radius="lg"
            variant="light"
            icon={<ShieldAlert size={18} />}
            title="다운로드나 실행이 막힐 때"
          >
            <Text size="sm" mb="xs">
              직접 만든 프로그램이라 보안 인증서가 없어서, 일부 백신이 바이러스로 잘못 인식할 수 있어요. 실제로는
              안전한 파일이에요.
            </Text>
            <List size="sm" spacing={4}>
              <List.Item>
                <b>V3·알약 등 백신이 막을 때</b>: 실시간 감시를 잠깐 끄고 다시 받아 실행한 뒤, 다시 켜주세요.
              </List.Item>
              <List.Item>
                <b>Windows 「PC 보호」 파란 창이 뜰 때</b>: 「추가 정보」 → 「실행」을 눌러주세요.
              </List.Item>
              <List.Item>
                <b>Mac에서 「확인되지 않은 개발자」 창이 뜰 때</b>: 앱을 우클릭 → 「열기」를 눌러주세요.
              </List.Item>
            </List>
            <Text size="sm" mt="xs">
              그래도 안 되면 오른쪽 아래 상담 버튼으로 사용 중인 백신 이름과 화면을 보내주세요.
            </Text>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
