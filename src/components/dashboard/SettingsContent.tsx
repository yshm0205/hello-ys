'use client';

import { useEffect, useState } from 'react';
import {
    Alert,
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Tabs,
    Text,
    Title,
} from '@mantine/core';
import {
    AlertCircle,
    Calendar,
    Coins,
    Crown,
    LogOut,
    Mail,
    Package,
    Shield,
    User,
    Zap,
} from 'lucide-react';

import { Link } from '@/i18n/routing';
import { useTossPayment } from '@/hooks/useTossPayment';
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

interface SettingsContentProps {
    user?: {
        email?: string;
        id?: string;
        created_at?: string;
    };
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

const creditPacks = [
    { cr: 100, price: '₩14,900', popular: false },
    { cr: 300, price: '₩34,900', popular: false },
    { cr: 500, price: '₩54,900', popular: true },
    { cr: 1000, price: '₩99,900', popular: false },
];

function formatDate(dateString?: string | null) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function SettingsContent({ user }: SettingsContentProps) {
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
    const {
        requestPayment,
        loading: paymentLoading,
        error: paymentError,
        notice: paymentNotice,
    } = useTossPayment(user?.id, user?.email);

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
    const planConfig = TOSSPAY_PLAN_CONFIG.allinone;
    const statusLabel = hasActiveAccess ? '활성' : isExpiredPaid ? '만료' : '무료';

    return (
        <Container size="md" py="md">
            <Stack gap="xl">
                <Box>
                    <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                        설정
                    </Title>
                    <Text c="gray.6" mt={4}>
                        계정 정보와 이용권 상태를 확인하고 결제 관련 설정을 관리합니다.
                    </Text>
                </Box>

                <Tabs defaultValue="profile" color="violet">
                    <Tabs.List>
                        <Tabs.Tab value="profile" leftSection={<User size={16} />}>
                            프로필
                        </Tabs.Tab>
                        <Tabs.Tab value="plan" leftSection={<Crown size={16} />}>
                            이용권 및 결제
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="profile" pt="xl">
                        <Stack gap="xl">
                            <Card padding="xl" radius="xl" withBorder>
                                <Stack gap="lg">
                                    <Group gap="md">
                                        <Avatar size="xl" radius="xl" color="violet">
                                            {user?.email?.[0]?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box>
                                            <Title order={4} style={{ color: 'var(--mantine-color-text)' }}>
                                                {user?.email?.split('@')[0] || 'User'}
                                            </Title>
                                            <Text size="sm" c="gray.5">
                                                {user?.email}
                                            </Text>
                                        </Box>
                                    </Group>

                                    <Divider />

                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <Group gap="md">
                                            <Box style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: 'rgba(139, 92, 246, 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Mail size={20} color="#8b5cf6" />
                                            </Box>
                                            <Box>
                                                <Text size="xs" c="gray.5">이메일</Text>
                                                <Text size="sm" fw={500}>{user?.email || '-'}</Text>
                                            </Box>
                                        </Group>

                                        <Group gap="md">
                                            <Box style={{
                                                width: 40, height: 40, borderRadius: 10,
                                                background: 'rgba(6, 182, 212, 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Calendar size={20} color="#06b6d4" />
                                            </Box>
                                            <Box>
                                                <Text size="xs" c="gray.5">가입일</Text>
                                                <Text size="sm" fw={500}>{formatDate(user?.created_at)}</Text>
                                            </Box>
                                        </Group>
                                    </SimpleGrid>
                                </Stack>
                            </Card>

                            <Card padding="xl" radius="xl" withBorder>
                                <Stack gap="lg">
                                    <Group gap="sm">
                                        <Shield size={24} color="#22c55e" />
                                        <Title order={4}>보안</Title>
                                    </Group>

                                    <Text size="sm" c="gray.6">
                                        현재 Google 계정으로 로그인되어 있습니다. 비밀번호와 로그인 보안은 Google 계정에서 관리됩니다.
                                    </Text>

                                    <Divider />

                                    <Group justify="space-between" align="center">
                                        <Box>
                                            <Text fw={500}>로그아웃</Text>
                                            <Text size="sm" c="gray.5">현재 기기에서 로그아웃합니다.</Text>
                                        </Box>
                                        <Button
                                            component="a"
                                            href="/api/auth/signout"
                                            variant="light"
                                            color="red"
                                            leftSection={<LogOut size={18} />}
                                        >
                                            로그아웃
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="plan" pt="xl">
                        <Stack gap="xl">
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
                                                href="/checkout/allinone"
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
                                <Alert
                                    icon={<AlertCircle size={18} />}
                                    title="이용권이 만료되었습니다"
                                    color="orange"
                                    radius="lg"
                                    variant="light"
                                >
                                    현재는 강의와 프로그램 접근이 닫혀 있습니다. 월 구독 상품이 열리기 전까지는
                                    추가 크레딧 충전도 제한됩니다.
                                </Alert>
                            )}

                            {hasActiveAccess && (
                                <Box>
                                    <Group gap="sm" mb="lg">
                                        <Coins size={24} color="#8b5cf6" />
                                        <Title order={4} style={{ color: 'var(--mantine-color-text)' }}>
                                            추가 크레딧 충전
                                        </Title>
                                    </Group>
                                    <Text size="xs" c="gray.5" mb={4}>
                                        프로그램 이용 중 부족한 만큼 바로 충전할 수 있습니다.
                                    </Text>
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                        {creditPacks.map((pack) => (
                                            <Card
                                                key={pack.cr}
                                                padding="lg"
                                                radius="xl"
                                                style={pack.popular
                                                    ? { border: '2px solid #8b5cf6', cursor: 'pointer' }
                                                    : { border: '1px solid #e5e7eb', cursor: 'pointer' }
                                                }
                                            >
                                                <Group justify="space-between">
                                                    <Box>
                                                        <Group gap="xs">
                                                            <Text fw={600} size="lg" style={{ color: 'var(--mantine-color-text)' }}>
                                                                {pack.cr.toLocaleString()} 크레딧
                                                            </Text>
                                                            {pack.popular && (
                                                                <Badge size="xs" color="green" variant="light">인기</Badge>
                                                            )}
                                                        </Group>
                                                    </Box>
                                                    <Box ta="right">
                                                        <Text fw={700} size="lg" style={{ color: '#8b5cf6' }}>
                                                            {pack.price}
                                                        </Text>
                                                        <Button
                                                            size="xs"
                                                            variant={pack.popular ? 'filled' : 'light'}
                                                            color="violet"
                                                            radius="lg"
                                                            mt="xs"
                                                            style={pack.popular ? { background: '#8b5cf6' } : undefined}
                                                            loading={paymentLoading}
                                                            onClick={() => requestPayment(pack.cr)}
                                                        >
                                                            구매하기
                                                        </Button>
                                                    </Box>
                                                </Group>
                                            </Card>
                                        ))}
                                    </SimpleGrid>
                                    {paymentError && (
                                        <Text size="sm" c="red.6" mt="md">
                                            {paymentError}
                                        </Text>
                                    )}
                                    {paymentNotice && (
                                        <Text size="sm" c="dimmed" mt="md">
                                            {paymentNotice}
                                        </Text>
                                    )}
                                </Box>
                            )}

                            <Alert
                                icon={<AlertCircle size={18} />}
                                title="안내"
                                color="blue"
                                radius="lg"
                                variant="light"
                            >
                                월 구독 상품은 4개월 프로그램 종료 후 분리해서 제공할 예정입니다. 결제 관련 문의는
                                {' '}hmys0205hmys@gmail.com 으로 보내주세요.
                            </Alert>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
