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
  const [confirmedUsagePolicy, setConfirmedUsagePolicy] = useState(false);
  const [confirmedNoticePolicy, setConfirmedNoticePolicy] = useState(false);
  const [confirmedRefundPolicy, setConfirmedRefundPolicy] = useState(false);
  const canCheckout = confirmedUsagePolicy && confirmedNoticePolicy && confirmedRefundPolicy;

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
                      checked={confirmedUsagePolicy}
                      onChange={(event) => setConfirmedUsagePolicy(event.currentTarget.checked)}
                      label="이용 기간은 결제 즉시 시작되며, 강의 및 프로그램 이용 기간이 4개월임을 확인했습니다."
                    />
                    <Checkbox
                      checked={confirmedNoticePolicy}
                      onChange={(event) => setConfirmedNoticePolicy(event.currentTarget.checked)}
                      label="계정 공유 금지, 자료 외부 공유 금지 규정을 확인했습니다."
                    />
                    <Checkbox
                      checked={confirmedRefundPolicy}
                      onChange={(event) => setConfirmedRefundPolicy(event.currentTarget.checked)}
                      label={
                        <Text size="sm" style={{ lineHeight: 1.5 }}>
                          아래 <strong>청약철회 제한 조건</strong>에 동의합니다 (전자상거래법 17조 2항):
                          <br />
                          ① 강의 <strong>5강 이상 수강</strong> 시 환불 제한
                          <br />
                          ② 지급된 <strong>크레딧 1개 이상 사용</strong> 시 환불 제한
                          <br />
                          ③ 결제 후 <strong>14일 경과</strong> 시 환불 불가
                          <br />
                          <a href="/refund" target="_blank" rel="noopener noreferrer" style={{ color: '#8b5cf6', textDecoration: 'underline' }}>
                            전체 환불 규정 보기 →
                          </a>
                        </Text>
                      }
                    />
                  </Stack>
                </Card>

                <Button
                  color="violet"
                  radius="lg"
                  size="lg"
                  disabled={!canCheckout}
                  loading={loading}
                  onClick={() =>
                    requestPayment('allinone', {
                      buyerEmail: userEmail,
                    })
                  }
                >
                  결제창 열기
                </Button>

                {!canCheckout && (
                  <Text size="xs" c="gray.5">
                    필수 확인 항목을 모두 체크해 주세요.
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
