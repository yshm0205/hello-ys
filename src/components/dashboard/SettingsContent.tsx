'use client';

/**
 * 설정 페이지 콘텐츠
 * 프로필, 구독, 계정 관리
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
    Avatar,
    Divider,
    SimpleGrid,
} from '@mantine/core';
import {
    User,
    Mail,
    Calendar,
    CreditCard,
    LogOut,
    Shield,
    Crown,
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

export function SettingsContent({ user, subscription }: SettingsContentProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Container size="md" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Box>
                    <Title order={2} style={{ color: '#111827' }}>
                        설정
                    </Title>
                    <Text c="gray.6" mt={4}>
                        계정 정보 및 구독을 관리하세요
                    </Text>
                </Box>

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
                                <Box
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'rgba(139, 92, 246, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <Mail size={20} color="#8b5cf6" />
                                </Box>
                                <Box>
                                    <Text size="xs" c="gray.5">이메일</Text>
                                    <Text size="sm" fw={500}>{user?.email || '-'}</Text>
                                </Box>
                            </Group>

                            <Group gap="md">
                                <Box
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 10,
                                        background: 'rgba(6, 182, 212, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
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

                {/* 구독 카드 */}
                <Card padding="xl" radius="xl" withBorder>
                    <Stack gap="lg">
                        <Group justify="space-between">
                            <Group gap="sm">
                                <Crown size={24} color="#f59e0b" />
                                <Title order={4}>구독 정보</Title>
                            </Group>
                            <Badge
                                size="lg"
                                variant="light"
                                color={subscription?.status === 'active' ? 'green' : 'gray'}
                            >
                                {subscription?.status === 'active' ? '활성' : '비활성'}
                            </Badge>
                        </Group>

                        <Box
                            style={{
                                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                                borderRadius: 16,
                                padding: 20,
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Box>
                                    <Text size="sm" c="gray.6">현재 플랜</Text>
                                    <Title order={3} style={{ color: '#111827' }}>
                                        {subscription?.plan_name || 'Free Plan'}
                                    </Title>
                                    {subscription?.current_period_end && (
                                        <Text size="xs" c="gray.5" mt={4}>
                                            다음 갱신: {formatDate(subscription.current_period_end)}
                                        </Text>
                                    )}
                                </Box>
                                <Button
                                    component={Link}
                                    href="/pricing"
                                    radius="lg"
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                        border: 'none',
                                    }}
                                >
                                    플랜 업그레이드
                                </Button>
                            </Group>
                        </Box>

                        <Group gap="md">
                            <Button
                                component={Link}
                                href="/subscription"
                                variant="light"
                                color="gray"
                                leftSection={<CreditCard size={18} />}
                            >
                                결제 관리
                            </Button>
                        </Group>
                    </Stack>
                </Card>

                {/* YouTube 연결 카드 */}
                <Card padding="xl" radius="xl" withBorder>
                    <Stack gap="lg">
                        <Group gap="sm">
                            <Box
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: 4,
                                    background: '#FF0000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                                </svg>
                            </Box>
                            <Title order={4}>YouTube 채널 연결</Title>
                        </Group>

                        <Text size="sm" c="gray.6">
                            YouTube 채널을 연결하면 영상별 조회수, 좋아요, 평균 시청률 등의 통계를 확인할 수 있습니다.
                        </Text>

                        <Box
                            style={{
                                background: 'linear-gradient(135deg, rgba(255, 0, 0, 0.05) 0%, rgba(255, 100, 100, 0.05) 100%)',
                                borderRadius: 16,
                                padding: 20,
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Box>
                                    <Text size="sm" c="gray.6">연결 상태</Text>
                                    <Text fw={500}>연결되지 않음</Text>
                                </Box>
                                <Button
                                    component="a"
                                    href="/api/youtube/auth"
                                    radius="lg"
                                    style={{
                                        background: '#FF0000',
                                        border: 'none',
                                    }}
                                >
                                    🔗 YouTube 연결하기
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
                                <Text size="sm" c="gray.5">
                                    현재 기기에서 로그아웃합니다
                                </Text>
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
        </Container>
    );
}
