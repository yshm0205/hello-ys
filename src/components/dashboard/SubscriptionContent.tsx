'use client';

import { useEffect, useState } from 'react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    AlertCircle,
    Coins,
    Crown,
    Package,
    Zap,
} from 'lucide-react';

import { Link } from '@/i18n/routing';
import {
    getPlanCreditDisplayCap,
    getPlanLabel,
    isActiveAccessPlan,
    isExpiredPaidPlan,
    isInitialProgramPlan,
    isMonthlySubscriberPlan,
    isPaidPlanType,
    TOSSPAY_PLAN_CONFIG,
} from '@/lib/plans/config';

interface SubscriptionContentProps {
    subscription?: {
        plan_name?: string;
        status?: string;
        current_period_end?: string;
    } | null;
}

interface CreditInfo {
    credits: number;
    plan_type: string;
    expires_at: string | null;
    monthly_credit_amount?: number | null;
    monthly_credit_total_cycles?: number | null;
    monthly_credit_granted_cycles?: number | null;
    next_credit_at?: string | null;
}

function formatDate(dateString?: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function SubscriptionContent({ subscription }: SubscriptionContentProps) {
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
    const planConfig = TOSSPAY_PLAN_CONFIG.allinone;

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/credits');
                if (!res.ok) return;
                const data = await res.json();
                setCreditInfo(data);
            } catch {
                // ignore
            }
        }

        fetchCredits();
    }, []);

    const planType = creditInfo?.plan_type || 'free';
    const hasPaidPlan = isPaidPlanType(planType);
    const hasActiveAccess = isActiveAccessPlan(planType, creditInfo?.expires_at);
    const isExpiredPaid = isExpiredPaidPlan(planType, creditInfo?.expires_at);
    const isInitialProgram = isInitialProgramPlan(planType);
    const isMonthlySubscriber = isMonthlySubscriberPlan(planType);
    const planLabel = getPlanLabel(planType);
    const maxCredits = getPlanCreditDisplayCap(planType);
    const statusLabel = hasActiveAccess ? '활성' : isExpiredPaid ? '만료' : '무료';

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Box>
                    <Group gap="sm" mb="xs">
                        <Crown size={28} color="#8b5cf6" />
                        <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                            이용권 관리
                        </Title>
                    </Group>
                    <Text c="gray.6">
                        현재 이용권과 월별 크레딧 지급 상태를 확인합니다.
                    </Text>
                </Box>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Card padding="xl" radius="xl" style={{ background: '#8b5cf6', border: 'none' }}>
                        <Stack gap="xs">
                            <Text size="sm" c="white" opacity={0.8}>현재 이용권</Text>
                            <Title order={2} c="white">{planLabel}</Title>
                            <Group gap="sm">
                                <Badge variant="white" style={{ color: '#8b5cf6' }}>
                                    {statusLabel}
                                </Badge>
                                {creditInfo?.expires_at && (
                                    <Text size="sm" c="white" opacity={0.8}>
                                        만료: {formatDate(creditInfo.expires_at)}
                                    </Text>
                                )}
                            </Group>
                            {hasActiveAccess && isInitialProgram && (
                                <>
                                    <Text size="xs" c="white" opacity={0.8}>
                                        매달 {(creditInfo?.monthly_credit_amount ?? 0).toLocaleString()}cr 지급
                                    </Text>
                                    <Text size="xs" c="white" opacity={0.8}>
                                        {(creditInfo?.monthly_credit_granted_cycles ?? 0)}/
                                        {creditInfo?.monthly_credit_total_cycles ?? 0}회 지급됨
                                    </Text>
                                    {creditInfo?.next_credit_at && (
                                        <Text size="xs" c="white" opacity={0.8}>
                                            다음 지급: {formatDate(creditInfo.next_credit_at)}
                                        </Text>
                                    )}
                                </>
                            )}
                            {hasActiveAccess && isMonthlySubscriber && (
                                <Text size="xs" c="white" opacity={0.8}>
                                    매달 {(creditInfo?.monthly_credit_amount ?? 0).toLocaleString()}cr 자동 지급
                                </Text>
                            )}
                        </Stack>
                    </Card>

                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">보유 크레딧</Text>
                                <Zap size={20} color="#8b5cf6" />
                            </Group>
                            <Group gap="xs" align="baseline">
                                <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                                    {creditInfo?.credits ?? 0}
                                </Title>
                                <Text size="sm" c="gray.5">cr</Text>
                            </Group>
                            <Progress
                                value={Math.min((((creditInfo?.credits ?? 0) / maxCredits) * 100), 100)}
                                color={(creditInfo?.credits ?? 0) > maxCredits * 0.3 ? 'violet' : 'orange'}
                                size="md"
                                radius="xl"
                            />
                        </Stack>
                    </Card>
                </SimpleGrid>

                {!hasPaidPlan && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Group gap="md">
                                <Package size={32} color="#8b5cf6" />
                                <Box>
                                    <Title order={4} style={{ color: 'var(--mantine-color-text)' }}>
                                        4개월 프로그램 시작하기
                                    </Title>
                                    <Text size="sm" c="gray.6">
                                        강의 4개월 이용권 + 프로그램 4개월 + 매달 400cr 지급
                                    </Text>
                                </Box>
                            </Group>
                            <Box>
                                <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>
                                    {planConfig.amount.toLocaleString()}원
                                </Text>
                                <Button
                                    component={Link}
                                    href="/pricing"
                                    color="violet"
                                    radius="lg"
                                    mt="xs"
                                    fullWidth
                                >
                                    신청하기
                                </Button>
                            </Box>
                        </Group>
                    </Card>
                )}

                {isExpiredPaid && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Box>
                                <Title order={4} style={{ color: 'var(--mantine-color-text)' }}>
                                    4개월 이용권이 종료되었습니다
                                </Title>
                                <Text size="sm" c="gray.6">
                                    다음 단계로는 월 구독 상품을 붙일 예정입니다. 현재는 필요할 때 크레딧 충전으로 계속 사용할 수 있습니다.
                                </Text>
                            </Box>
                        </Group>
                    </Card>
                )}

                <Card padding="xl" radius="xl" withBorder>
                    <Group gap="sm" mb="lg">
                        <Coins size={24} color="#8b5cf6" />
                        <Title order={4} style={{ color: 'var(--mantine-color-text)' }}>
                            결제 정책
                        </Title>
                    </Group>
                    <Stack gap="sm">
                        <Text size="sm" c="gray.6">
                            첫 결제는 4개월 프로그램 이용권이며, 결제 직후 400cr가 지급됩니다.
                        </Text>
                        <Text size="sm" c="gray.6">
                            이후 매달 400cr씩 총 4회 지급됩니다.
                        </Text>
                        <Text size="sm" c="gray.6">
                            추가 크레딧 충전은 이용권과 별개로 언제든 가능합니다.
                        </Text>
                        {subscription?.plan_name && (
                            <Text size="sm" c="gray.6">
                                현재 구독 정보: {subscription.plan_name}
                            </Text>
                        )}
                    </Stack>
                </Card>

                <Alert
                    icon={<AlertCircle size={18} />}
                    title="안내"
                    color="blue"
                    radius="lg"
                    variant="light"
                >
                    월 구독 상품은 4개월 프로그램 종료 후 별도 결제로 연결할 예정입니다.
                </Alert>
            </Stack>
        </Container>
    );
}
