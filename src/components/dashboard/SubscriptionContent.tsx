'use client';

/**
 * 구독 관리 페이지
 * 현재 플랜 + 크레딧 잔액 + Pro 구독 / 추가팩 구매
 */

import { useState, useEffect } from 'react';
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
    Alert,
    Progress,
} from '@mantine/core';
import {
    Crown,
    Zap,
    AlertCircle,
    Coins,
    Package,
    Lock,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

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
}

export function SubscriptionContent({ subscription }: SubscriptionContentProps) {
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/credits');
                if (res.ok) {
                    const data = await res.json();
                    setCreditInfo(data);
                }
            } catch {
                // 에러 시 무시
            }
        }
        fetchCredits();
    }, []);

    const planType = creditInfo?.plan_type || 'free';
    const isPro = planType === 'pro';
    const isAllinone = planType === 'allinone';
    const isPaid = isPro || isAllinone;
    const planLabel = isPro ? 'Pro 구독' : isAllinone ? '올인원 패스' : '무료 체험';

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const maxCredits = isPro ? 500 : isAllinone ? 3000 : 100;

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Box>
                    <Group gap="sm" mb="xs">
                        <Crown size={28} color="#8b5cf6" />
                        <Title order={2} style={{ color: '#111827' }}>
                            플랜 관리
                        </Title>
                    </Group>
                    <Text c="gray.6">
                        현재 플랜과 크레딧을 확인하세요
                    </Text>
                </Box>

                {/* 현재 플랜 + 크레딧 */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* 플랜 카드 */}
                    <Card padding="xl" radius="xl" style={{ background: '#8b5cf6', border: 'none' }}>
                        <Stack gap="xs">
                            <Text size="sm" c="white" opacity={0.8}>현재 플랜</Text>
                            <Title order={2} c="white">{planLabel}</Title>
                            <Group gap="sm">
                                <Badge variant="white" style={{ color: '#8b5cf6' }}>
                                    {isPaid ? '활성' : '무료'}
                                </Badge>
                                {creditInfo?.expires_at && (
                                    <Text size="sm" c="white" opacity={0.8}>
                                        만료: {formatDate(creditInfo.expires_at)}
                                    </Text>
                                )}
                            </Group>
                            {isPro && (
                                <Text size="xs" c="white" opacity={0.7} mt={4}>
                                    매월 500 크레딧 충전
                                </Text>
                            )}
                        </Stack>
                    </Card>

                    {/* 크레딧 카드 */}
                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">잔여 크레딧</Text>
                                <Zap size={20} color="#8b5cf6" />
                            </Group>
                            <Group gap="xs" align="baseline">
                                <Title order={2} style={{ color: '#111827' }}>
                                    {creditInfo ? creditInfo.credits : 0}
                                </Title>
                                <Text size="sm" c="gray.5">크레딧</Text>
                            </Group>
                            <Progress
                                value={Math.min(((creditInfo?.credits || 0) / maxCredits) * 100, 100)}
                                color={
                                    (creditInfo?.credits || 0) > maxCredits * 0.3 ? 'violet' :
                                    (creditInfo?.credits || 0) > maxCredits * 0.1 ? 'orange' : 'red'
                                }
                                size="md" radius="xl"
                            />
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* 미구매자 → 올인원 CTA */}
                {!isPaid && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Group gap="md">
                                <Package size={32} color="#8b5cf6" />
                                <Box>
                                    <Title order={4} style={{ color: '#111827' }}>올인원 패스로 시작하기</Title>
                                    <Text size="sm" c="gray.6">
                                        강의 59강 + AI 스크립트 6개월 + 크레딧 3,000개
                                    </Text>
                                </Box>
                            </Group>
                            <Box>
                                <Group gap="sm" align="baseline">
                                    <Text style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                        ₩700,000
                                    </Text>
                                    <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩500,000</Text>
                                </Group>
                                <Button
                                    component={Link}
                                    href="/pricing"
                                    color="violet" radius="lg" mt="xs" fullWidth
                                    style={{ background: '#8b5cf6' }}
                                >
                                    자세히 보기
                                </Button>
                            </Box>
                        </Group>
                    </Card>
                )}

                {/* 올인원 만료 후 → Pro 구독 안내 */}
                {!isPaid && planType === 'expired' && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Group gap="md">
                                <Zap size={32} color="#8b5cf6" />
                                <Box>
                                    <Title order={4} style={{ color: '#111827' }}>Pro 구독으로 계속 이용하기</Title>
                                    <Text size="sm" c="gray.6">
                                        수강생 전용 — 월 500 크레딧 + 모든 기능
                                    </Text>
                                </Box>
                            </Group>
                            <Box>
                                <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩39,900/월</Text>
                                <Button
                                    color="violet" radius="lg" mt="xs" fullWidth
                                    style={{ background: '#8b5cf6' }}
                                >
                                    Pro 구독 시작
                                </Button>
                            </Box>
                        </Group>
                    </Card>
                )}

                {/* 크레딧 추가 구매 */}
                {isPaid && (
                    <Box>
                        <Group gap="sm" mb="lg">
                            <Coins size={24} color="#8b5cf6" />
                            <Title order={4} style={{ color: '#111827' }}>크레딧 추가 구매</Title>
                        </Group>
                        <Text size="xs" c="gray.5" mb={4}>만료 없음 · 구매 즉시 충전</Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                            {[
                                { cr: 100, price: '₩14,900', per: '₩149', popular: false },
                                { cr: 300, price: '₩34,900', per: '₩116', popular: false },
                                { cr: 500, price: '₩54,900', per: '₩110', popular: true },
                                { cr: 1000, price: '₩99,900', per: '₩100', popular: false },
                            ].map((pack) => (
                                <Card key={pack.cr} padding="lg" radius="xl"
                                    style={pack.popular
                                        ? { border: '2px solid #8b5cf6', cursor: 'pointer' }
                                        : { border: '1px solid #e5e7eb', cursor: 'pointer' }
                                    }
                                >
                                    <Group justify="space-between">
                                        <Box>
                                            <Group gap="xs">
                                                <Text fw={600} size="lg" style={{ color: '#111827' }}>{pack.cr.toLocaleString()} 크레딧</Text>
                                                {pack.popular && <Badge size="xs" color="green" variant="light">인기</Badge>}
                                            </Group>
                                            <Text size="xs" c="gray.5">cr당 {pack.per}</Text>
                                        </Box>
                                        <Box ta="right">
                                            <Text fw={700} size="lg" style={{ color: '#8b5cf6' }}>{pack.price}</Text>
                                            <Button size="xs" variant={pack.popular ? 'filled' : 'light'} color="violet" radius="lg" mt="xs"
                                                style={pack.popular ? { background: '#8b5cf6' } : undefined}
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

                {/* 도움말 */}
                <Alert
                    icon={<AlertCircle size={18} />}
                    title="도움이 필요하세요?"
                    color="blue" radius="lg" variant="light"
                >
                    플랜 및 결제 관련 문의는 hmys0205hmys@gmail.com으로 이메일을 보내주세요.
                </Alert>
            </Stack>
        </Container>
    );
}
