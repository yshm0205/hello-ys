'use client';

/**
 * 설정 페이지 콘텐츠
 * 탭: 프로필 | 플랜 & 결제
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
    Avatar,
    Divider,
    SimpleGrid,
    Tabs,
    Progress,
    Alert,
} from '@mantine/core';
import {
    User,
    Mail,
    Calendar,
    LogOut,
    Shield,
    Crown,
    Zap,
    AlertCircle,
    Coins,
    Package,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

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
}

export function SettingsContent({ user, subscription }: SettingsContentProps) {
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
    const planLabel = isPro ? 'Pro 구독' : isAllinone ? '올인원 패스' : 'Beta 무료';

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const maxCredits = isPro ? 500 : isAllinone ? 3000 : 30;

    return (
        <Container size="md" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Box>
                    <Title order={2} style={{ color: '#111827' }}>
                        설정
                    </Title>
                    <Text c="gray.6" mt={4}>
                        계정 정보 및 플랜을 관리하세요
                    </Text>
                </Box>

                {/* 탭 */}
                <Tabs defaultValue="profile" color="violet">
                    <Tabs.List>
                        <Tabs.Tab value="profile" leftSection={<User size={16} />}>
                            프로필
                        </Tabs.Tab>
                        <Tabs.Tab value="plan" leftSection={<Crown size={16} />}>
                            플랜 & 결제
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* ── 프로필 탭 ── */}
                    <Tabs.Panel value="profile" pt="xl">
                        <Stack gap="xl">
                            {/* 프로필 카드 */}
                            <Card padding="xl" radius="xl" withBorder>
                                <Stack gap="lg">
                                    <Group gap="md">
                                        <Avatar size="xl" radius="xl" color="violet">
                                            {user?.email?.[0]?.toUpperCase() || 'U'}
                                        </Avatar>
                                        <Box>
                                            <Title order={4} style={{ color: '#111827' }}>
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

                            {/* YouTube 연결 카드 */}
                            <Card padding="xl" radius="xl" withBorder>
                                <Stack gap="lg">
                                    <Group gap="sm">
                                        <Box style={{
                                            width: 24, height: 24, borderRadius: 4,
                                            background: '#FF0000', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                                                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                            </svg>
                                        </Box>
                                        <Title order={4}>YouTube 채널 연결</Title>
                                    </Group>

                                    <Text size="sm" c="gray.6">
                                        YouTube 채널을 연결하면 영상별 조회수, 좋아요, 평균 시청률 등의 통계를 확인할 수 있습니다.
                                    </Text>

                                    <Box style={{
                                        background: 'rgba(255, 0, 0, 0.03)',
                                        borderRadius: 16, padding: 20,
                                    }}>
                                        <Group justify="space-between" align="center">
                                            <Box>
                                                <Text size="sm" c="gray.6">연결 상태</Text>
                                                <Text fw={500}>연결되지 않음</Text>
                                            </Box>
                                            <Button
                                                component="a" href="/api/youtube/auth"
                                                radius="lg"
                                                style={{ background: '#FF0000', border: 'none' }}
                                            >
                                                YouTube 연결하기
                                            </Button>
                                        </Group>
                                    </Box>
                                </Stack>
                            </Card>

                            {/* 보안 카드 */}
                            <Card padding="xl" radius="xl" withBorder>
                                <Stack gap="lg">
                                    <Group gap="sm">
                                        <Shield size={24} color="#22c55e" />
                                        <Title order={4}>보안</Title>
                                    </Group>

                                    <Text size="sm" c="gray.6">
                                        Google 계정으로 로그인되어 있습니다. 비밀번호 변경은 Google 계정 설정에서 가능합니다.
                                    </Text>

                                    <Divider />

                                    <Group justify="space-between" align="center">
                                        <Box>
                                            <Text fw={500}>로그아웃</Text>
                                            <Text size="sm" c="gray.5">현재 기기에서 로그아웃합니다</Text>
                                        </Box>
                                        <Button
                                            component="a" href="/api/auth/signout"
                                            variant="light" color="red"
                                            leftSection={<LogOut size={18} />}
                                        >
                                            로그아웃
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Stack>
                    </Tabs.Panel>

                    {/* ── 플랜 & 결제 탭 ── */}
                    <Tabs.Panel value="plan" pt="xl">
                        <Stack gap="xl">
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
                                                매월 500 크레딧 충전 · ₩39,900/월
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

                            {/* 미구매자 → 올인원 업그레이드 CTA */}
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
                                                component={Link} href="/pricing"
                                                color="violet" radius="lg" mt="xs" fullWidth
                                                style={{ background: '#8b5cf6' }}
                                            >
                                                자세히 보기
                                            </Button>
                                        </Box>
                                    </Group>
                                </Card>
                            )}

                            {/* 크레딧 추가 구매 — 유료 사용자용 */}
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
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
