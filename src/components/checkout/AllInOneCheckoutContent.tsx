'use client';

import { useEffect, useState } from 'react';

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
import { useLocale } from 'next-intl';
import { AlertCircle, Check, ChevronLeft, Crown, ShieldCheck, TicketPercent } from 'lucide-react';

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

interface AppliedCoupon {
  code: string;
  label: string;
  description: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  expiresAt: string | null;
}

interface AllInOneCheckoutContentProps {
  userEmail?: string;
  creditInfo: CheckoutCreditInfo | null;
  initialCouponCode?: string;
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatWon(amount: number) {
  return `${amount.toLocaleString()}원`;
}

export function AllInOneCheckoutContent({
  userEmail,
  creditInfo,
  initialCouponCode = '',
}: AllInOneCheckoutContentProps) {
  const locale = useLocale();
  const plan = TOSSPAY_PLAN_CONFIG.allinone;
  const monthlyGenerationCount = Math.floor(plan.monthlyCredits / 10);
  const totalGenerationCount = Math.floor(plan.totalCredits / 10);
  const hasActiveAccess = isActiveAccessPlan(creditInfo?.plan_type, creditInfo?.expires_at);
  const isInitialProgram = isInitialProgramPlan(creditInfo?.plan_type);
  const isMonthlySubscriber = isMonthlySubscriberPlan(creditInfo?.plan_type);

  const [confirmedDuration, setConfirmedDuration] = useState(false);
  const [confirmedSharing, setConfirmedSharing] = useState(false);
  const [confirmedRefund, setConfirmedRefund] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const allConfirmed = confirmedDuration && confirmedSharing && confirmedRefund;
  const canCheckout = allConfirmed;
  const finalCheckoutAmount = appliedCoupon?.finalAmount ?? plan.amount;
  const monthly12Original = Math.ceil(plan.listAmount / 12);
  const monthly12Final = Math.ceil(finalCheckoutAmount / 12);

  const toggleAll = (checked: boolean) => {
    setConfirmedDuration(checked);
    setConfirmedSharing(checked);
    setConfirmedRefund(checked);
  };

  const applyCoupon = async (rawCode: string) => {
    const normalizedCode = rawCode.trim().toUpperCase();

    if (!normalizedCode) {
      setAppliedCoupon(null);
      setError('쿠폰 코드를 입력해 주세요.');
      return;
    }

    setError(null);

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponCode: normalizedCode,
          context: 'allinone',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success || !data.coupon) {
        setAppliedCoupon(null);
        setError(data.error || '쿠폰 적용에 실패했습니다.');
        return;
      }

      setAppliedCoupon(data.coupon as AppliedCoupon);
    } catch (err) {
      const message = err instanceof Error ? err.message : '쿠폰 확인 중 오류가 발생했습니다.';
      setAppliedCoupon(null);
      setError(message);
    }
  };

  useEffect(() => {
    if (!initialCouponCode) return;
    void applyCoupon(initialCouponCode);
    // initial coupon is a one-time bootstrap value from the server-rendered URL.
  }, [initialCouponCode]);

  const handleTossPayCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const { getMarketingSessionKeyFromBrowser, getMarketingTokenFromBrowser } = await import(
        '@/lib/marketing/tracking'
      );
      const res = await fetch('/api/tosspay/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: 'allinone',
          buyerEmail: userEmail,
          locale,
          couponCode: appliedCoupon?.code || null,
          sessionKey: getMarketingSessionKeyFromBrowser(),
          marketingToken: getMarketingTokenFromBrowser(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.checkoutPage) {
        setError(data.error || '결제 주문 생성에 실패했습니다.');
        return;
      }

      window.location.assign(data.checkoutPage);
    } catch (err) {
      const message = err instanceof Error ? err.message : '결제 요청에 실패했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
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
                ' 월 구독 상태에서는 추가 토큰만 대시보드에서 별도로 구매할 수 있습니다.'}
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
                    <Badge color="violet" variant="filled">
                      2차 얼리버드
                    </Badge>
                  </Group>
                  <Text size="sm" c="gray.6">
                    강의 {plan.months}개월 + 프로그램 {plan.months}개월 + 매달{' '}
                    {plan.monthlyCredits.toLocaleString()}cr 지급(생성 {monthlyGenerationCount}편 분량)
                  </Text>
                </Box>

                <Alert
                  color="violet"
                  radius="lg"
                  variant="light"
                  icon={<TicketPercent size={18} />}
                  title="2차 얼리버드 혜택 적용 중"
                >
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    마감 후 할인 종료
                  </Text>
                </Alert>

                <Group justify="space-between" align="flex-end">
                  <Box>
                    <Text size="sm" c="gray.4" td="line-through">
                      {formatWon(plan.listAmount)}
                    </Text>
                    {appliedCoupon ? (
                      <Stack gap={2}>
                        <Text size="sm" c="gray.5" td="line-through">
                          {formatWon(plan.amount)}
                        </Text>
                        <Title order={1} style={{ color: '#111827' }}>
                          {formatWon(appliedCoupon.finalAmount)}
                        </Title>
                        <Text size="xs" c="green.7" fw={600}>
                          {appliedCoupon.label} -{formatWon(appliedCoupon.discountAmount)}
                        </Text>
                      </Stack>
                    ) : (
                      <Title order={1} style={{ color: '#111827' }}>
                        {formatWon(plan.amount)}
                      </Title>
                    )}
                    <Text size="sm" c="gray.6" mt={4}>
                      12개월 할부 시{' '}
                      <span style={{ color: '#9ca3af', textDecoration: 'line-through' }}>
                        월 {formatWon(monthly12Original)}
                      </span>{' '}
                      <strong style={{ color: '#7c3aed' }}>월 {formatWon(monthly12Final)}</strong>
                    </Text>
                  </Box>
                  <Badge color="violet" variant="light">
                    총 {plan.totalCredits.toLocaleString()}cr / 생성 {totalGenerationCount}편 분량
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
                        결제 직후 {plan.initialCredits.toLocaleString()}cr 지급(생성 {monthlyGenerationCount}
                        편 분량)
                      </Text>
                      <Text size="sm" c="gray.6">
                        이후 매달 {plan.monthlyCredits.toLocaleString()}cr씩 총 {plan.months}회 지급
                      </Text>
                      <Text size="sm" c="gray.6">
                        총 {plan.totalCredits.toLocaleString()}cr 제공 (생성 {totalGenerationCount}편 분량)
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
                            이용 기간은 <strong>4개월</strong>이며, 결제 즉시 시작되는 것을 확인했습니다.
                          </Text>
                        }
                      />
                      <Checkbox
                        checked={confirmedSharing}
                        onChange={(event) => setConfirmedSharing(event.currentTarget.checked)}
                        label={
                          <Text size="sm" style={{ lineHeight: 1.5 }}>
                            계정 공유 및 자료 무단 공유가 금지됨을 확인했습니다.
                          </Text>
                        }
                      />
                      <Checkbox
                        checked={confirmedRefund}
                        onChange={(event) => setConfirmedRefund(event.currentTarget.checked)}
                        label={
                          <Text size="sm" style={{ lineHeight: 1.5 }}>
                            환불 규정을 정확히 확인했습니다.
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
                  title="결제 안내"
                >
                  <Text size="sm" style={{ lineHeight: 1.6 }}>
                    결제는 <strong>토스 보안 결제창</strong>에서 진행됩니다.
                    <br />
                    다음 단계에서 <strong>카드, 토스머니, 계좌이체</strong> 중 선택할 수 있습니다.
                  </Text>
                </Alert>

                {appliedCoupon && (
                  <Alert color="green" radius="lg" variant="light">
                    <Text size="sm" fw={600}>
                      {appliedCoupon.label}
                    </Text>
                    <Text size="sm" c="gray.7">
                      {appliedCoupon.description}
                    </Text>
                    <Text size="sm" c="gray.7">
                      결제 금액: {formatWon(appliedCoupon.originalAmount)} →{' '}
                      {formatWon(appliedCoupon.finalAmount)}
                    </Text>
                    {appliedCoupon.expiresAt && (
                      <Text size="xs" c="gray.6">
                        사용 기한: {formatDate(appliedCoupon.expiresAt)}
                      </Text>
                    )}
                  </Alert>
                )}

                <Button
                  color="violet"
                  radius="lg"
                  size="lg"
                  disabled={!canCheckout}
                  loading={loading}
                  onClick={handleTossPayCheckout}
                  style={{ background: canCheckout ? '#8b5cf6' : undefined }}
                >
                  2차 얼리버드 혜택으로 {formatWon(finalCheckoutAmount)} 결제하기
                </Button>

                {!canCheckout && (
                  <Text size="xs" c="gray.5">
                    필수 확인 항목에 모두 동의해 주세요.
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
