'use client';

import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
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

import { Link } from '@/i18n/routing';
import {
    TOSSPAY_PLAN_CONFIG,
    getPlanLabel,
    isActiveAccessPlan,
    isInitialProgramPlan,
    isMonthlySubscriberPlan,
    type AppPlanType,
} from '@/lib/plans/config';
import { useTossPay } from '@/hooks/useTossPay';

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
    const hasActiveAccess = isActiveAccessPlan(creditInfo?.plan_type, creditInfo?.expires_at);
    const activePlanLabel = getPlanLabel(creditInfo?.plan_type);
    const isInitialProgram = isInitialProgramPlan(creditInfo?.plan_type);
    const isMonthlySubscriber = isMonthlySubscriberPlan(creditInfo?.plan_type);

    return (
        <Box style={{ minHeight: '100vh', background: '#fafafa' }}>
            <Container size="md" py={80}>
                <Stack gap="xl">
                    <Group justify="space-between" align="center">
                        <Button
                            component={Link}
                            href="/pricing"
                            variant="subtle"
                            color="gray"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            가격 페이지로
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
                            로그인은 끝났습니다. 이 화면에서 상품 내용을 확인하고 결제를 진행하면 됩니다.
                        </Text>
                    </Stack>

                    {hasActiveAccess ? (
                        <Alert
                            color="violet"
                            radius="xl"
                            variant="light"
                            icon={<ShieldCheck size={18} />}
                            title="이미 활성 이용권이 있습니다"
                        >
                            현재 플랜은 {activePlanLabel}이고, 만료일은 {formatDate(creditInfo?.expires_at)}입니다.
                            {isInitialProgram && ' 아직 올인원 패스가 살아 있으므로 중복 결제는 막는 편이 안전합니다.'}
                            {isMonthlySubscriber && ' 월 구독 상태에서도 추가 토큰은 대시보드에서 별도로 구매할 수 있습니다.'}
                        </Alert>
                    ) : (
                        <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6', background: '#fff' }}>
                            <Stack gap="lg">
                                <Box>
                                    <Group gap="xs" mb={6}>
                                        <Crown size={20} color="#8b5cf6" />
                                        <Text fw={700} size="xl" style={{ color: '#111827' }}>
                                            올인원 패스
                                        </Text>
                                    </Group>
                                    <Text size="sm" c="gray.6">
                                        강의 {plan.months}개월 + 프로그램 {plan.months}개월 + 매달 {plan.monthlyCredits.toLocaleString()}cr 지급
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
                                        총 {plan.totalCredits.toLocaleString()}cr 설계
                                    </Badge>
                                </Group>

                                <Divider />

                                <Stack gap={6}>
                                    <Text size="sm" c="gray.6">
                                        결제 직후 {plan.initialCredits.toLocaleString()}cr 지급
                                    </Text>
                                    <Text size="sm" c="gray.6">
                                        이후 매달 {plan.monthlyCredits.toLocaleString()}cr씩 총 {plan.months}회 지급
                                    </Text>
                                </Stack>

                                <Button
                                    color="violet"
                                    radius="lg"
                                    size="lg"
                                    loading={loading}
                                    onClick={() => requestPayment('allinone')}
                                >
                                    결제창 열기
                                </Button>

                                {error && (
                                    <Alert color="red" radius="lg" variant="light" icon={<AlertCircle size={18} />}>
                                        {error}
                                    </Alert>
                                )}
                            </Stack>
                        </Card>
                    )}

                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group gap="xs">
                                <Crown size={18} color="#8b5cf6" />
                                <Text fw={700} style={{ color: '#111827' }}>
                                    결제 후 바로 열리는 것
                                </Text>
                            </Group>
                            <List spacing={10} size="sm" center>
                                {[
                                    '강의 4개월 이용권',
                                    '프로그램 4개월 참여',
                                    `결제 직후 ${plan.initialCredits.toLocaleString()}cr 지급`,
                                    `이후 매달 ${plan.monthlyCredits.toLocaleString()}cr씩 추가 지급`,
                                    '성공 후 바로 대시보드와 강의 접근 가능',
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
                        </Stack>
                    </Card>

                    <Text size="xs" c="gray.5" ta="center">
                        결제 문제나 계정 연결 이슈가 생기면 hmys0205hmys@gmail.com 으로 문의하면 됩니다.
                    </Text>
                </Stack>
            </Container>
        </Box>
    );
}
