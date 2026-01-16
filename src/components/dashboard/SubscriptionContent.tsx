'use client';

/**
 * 구독 관리 페이지 콘텐츠
 * 현재 플랜 + 업그레이드 옵션
 */

import {
    Container,
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Button,
    Box,
    SimpleGrid,
    List,
    ThemeIcon,
    Alert,
} from '@mantine/core';
import {
    Crown,
    CreditCard,
    Check,
    Sparkles,
    Zap,
    AlertCircle,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

interface SubscriptionContentProps {
    subscription?: {
        plan_name?: string;
        status?: string;
        current_period_end?: string;
        lemon_squeezy_subscription_id?: string;
    } | null;
}

const plans = [
    {
        name: 'Free',
        price: 0,
        features: ['월 3회 생성', '기본 템플릿', '이메일 지원'],
        current: true,
    },
    {
        name: 'Pro',
        price: 19000,
        features: ['무제한 생성', '모든 템플릿', '우선 처리', '히스토리 저장'],
        popular: true,
    },
    {
        name: 'Team',
        price: 49000,
        features: ['무제한 생성', '커스텀 템플릿', '최우선 처리', '전용 지원'],
    },
];

export function SubscriptionContent({ subscription }: SubscriptionContentProps) {
    const currentPlan = subscription?.plan_name || 'Free Plan';
    const isActive = subscription?.status === 'active';

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Box>
                    <Group gap="sm" mb="xs">
                        <Crown size={28} color="#f59e0b" />
                        <Title order={2} style={{ color: '#111827' }}>
                            구독 관리
                        </Title>
                    </Group>
                    <Text c="gray.6">
                        현재 플랜을 확인하고 업그레이드하세요
                    </Text>
                </Box>

                {/* 현재 플랜 카드 */}
                <Card
                    padding="xl"
                    radius="xl"
                    style={{
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                        border: 'none',
                    }}
                >
                    <Group justify="space-between" align="center">
                        <Stack gap="xs">
                            <Text size="sm" c="white" opacity={0.8}>현재 플랜</Text>
                            <Title order={2} c="white">
                                {currentPlan}
                            </Title>
                            <Group gap="sm">
                                <Badge
                                    variant="white"
                                    color={isActive ? 'white' : 'red'}
                                    style={{ color: isActive ? '#8b5cf6' : undefined }}
                                >
                                    {isActive ? '활성' : '만료됨'}
                                </Badge>
                                {subscription?.current_period_end && (
                                    <Text size="sm" c="white" opacity={0.8}>
                                        다음 갱신: {formatDate(subscription.current_period_end)}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                        {subscription?.lemon_squeezy_subscription_id && (
                            <Button
                                variant="white"
                                radius="lg"
                                leftSection={<CreditCard size={18} />}
                                style={{ color: '#8b5cf6' }}
                            >
                                결제 수단 관리
                            </Button>
                        )}
                    </Group>
                </Card>

                {/* 플랜 비교 */}
                <Box>
                    <Title order={4} mb="lg" style={{ color: '#111827' }}>
                        플랜 업그레이드
                    </Title>

                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
                        {plans.map((plan) => {
                            const isCurrent = currentPlan.toLowerCase().includes(plan.name.toLowerCase());
                            return (
                                <Card
                                    key={plan.name}
                                    padding="lg"
                                    radius="xl"
                                    withBorder
                                    style={{
                                        border: plan.popular ? '2px solid #8b5cf6' : undefined,
                                        position: 'relative',
                                    }}
                                >
                                    {plan.popular && (
                                        <Badge
                                            style={{
                                                position: 'absolute',
                                                top: -10,
                                                right: 20,
                                            }}
                                            color="violet"
                                        >
                                            인기
                                        </Badge>
                                    )}

                                    <Stack gap="md">
                                        <Box>
                                            <Text fw={600} size="lg">{plan.name}</Text>
                                            <Group gap="xs" align="baseline" mt="xs">
                                                <Text style={{ fontSize: 28, fontWeight: 700 }}>
                                                    ₩{plan.price.toLocaleString()}
                                                </Text>
                                                {plan.price > 0 && <Text size="sm" c="gray.5">/월</Text>}
                                            </Group>
                                        </Box>

                                        <List
                                            spacing="xs"
                                            size="sm"
                                            center
                                            icon={
                                                <ThemeIcon size={18} radius="xl" color="green" variant="light">
                                                    <Check size={12} />
                                                </ThemeIcon>
                                            }
                                        >
                                            {plan.features.map((feature, i) => (
                                                <List.Item key={i}>{feature}</List.Item>
                                            ))}
                                        </List>

                                        <Button
                                            component={Link}
                                            href="/pricing"
                                            variant={isCurrent ? 'light' : plan.popular ? 'filled' : 'outline'}
                                            color="violet"
                                            fullWidth
                                            radius="lg"
                                            disabled={isCurrent}
                                            style={
                                                plan.popular && !isCurrent
                                                    ? {
                                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                                        border: 'none',
                                                    }
                                                    : undefined
                                            }
                                        >
                                            {isCurrent ? '현재 플랜' : '선택하기'}
                                        </Button>
                                    </Stack>
                                </Card>
                            );
                        })}
                    </SimpleGrid>
                </Box>

                {/* 도움말 */}
                <Alert
                    icon={<AlertCircle size={18} />}
                    title="도움이 필요하세요?"
                    color="blue"
                    radius="lg"
                    variant="light"
                >
                    구독 관련 문의는 support@flowspot.app으로 이메일을 보내주세요.
                </Alert>
            </Stack>
        </Container>
    );
}
