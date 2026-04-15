'use client';

import { useEffect, useRef, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useSearchParams } from 'next/navigation';
import {
    Coins,
    Crown,
    FlaskConical,
    RefreshCw,
    Search,
    SkipForward,
    Sparkles,
    Zap,
} from 'lucide-react';

import {
    CREDIT_TOPUP_PACKS,
    getPlanCreditDisplayCap,
    getPlanLabel,
    isActiveAccessPlan,
    isExpiredPaidPlan,
    isInitialProgramPlan,
    isMonthlySubscriberPlan,
    isPaidPlanType,
    TOSSPAY_PLAN_CONFIG,
} from '@/lib/plans/config';
import { useTossPay } from '@/hooks/useTossPay';
import { useTossPayment } from '@/hooks/useTossPayment';

interface CreditInfo {
    credits: number;
    plan_type: string;
    expires_at: string | null;
    monthly_credit_amount?: number | null;
    monthly_credit_total_cycles?: number | null;
    monthly_credit_granted_cycles?: number | null;
    next_credit_at?: string | null;
}

interface CreditsContentProps {
    userId?: string;
    isAdmin?: boolean;
}

const packs = CREDIT_TOPUP_PACKS.map((pack) => ({
    ...pack,
    priceLabel: `₩${pack.amount.toLocaleString()}`,
    unitLabel: `10회당 ₩${Math.round((pack.amount / (pack.credits / 10))).toLocaleString()}`,
    generationLabel: `${(pack.credits / 10).toLocaleString()}회 생성 분량`,
}));

const usageGuide = [
    { action: '리서치', cost: 3, icon: <Search size={16} />, desc: '소재 기반 리서치와 구조 분석' },
    { action: '전체 생성', cost: 10, icon: <Sparkles size={16} />, desc: '리서치 포함 스크립트 생성' },
    { action: '스킵 생성', cost: 7, icon: <SkipForward size={16} />, desc: '리서치 없이 바로 스크립트 생성' },
    { action: '리라이트', cost: 2, icon: <RefreshCw size={16} />, desc: '기존 스크립트의 말투와 표현 수정' },
];

function formatDate(value?: string | null) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function CreditsContent({ userId, isAdmin = false }: CreditsContentProps) {
    const tossPayTestPlan = TOSSPAY_PLAN_CONFIG.allinone;
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
    const autoCheckoutTriggeredRef = useRef(false);
    const searchParams = useSearchParams();
    const { requestPayment, loading: paymentLoading } = useTossPayment(userId);
    const {
        requestPayment: requestTossPay,
        loading: tossPayLoading,
        error: tossPayError,
    } = useTossPay();

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

    useEffect(() => {
        if (!creditInfo) return;

        const checkoutTarget = searchParams.get('checkout');
        if (checkoutTarget !== 'allinone' || autoCheckoutTriggeredRef.current) return;

        autoCheckoutTriggeredRef.current = true;

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('checkout');
        window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);

        if (!isPaidPlanType(creditInfo.plan_type)) {
            void requestTossPay('allinone');
        }
    }, [creditInfo, requestTossPay, searchParams]);

    const planType = creditInfo?.plan_type || 'free';
    const credits = creditInfo?.credits ?? 0;
    const displayPlanLabel = getPlanLabel(planType);
    const displayMaxCredits = getPlanCreditDisplayCap(planType);
    const hasPaidPlan = isPaidPlanType(planType);
    const hasActiveAccess = isActiveAccessPlan(planType, creditInfo?.expires_at);
    const isExpiredPaid = isExpiredPaidPlan(planType, creditInfo?.expires_at);
    const isInitialProgram = isInitialProgramPlan(planType);
    const isMonthlySubscriber = isMonthlySubscriberPlan(planType);
    const monthlyAmount = creditInfo?.monthly_credit_amount ?? 0;
    const grantedCycles = creditInfo?.monthly_credit_granted_cycles ?? 0;
    const totalCycles = creditInfo?.monthly_credit_total_cycles ?? null;
    const nextCreditAt = creditInfo?.next_credit_at ?? null;
    const statusLabel = hasActiveAccess ? '활성' : isExpiredPaid ? '만료' : '무료';

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Box>
                    <Group gap="sm" mb="xs">
                        <Coins size={28} color="#8b5cf6" />
                        <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                            크레딧 관리
                        </Title>
                    </Group>
                    <Text c="dimmed">
                        올인원 패스 상태와 보유 크레딧을 확인하고, 부족하면 추가 토큰을 구매할 수 있습니다.
                    </Text>
                </Box>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Card padding="xl" radius="xl" style={{ background: '#8b5cf6', border: 'none' }}>
                        <Stack gap="sm">
                            <Text size="sm" c="white" opacity={0.8}>보유 크레딧</Text>
                            <Group gap="xs" align="baseline">
                                <Title order={1} c="white">{credits}</Title>
                                <Text size="sm" c="white" opacity={0.7}>cr</Text>
                            </Group>
                            <Progress
                                value={Math.min((credits / displayMaxCredits) * 100, 100)}
                                color="white"
                                size="sm"
                                radius="xl"
                                style={{ opacity: 0.5 }}
                            />
                        </Stack>
                    </Card>

                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">현재 이용권</Text>
                                <Crown size={20} color="#8b5cf6" />
                            </Group>
                            <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                                {displayPlanLabel}
                            </Title>
                            <Group gap="sm">
                                <Badge variant="light" color="violet">
                                    {statusLabel}
                                </Badge>
                                {creditInfo?.expires_at && (
                                    <Text size="xs" c="gray.5">
                                        만료: {formatDate(creditInfo.expires_at)}
                                    </Text>
                                )}
                            </Group>
                            {hasActiveAccess && isInitialProgram && (
                                <Stack gap={2}>
                                    <Text size="xs" c="gray.5">
                                        매달 {monthlyAmount.toLocaleString()}cr 지급
                                    </Text>
                                    {totalCycles !== null && (
                                        <Text size="xs" c="gray.5">
                                            {grantedCycles}/{totalCycles}회 지급됨
                                        </Text>
                                    )}
                                    {nextCreditAt && (
                                        <Text size="xs" c="gray.5">
                                            다음 지급: {formatDate(nextCreditAt)}
                                        </Text>
                                    )}
                                </Stack>
                            )}
                            {hasActiveAccess && isMonthlySubscriber && monthlyAmount > 0 && (
                                <Text size="xs" c="gray.5">
                                    매달 {monthlyAmount.toLocaleString()}cr 자동 지급
                                </Text>
                            )}
                        </Stack>
                    </Card>
                </SimpleGrid>

                {!hasPaidPlan && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Box maw={560}>
                                <Group gap="xs" mb="xs">
                                    <Crown size={18} color="#8b5cf6" />
                                    <Text fw={700} style={{ color: 'var(--mantine-color-text)' }}>
                                        4개월 프로그램 신청
                                    </Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    강의 4개월 이용권 + 프로그램 4개월 + 매달 400cr 지급.
                                </Text>
                                <Text size="sm" c="dimmed" mt={4}>
                                    결제 직후 400cr 지급, 이후 매달 400cr씩 총 4회 지급됩니다.
                                </Text>
                            </Box>
                            <Box>
                                <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>
                                    {tossPayTestPlan.amount.toLocaleString()}원
                                </Text>
                                <Button
                                    color="violet"
                                    radius="lg"
                                    mt="xs"
                                    fullWidth
                                    loading={tossPayLoading}
                                    onClick={() => requestTossPay('allinone')}
                                >
                                    올인원 패스 결제하기
                                </Button>
                                {tossPayError && (
                                    <Text size="xs" c="red.6" mt="xs">
                                        {tossPayError}
                                    </Text>
                                )}
                            </Box>
                        </Group>
                    </Card>
                )}

                {isExpiredPaid && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #f59e0b' }}>
                        <Stack gap="xs">
                            <Group gap="xs">
                                <Crown size={18} color="#f59e0b" />
                                <Text fw={700} style={{ color: 'var(--mantine-color-text)' }}>
                                    이용권이 만료되었습니다
                                </Text>
                            </Group>
                            <Text size="sm" c="dimmed">
                                현재는 강의와 프로그램 접근이 닫혀 있습니다. 월 구독 상품이 열리기 전까지는
                                추가 크레딧 충전도 제한됩니다.
                            </Text>
                        </Stack>
                    </Card>
                )}

                {hasActiveAccess && (
                    <Box>
                        <Group gap="sm" mb="xs">
                            <Zap size={22} color="#8b5cf6" />
                            <Title order={3} style={{ color: 'var(--mantine-color-text)' }}>
                                추가 크레딧 충전
                            </Title>
                        </Group>
                        <Text size="sm" c="gray.5" mb="lg">
                            추가 토큰은 올인원 패스 기본 제공분보다 비싼 단가로 책정됩니다. 급할 때만 보충하는 용도입니다.
                        </Text>

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                            {packs.map((pack) => (
                                <Card
                                    key={pack.credits}
                                    padding="lg"
                                    radius="xl"
                                    style={
                                        pack.popular
                                            ? {
                                                border: '2px solid #8b5cf6',
                                                position: 'relative',
                                                overflow: 'visible',
                                            }
                                            : { border: '1px solid #e5e7eb' }
                                    }
                                >
                                    {pack.popular && (
                                        <Badge
                                            size="sm"
                                            color="violet"
                                            variant="filled"
                                            style={{
                                                position: 'absolute',
                                                top: -10,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                            }}
                                        >
                                            인기
                                        </Badge>
                                    )}
                                    <Group justify="space-between" align="center">
                                        <Box>
                                            <Group gap="xs">
                                                <Zap size={18} color="#8b5cf6" />
                                                <Text fw={700} size="lg" style={{ color: 'var(--mantine-color-text)' }}>
                                                    {pack.credits.toLocaleString()} 크레딧
                                                </Text>
                                            </Group>
                                            <Text size="xs" c="gray.5" mt={2}>{pack.generationLabel}</Text>
                                            <Text size="xs" c="gray.5">{pack.unitLabel}</Text>
                                        </Box>
                                        <Box ta="right">
                                            <Text fw={800} size="xl" style={{ color: '#8b5cf6' }}>{pack.priceLabel}</Text>
                                            <Button
                                                size="xs"
                                                radius="lg"
                                                mt={4}
                                                variant={pack.popular ? 'filled' : 'light'}
                                                color="violet"
                                                style={pack.popular ? { background: '#8b5cf6' } : undefined}
                                                loading={paymentLoading}
                                                onClick={() => requestPayment(pack.credits)}
                                            >
                                                구매하기
                                            </Button>
                                        </Box>
                                    </Group>
                                </Card>
                            ))}
                        </SimpleGrid>
                    </Box>
                )}

                {isAdmin && (
                    <Card padding="lg" radius="xl" withBorder>
                        <Group justify="space-between" align="flex-start" gap="md">
                            <Box maw={560}>
                                <Group gap="xs" mb="xs">
                                    <FlaskConical size={18} color="#8b5cf6" />
                                    <Text fw={700} style={{ color: 'var(--mantine-color-text)' }}>
                                        TossPay API 테스트
                                    </Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    `TOSSPAY_API_KEY`와 TossPay 생성/콜백/성공 페이지 흐름을 실제 결제로 검증합니다.
                                    4개월 프로그램 기준 {tossPayTestPlan.amount.toLocaleString()}원 결제 페이지를 엽니다.
                                </Text>
                                {tossPayError && (
                                    <Text size="sm" c="red.6" mt="xs">
                                        {tossPayError}
                                    </Text>
                                )}
                            </Box>
                            <Button
                                color="violet"
                                radius="lg"
                                loading={tossPayLoading}
                                onClick={() => requestTossPay('allinone')}
                            >
                                토스페이 테스트 결제
                            </Button>
                        </Group>
                    </Card>
                )}

                <Card padding="xl" radius="xl" withBorder>
                    <Title order={4} mb="md" style={{ color: 'var(--mantine-color-text)' }}>
                        크레딧 사용 안내
                    </Title>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>기능</Table.Th>
                                <Table.Th>소모량</Table.Th>
                                <Table.Th>설명</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {usageGuide.map((item) => (
                                <Table.Tr key={item.action}>
                                    <Table.Td>
                                        <Group gap={8}>
                                            {item.icon}
                                            <Text size="sm" fw={500}>{item.action}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" color="violet" size="sm">{item.cost} cr</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="gray.6">{item.desc}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            </Stack>
        </Container>
    );
}
