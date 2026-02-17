'use client';

/**
 * 구독 관리 페이지
 * 현재 플랜 + 크레딧 잔액 + 토큰 팩 구매
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

    const isPaid = creditInfo && creditInfo.plan_type !== 'free';
    const planLabel = isPaid ? '올인원 패스' : 'Beta 무료';

    const formatDate = (dateString?: string | null) => {
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
                            {isPaid && (
                                <Progress
                                    value={Math.min(((creditInfo?.credits || 0) / 300) * 100, 100)}
                                    color={
                                        (creditInfo?.credits || 0) > 50 ? 'violet' :
                                        (creditInfo?.credits || 0) > 10 ? 'orange' : 'red'
                                    }
                                    size="md" radius="xl"
                                />
                            )}
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* 번들 미구매자 → 업그레이드 CTA */}
                {!isPaid && (
                    <Card padding="xl" radius="xl" style={{ border: '2px solid #8b5cf6' }}>
                        <Group justify="space-between" align="center" wrap="wrap" gap="lg">
                            <Group gap="md">
                                <Package size={32} color="#8b5cf6" />
                                <Box>
                                    <Title order={4} style={{ color: '#111827' }}>올인원 패스로 업그레이드</Title>
                                    <Text size="sm" c="gray.6">
                                        강의 59강 + AI 스크립트 6개월 + 크레딧 300개
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

                {/* 토큰 팩 — 유료 사용자용 */}
                {isPaid && (
                    <Box>
                        <Group gap="sm" mb="lg">
                            <Coins size={24} color="#8b5cf6" />
                            <Title order={4} style={{ color: '#111827' }}>크레딧 추가 구매</Title>
                        </Group>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                            <Card padding="lg" radius="xl" withBorder style={{ cursor: 'pointer' }}>
                                <Group justify="space-between">
                                    <Box>
                                        <Text fw={600} size="lg" style={{ color: '#111827' }}>30 크레딧</Text>
                                        <Text size="sm" c="gray.5">스크립트 약 30회 생성</Text>
                                    </Box>
                                    <Box ta="right">
                                        <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩9,900</Text>
                                        <Button size="xs" variant="light" color="violet" radius="lg" mt="xs">
                                            구매하기
                                        </Button>
                                    </Box>
                                </Group>
                            </Card>
                            <Card padding="lg" radius="xl" style={{ border: '2px solid #8b5cf6', cursor: 'pointer' }}>
                                <Group justify="space-between">
                                    <Box>
                                        <Group gap="xs">
                                            <Text fw={600} size="lg" style={{ color: '#111827' }}>100 크레딧</Text>
                                            <Badge size="xs" color="green" variant="light">인기</Badge>
                                        </Group>
                                        <Text size="sm" c="gray.5">스크립트 약 100회 생성</Text>
                                    </Box>
                                    <Box ta="right">
                                        <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩29,900</Text>
                                        <Text size="xs" c="green">개당 ₩299</Text>
                                        <Button size="xs" color="violet" radius="lg" mt="xs"
                                            style={{ background: '#8b5cf6' }}
                                        >
                                            구매하기
                                        </Button>
                                    </Box>
                                </Group>
                            </Card>
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
