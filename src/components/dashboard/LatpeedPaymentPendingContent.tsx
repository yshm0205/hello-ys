'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, Card, Container, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { AlertCircle, CheckCircle2, Clock, Mail, RefreshCw } from 'lucide-react';

import { useRouter } from '@/i18n/routing';
import { isActiveAccessPlan } from '@/lib/plans/config';

interface LatpeedPaymentPendingContentProps {
  userEmail: string;
  intentCreatedAt: string;
  intentExpiresAt: string;
}

type CheckState = 'checking' | 'opened' | 'delayed';

function formatTime(value: string) {
  return new Date(value).toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function LatpeedPaymentPendingContent({
  userEmail,
  intentCreatedAt,
  intentExpiresAt,
}: LatpeedPaymentPendingContentProps) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [checkState, setCheckState] = useState<CheckState>('checking');
  const [isManualChecking, setIsManualChecking] = useState(false);

  const elapsedLabel = useMemo(() => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
  }, [elapsedSeconds]);

  const checkAccess = useCallback(async (force = false) => {
    if (force) setIsManualChecking(true);

    try {
      const res = await fetch('/api/credits', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) return false;

      const data = (await res.json()) as {
        plan_type?: string | null;
        expires_at?: string | null;
      };

      if (isActiveAccessPlan(data.plan_type, data.expires_at)) {
        setCheckState('opened');
        window.setTimeout(() => {
          router.refresh();
        }, 600);
        return true;
      }

      return false;
    } finally {
      if (force) setIsManualChecking(false);
    }
  }, [router]);

  useEffect(() => {
    void checkAccess();

    const tick = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    const poll = window.setInterval(() => {
      void checkAccess();
    }, 5000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, [checkAccess]);

  useEffect(() => {
    if (elapsedSeconds >= 90 && checkState === 'checking') {
      setCheckState('delayed');
    }
  }, [checkState, elapsedSeconds]);

  return (
    <Container size="sm" py="xl">
      <Card padding="xl" radius="xl" withBorder shadow="sm">
        <Stack gap="lg">
          <Group gap="sm" align="center">
            {checkState === 'opened' ? (
              <CheckCircle2 size={28} color="#16a34a" />
            ) : (
              <Loader size="sm" color="violet" />
            )}
            <Box>
              <Title order={2}>결제 확인 중입니다</Title>
              <Text size="sm" c="gray.6" mt={4}>
                카드/간편결제는 결제 완료 후 권한 반영까지 잠시 걸릴 수 있습니다.
              </Text>
            </Box>
          </Group>

          <Alert color={checkState === 'delayed' ? 'orange' : 'violet'} radius="lg" icon={<Clock size={18} />}>
            {checkState === 'opened' ? (
              <Text fw={700}>권한이 확인되었습니다. 강의실을 다시 불러오는 중입니다.</Text>
            ) : checkState === 'delayed' ? (
              <Stack gap={4}>
                <Text fw={700}>아직 권한이 확인되지 않았습니다.</Text>
                <Text size="sm">
                  보통 1분 이내 열리지만, 결제창 이메일과 FlowSpot 로그인 이메일이 다르면 자동 지급이 지연될 수
                  있습니다.
                </Text>
              </Stack>
            ) : (
              <Stack gap={4}>
                <Text fw={700}>보통 1분 이내 자동으로 열립니다.</Text>
                <Text size="sm">이 화면을 닫지 말고 잠시만 기다려주세요.</Text>
              </Stack>
            )}
          </Alert>

          <Stack gap="xs">
            <Group gap="xs" wrap="nowrap">
              <Mail size={16} color="#6b7280" />
              <Text size="sm" c="gray.7">
                FlowSpot 로그인 이메일: <strong>{userEmail}</strong>
              </Text>
            </Group>
            <Text size="xs" c="gray.5">
              결제 시도: {formatTime(intentCreatedAt)} · 확인 가능 시간: {formatTime(intentExpiresAt)}까지 · 대기:
              {' '}
              {elapsedLabel}
            </Text>
          </Stack>

          {checkState === 'delayed' && (
            <Alert color="red" variant="light" radius="lg" icon={<AlertCircle size={18} />}>
              계속 열리지 않으면 채널톡 또는 카카오톡으로 결제창에 입력한 이름, 전화번호, 이메일을 보내주세요.
            </Alert>
          )}

          <Group grow>
            <Button
              color="violet"
              leftSection={<RefreshCw size={16} />}
              loading={isManualChecking}
              onClick={() => void checkAccess(true)}
            >
              지금 다시 확인
            </Button>
            <Button variant="light" color="gray" onClick={() => router.push('/checkout/allinone?intent=pay')}>
              결제창으로 돌아가기
            </Button>
          </Group>
        </Stack>
      </Card>
    </Container>
  );
}
