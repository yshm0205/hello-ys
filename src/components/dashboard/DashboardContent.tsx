'use client';

/**
 * 대시보드 메인 콘텐츠
 * Streamlit 기능 반영: 크레딧, 프로젝트 카드, 최근 프로젝트 목록
 */

import {
    Container,
    Title,
    Text,
    Card,
    SimpleGrid,
    Stack,
    Group,
    Badge,
    Button,
    Box,
    Progress,
    ThemeIcon,
    Table,
    ActionIcon,
    Tooltip,
} from '@mantine/core';
import {
    Sparkles,
    CreditCard,
    TrendingUp,
    Clock,
    ArrowRight,
    Zap,
    TestTube,
    Pencil,
    Trash2,
    Coins,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

interface DashboardContentProps {
    user?: { email?: string };
    subscription?: {
        plan_name?: string;
        status?: string;
        current_period_end?: string;
    } | null;
}

// 목 데이터: 최근 프로젝트
const mockProjects = [
    {
        id: '1',
        title: '일본 건설 현장의 비밀...',
        createdAt: '2026-01-15 21:30',
        versions: 3,
        archetype: '겉보기 vs 실제',
    },
    {
        id: '2',
        title: '사막에서 차에 엔진 오일을...',
        createdAt: '2026-01-14 15:22',
        versions: 3,
        archetype: '현상 현장형',
    },
    {
        id: '3',
        title: '소금 호수가 분홍색인 이유...',
        createdAt: '2026-01-13 10:15',
        versions: 3,
        archetype: '극단 수치형',
    },
];

export function DashboardContent({ user, subscription }: DashboardContentProps) {
    const credits = 47; // 목 데이터: 크레딧 잔액
    const usedCredits = 3;
    const totalCredits = subscription?.plan_name === 'Free Plan' ? 50 : 500;
    const usagePercent = (usedCredits / totalCredits) * 100;

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 + 크레딧 */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        <Title order={2} style={{ color: '#111827' }}>
                            👋 안녕하세요, {user?.email?.split('@')[0] || 'User'}님!
                        </Title>
                        <Text c="gray.6" mt={4}>
                            나만의 매직 스크립트 대시보드입니다
                        </Text>
                    </Box>

                    {/* 크레딧 카드 - Streamlit 스타일 */}
                    <Card
                        padding="md"
                        radius="lg"
                        style={{
                            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                            border: '1px solid #3b82f6',
                            minWidth: 140,
                        }}
                    >
                        <Stack gap={2} align="center">
                            <Text size="xs" c="gray.5">보유 크레딧</Text>
                            <Group gap="xs">
                                <Text
                                    style={{
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: '#60a5fa',
                                    }}
                                >
                                    {credits}
                                </Text>
                                <Coins size={24} color="#fbbf24" />
                            </Group>
                        </Stack>
                    </Card>
                </Group>

                {/* 액션 카드 2개 - Streamlit 스타일 */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* 새 프로젝트 */}
                    <Card
                        padding="xl"
                        radius="xl"
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <Stack gap="sm">
                            <Text style={{ fontSize: 32 }}>✨</Text>
                            <Title order={4} c="white">새 프로젝트 만들기</Title>
                            <Text size="sm" c="white" opacity={0.8}>
                                아이디어만 있으면 3가지 버전의 스크립트가 뚝딱!
                            </Text>
                            <Button
                                component={Link}
                                href="/dashboard/scripts"
                                variant="white"
                                color="violet"
                                radius="lg"
                                mt="sm"
                                rightSection={<ArrowRight size={18} />}
                            >
                                프로젝트 시작하기
                            </Button>
                        </Stack>
                    </Card>

                    {/* 성공 요인 분석 */}
                    <Card
                        padding="xl"
                        radius="xl"
                        withBorder
                        style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.borderColor = '#60a5fa';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.borderColor = '';
                        }}
                    >
                        <Stack gap="sm">
                            <Text style={{ fontSize: 32 }}>🧪</Text>
                            <Title order={4}>성공 요인 분석</Title>
                            <Text size="sm" c="gray.6">
                                내 채널의 데이터와 스크립트를 분석하여 승리 패턴을 찾습니다
                            </Text>
                            <Button
                                variant="light"
                                color="blue"
                                radius="lg"
                                mt="sm"
                                leftSection={<TestTube size={18} />}
                            >
                                분석실 이동하기
                            </Button>
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* 사용량 통계 */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Card padding="lg" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">이번 달 사용량</Text>
                                <ThemeIcon size="lg" radius="lg" color="pink" variant="light">
                                    <TrendingUp size={20} />
                                </ThemeIcon>
                            </Group>
                            <Box>
                                <Group gap="xs" align="baseline">
                                    <Title order={3} style={{ color: '#111827' }}>
                                        {usedCredits}
                                    </Title>
                                    <Text size="sm" c="gray.5">/ {totalCredits} 회</Text>
                                </Group>
                                <Progress
                                    value={usagePercent}
                                    size="sm"
                                    radius="xl"
                                    color="pink"
                                    mt="sm"
                                />
                            </Box>
                        </Stack>
                    </Card>

                    <Card padding="lg" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">총 생성 스크립트</Text>
                                <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                                    <Sparkles size={20} />
                                </ThemeIcon>
                            </Group>
                            <Title order={3} style={{ color: '#111827' }}>
                                {mockProjects.length * 3}개
                            </Title>
                        </Stack>
                    </Card>

                    <Card padding="lg" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">플랜</Text>
                                <ThemeIcon size="lg" radius="lg" color="cyan" variant="light">
                                    <CreditCard size={20} />
                                </ThemeIcon>
                            </Group>
                            <Group gap="sm">
                                <Title order={3} style={{ color: '#111827' }}>
                                    {subscription?.plan_name || 'Free'}
                                </Title>
                                <Badge color="green" variant="light">활성</Badge>
                            </Group>
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* 최근 프로젝트 - Streamlit 스타일 */}
                <Box>
                    <Group justify="space-between" mb="md">
                        <Title order={4}>🗂️ 최근 프로젝트</Title>
                        <Button
                            component={Link}
                            href="/dashboard/archive"
                            variant="subtle"
                            size="sm"
                        >
                            전체 보기
                        </Button>
                    </Group>

                    <Card padding={0} radius="lg" withBorder>
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>제목</Table.Th>
                                    <Table.Th>생성일</Table.Th>
                                    <Table.Th>버전</Table.Th>
                                    <Table.Th>스타일</Table.Th>
                                    <Table.Th style={{ width: 100 }}>액션</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {mockProjects.map((project) => (
                                    <Table.Tr key={project.id}>
                                        <Table.Td>
                                            <Text fw={500}>{project.title}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="gray.6">{project.createdAt}</Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="light" color="violet">
                                                {project.versions}개 버전
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge variant="outline" color="gray">
                                                {project.archetype}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs">
                                                <Tooltip label="수정">
                                                    <ActionIcon variant="subtle" color="blue">
                                                        <Pencil size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="삭제">
                                                    <ActionIcon variant="subtle" color="red">
                                                        <Trash2 size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Card>

                    {mockProjects.length === 0 && (
                        <Card padding="xl" radius="lg" withBorder ta="center">
                            <Text c="gray.5">
                                아직 생성된 프로젝트가 없습니다. 위 버튼을 눌러 시작해보세요!
                            </Text>
                        </Card>
                    )}
                </Box>

                {/* Pro 팁 */}
                <Card
                    padding="lg"
                    radius="xl"
                    style={{
                        background: '#FEF3C7',
                        border: '1px solid #FCD34D',
                    }}
                >
                    <Group gap="md">
                        <ThemeIcon size="lg" radius="lg" color="yellow" variant="filled">
                            <Zap size={20} />
                        </ThemeIcon>
                        <Box>
                            <Text fw={600} style={{ color: '#92400E' }}>
                                💡 Pro 팁
                            </Text>
                            <Text size="sm" style={{ color: '#B45309' }}>
                                참고 스크립트를 최대한 자세히 입력하면 더 좋은 결과를 얻을 수 있어요!
                            </Text>
                        </Box>
                    </Group>
                </Card>
            </Stack>
        </Container>
    );
}
