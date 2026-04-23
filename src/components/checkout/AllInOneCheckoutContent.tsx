'use client';

import { useState } from 'react';

import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Container,
  Divider,
  Group,
  List,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { AlertCircle, Check, ChevronLeft, Crown, ShieldCheck } from 'lucide-react';

import { useTossPay } from '@/hooks/useTossPay';
import { Link } from '@/i18n/routing';
import {
  isActiveAccessPlan,
  isInitialProgramPlan,
  isMonthlySubscriberPlan,
  TOSSPAY_PLAN_CONFIG,
  type AppPlanType,
} from '@/lib/plans/config';

interface CheckoutCreditInfo {
  credits: number;
  plan_type: AppPlanType | string;
  expires_at: string | null;
  monthly_credit_amount: number;
  monthly_credit_total_cycles: number | null;
  monthly_credit_granted_cycles: number;
  next_credit_at: string | null;
}

interface AllInOneCheckoutContentProps {
  userEmail?: string;
  creditInfo: CheckoutCreditInfo | null;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function AllInOneCheckoutContent({
  userEmail,
  creditInfo,
}: AllInOneCheckoutContentProps) {
  const { requestPayment, loading, error } = useTossPay();
  const plan = TOSSPAY_PLAN_CONFIG.allinone;
  const monthlyGenerationCount = Math.floor(plan.monthlyCredits / 10);
  const totalGenerationCount = Math.floor(plan.totalCredits / 10);
  const hasActiveAccess = isActiveAccessPlan(creditInfo?.plan_type, creditInfo?.expires_at);
  const isInitialProgram = isInitialProgramPlan(creditInfo?.plan_type);
  const isMonthlySubscriber = isMonthlySubscriberPlan(creditInfo?.plan_type);
  const [confirmedDuration, setConfirmedDuration] = useState(false);
  const [confirmedSharing, setConfirmedSharing] = useState(false);
  const [confirmedRefund, setConfirmedRefund] = useState(false);
  const allConfirmed = confirmedDuration && confirmedSharing && confirmedRefund;
  const canCheckout = allConfirmed;
  const toggleAll = (checked: boolean) => {
    setConfirmedDuration(checked);
    setConfirmedSharing(checked);
    setConfirmedRefund(checked);
  };

  return (
    <Box style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Container size="md" py={80}>
        <Stack gap="xl">
          <Group justify="space-between" align="center">
            <Button
              component={Link}
              href="/"
              variant="subtle"
              color="gray"
              leftSection={<ChevronLeft size={16} />}
            >
              홈으로
            </Button>
            {userEmail && (
              <Text size="sm" c="gray.6">
                로그인 계정: {userEmail}
              </Text>
            )}
          </Group>

          <Stack gap="sm">
            <Badge variant="light" color="violet" w="fit-content">
              Checkout
            </Badge>
            <Title order={1} style={{ color: '#111827' }}>
              올인원 패스 결제
            </Title>
            <Text c="gray.6">
              상품 구성과 이용 조건을 확인한 뒤 결제를 진행해 주세요.
            </Text>
          </Stack>

          {hasActiveAccess ? (
            <Alert
              color="violet"
              radius="xl"
              variant="light"
              icon={<ShieldCheck size={18} />}
              title="이미 올인원 패스를 이용 중입니다"
            >
              이용 기간은 {formatDate(creditInfo?.expires_at)}까지입니다.
              {isInitialProgram && ' 이용권이 만료되기 전에는 중복 결제가 제한됩니다.'}
              {isMonthlySubscriber &&
                ' 월 구독 상태에서는 추가 토큰만 대시보드에서 별도 구매할 수 있습니다.'}
            </Alert>
          ) : (
            <Card
              padding="xl"
              radius="xl"
              style={{ border: '2px solid #8b5cf6', background: '#fff' }}
            >
              <Stack gap="lg">
                <Box>
                  <Group gap="xs" mb={6}>
                    <Crown size={20} color="#8b5cf6" />
                    <Text fw={700} size="xl" style={{ color: '#111827' }}>
                      올인원 패스
                    </Text>
                  </Group>
                  <Text size="sm" c="gray.6">
                    강의 {plan.months}개월 + 프로그램 {plan.months}개월 + 매달{' '}
                    {plan.monthlyCredits.toLocaleString()}cr 지급 (생성 {monthlyGenerationCount}회 분량)
                  </Text>
                </Box>

                <Group justify="space-between" align="flex-end">
                  <Box>
                    <Text size="sm" c="gray.4" td="line-through">
                      ₩{plan.listAmount.toLocaleString()}
                    </Text>
                    <Title order={1} style={{ color: '#111827' }}>
                      ₩{plan.amount.toLocaleString()}
                    </Title>
                  </Box>
                  <Badge color="violet" variant="light">
                    총 {plan.totalCredits.toLocaleString()}cr · 생성 {totalGenerationCount}회 분량
                  </Badge>
                </Group>

                <Divider />

                <Card padding="md" radius="lg" withBorder>
                  <Stack gap="md">
                    <Group gap="xs">
                      <Crown size={18} color="#8b5cf6" />
                      <Text fw={700} style={{ color: '#111827' }}>
                        포함 항목
                      </Text>
                    </Group>
                    <List spacing={10} size="sm" center>
                      {[
                        'VOD 강의 40강',
                        'AI 스크립트 도구 4개월 이용',
                        '월간 트렌드 채널 데이터',
                        '전자책',
                        '노션 운영 템플릿',
                        '프로그램 4개월 참여',
                      ].map((item) => (
                        <List.Item
                          key={item}
                          icon={
                            <ThemeIcon size={20} radius="xl" color="green" variant="light">
                              <Check size={12} />
                            </ThemeIcon>
                          }
                          style={{ color: '#374151' }}
                        >
                          {item}
                        </List.Item>
                      ))}
                    </List>
                    <Stack gap={6}>
                      <Text size="sm" c="gray.6">
                        결제 직후 {plan.initialCredits.toLocaleString()}cr 지급 (생성 {monthlyGenerationCount}회 분량)
                      </Text>
                      <Text size="sm" c="gray.6">
                        이후 매달 {plan.monthlyCredits.toLocaleString()}cr씩 총 {plan.months}회 지급
                      </Text>
                      <Text size="sm" c="gray.6">
                        총 {plan.totalCredits.toLocaleString()}cr 제공 (생성 {totalGenerationCount}회 분량)
                      </Text>
                    </Stack>
                  </Stack>
                </Card>

                <Card padding="md" radius="lg" withBorder style={{ background: '#fcfcff' }}>
                  <Stack gap="sm">
                    <Text fw={700} size="sm" style={{ color: '#111827' }}>
                      필수 확인
                    </Text>
                    <Checkbox
                      checked={allConfirmed}
                      onChange={(event) => toggleAll(event.currentTarget.checked)}
                      label={
                        <Text size="sm" fw={700} style={{ lineHeight: 1.5 }}>
                          모든 이용 조건을 확인하고 동의합니다.
                        </Text>
                      }
                    />
                    <Divider />
                    <Stack gap="xs" pl={4}>
                      <Checkbox
                        checked={confirmedDuration}
                        onChange={(event) => setConfirmedDuration(event.currentTarget.checked)}
                        label={
                          <Text size="sm" style={{ lineHeight: 1.5 }}>
                            이용 기간 <strong>4개월</strong>이며, 결제 즉시 시작되는 것을 확인했습니다.
                          </Text>
                        }
                      />
                      <Checkbox
                        checked={confirmedSharing}
                        onChange={(event) => setConfirmedSharing(event.currentTarget.checked)}
                        label={
                          <Text size="sm" style={{ lineHeight: 1.5 }}>
                            계정 공유 및 자료 외부 공유가 금지됨을 확인했습니다.
                          </Text>
                        }
                      />
                      <Checkbox
                        checked={confirmedRefund}
                        onChange={(event) => setConfirmedRefund(event.currentTarget.checked)}
                        label={
                          <Text size="sm" style={{ lineHeight: 1.5 }}>
                            환불 규정을 정확히 확인했습니다.{' '}
                            <a href="/refund" target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>
                              자세히 보기 →
                            </a>
                          </Text>
                        }
                      />
                    </Stack>
                  </Stack>
                </Card>

                <Alert
                  color="violet"
                  radius="lg"
                  variant="light"
                  icon={<AlertCircle size={18} />}
                  title="결제 수단 안내"
                >
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    현재 일부 카드사가 PG 심사 진행 중이라{' '}
                    <strong>신한 · 삼성 · 현대 · 농협 카드</strong>만 결제 가능합니다.
                    <br />
                    다른 카드(국민·하나·BC·롯데·우리)는{' '}
                    <strong>토스페이</strong>를 이용해 주세요.{' '}
                    <Text span size="xs" c="gray.6">
                      (~5/9경 정상화 예정)
                    </Text>
                  </Text>
                </Alert>

                <Stack gap="xs">
                  <Text size="xs" c="gray.6" fw={600}>
                    카드사 선택 (승인 완료된 4개만 가능)
                  </Text>
                  <Group grow gap="xs">
                    <Button
                      color="violet"
                      radius="lg"
                      size="md"
                      disabled={!canCheckout}
                      loading={loading}
                      onClick={() =>
                        requestPayment(
                          'allinone',
                          { buyerEmail: userEmail },
                          'CARD',
                          'SHINHAN_CARD',
                        )
                      }
                    >
                      신한카드
                    </Button>
                    <Button
                      color="violet"
                      radius="lg"
                      size="md"
                      disabled={!canCheckout}
                      loading={loading}
                      onClick={() =>
                        requestPayment(
                          'allinone',
                          { buyerEmail: userEmail },
                          'CARD',
                          'SAMSUNG_CARD',
                        )
                      }
                    >
                      삼성카드
                    </Button>
                  </Group>
                  <Group grow gap="xs">
                    <Button
                      color="violet"
                      radius="lg"
                      size="md"
                      disabled={!canCheckout}
                      loading={loading}
                      onClick={() =>
                        requestPayment(
                          'allinone',
                          { buyerEmail: userEmail },
                          'CARD',
                          'HYUNDAI_CARD',
                        )
                      }
                    >
                      현대카드
                    </Button>
                    <Button
                      color="violet"
                      radius="lg"
                      size="md"
                      disabled={!canCheckout}
                      loading={loading}
                      onClick={() =>
                        requestPayment(
                          'allinone',
                          { buyerEmail: userEmail },
                          'CARD',
                          'NH_CARD',
                        )
                      }
                    >
                      농협카드
                    </Button>
                  </Group>
                </Stack>

                <Button
                  color="blue"
                  radius="lg"
                  size="lg"
                  variant="outline"
                  disabled={!canCheckout}
                  loading={loading}
                  onClick={() =>
                    requestPayment(
                      'allinone',
                      { buyerEmail: userEmail },
                      'TOSSPAY',
                    )
                  }
                >
                  토스페이로 결제 (기타 카드)
                </Button>

                {!canCheckout && (
                  <Text size="xs" c="gray.5">
                    필수 확인 항목에 동의해 주세요.
                  </Text>
                )}

                {error && (
                  <Alert color="red" radius="lg" variant="light" icon={<AlertCircle size={18} />}>
                    {error}
                  </Alert>
                )}
              </Stack>
            </Card>
          )}

          <Text size="xs" c="gray.5" ta="center">
            결제 문제나 계정 이슈가 있으면 hmys0205hmys@gmail.com 으로 문의해 주세요.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
