'use client';

/**
 * 대시보드 메인 콘텐츠
 * DB 연동: Supabase에서 최근 프로젝트 조회
 */

import { useState, useEffect } from 'react';
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
    ThemeIcon,
    Table,
    ActionIcon,
    Tooltip,
    Loader,
    Progress,
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
    Loader2,
    BookOpen,
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

// 프로젝트 타입 정의
interface ProjectItem {
    id: string;
    title: string;
    createdAt: string;
    versions: number;
    archetype: string;
}

// 아키타입 한글 이름
const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '겉보기 vs 실제',
    'EXTREME_METRIC_VARIANT': '극단 수치형',
    'TOOL_FORCE': '도구 위력형',
    'PHENOMENON_SITE': '현상 현장형',
    'HIDDEN_SCENE_DAILY': '숨겨진 장면형',
    'UNKNOWN': '기타',
};

// 전체 VOD 수 (강의실 데이터와 동기화)
const TOTAL_LECTURE_VODS = 32;

export function DashboardContent({ user, subscription }: DashboardContentProps) {
    // 프로젝트 데이터 상태
    const [projects, setProjects] = useState<ProjectItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // 수강 진도 상태
    const [completedVodCount, setCompletedVodCount] = useState(0);

    // DB에서 최근 프로젝트 + 수강 진도 불러오기
    useEffect(() => {
        async function fetchProjects() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/scripts/history');
                const data = await response.json();

                if (data.success) {
                    // 최근 5개만 표시
                    setProjects(data.scripts.slice(0, 5));
                }
            } catch {
                // 에러 시 빈 배열
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchLectureProgress() {
            try {
                const res = await fetch('/api/lectures/progress');
                const data = await res.json();
                if (data.success) {
                    setCompletedVodCount((data.completedVods || []).length);
                }
            } catch {
                // 에러 시 0 유지
            }
        }

        fetchProjects();
        fetchLectureProgress();
    }, []);

    const usedCredits = projects.length;

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 + 크레딧 */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        <Title order={2} style={{ color: '#111827' }}>
                            안녕하세요, {user?.email?.split('@')[0] || 'User'}님!
                        </Title>
                        <Text c="gray.6" mt={4}>
                            나만의 매직 스크립트 대시보드입니다
                        </Text>
                    </Box>

                    {/* Beta 배지 */}
                    <Badge
                        size="xl"
                        radius="lg"
                        variant="light"
                        color="violet"
                        style={{ padding: '12px 20px', fontSize: 14 }}
                    >
                        Beta 무료 체험 중
                    </Badge>
                </Group>

                {/* 액션 카드 2개 - Streamlit 스타일 */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* 새 프로젝트 */}
                    <Card
                        padding="xl"
                        radius="xl"
                        style={{
                            background: '#8b5cf6',
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/icons/icon-magic.png" alt="" width={48} height={48} style={{ objectFit: 'contain' }} />
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
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/icons/icon-search.png" alt="" width={48} height={48} style={{ objectFit: 'contain' }} />
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

                {/* 수강 진도 카드 */}
                <Card padding="lg" radius="xl" withBorder>
                    <Group justify="space-between" align="center">
                        <Group gap="md">
                            <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                                <BookOpen size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text fw={600} style={{ color: '#111827' }}>
                                    수강 진도
                                </Text>
                                <Text size="sm" c="gray.5">
                                    {completedVodCount}/{TOTAL_LECTURE_VODS}강 완료
                                </Text>
                            </Box>
                        </Group>
                        <Button
                            component={Link}
                            href="/dashboard/lectures"
                            variant="light"
                            color="violet"
                            radius="lg"
                            size="sm"
                            rightSection={<ArrowRight size={16} />}
                        >
                            강의실로 이동
                        </Button>
                    </Group>
                    <Progress
                        value={TOTAL_LECTURE_VODS > 0 ? Math.round((completedVodCount / TOTAL_LECTURE_VODS) * 100) : 0}
                        color="violet"
                        size="md"
                        radius="xl"
                        mt="md"
                    />
                </Card>

                {/* 사용량 통계 */}
                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                    <Card padding="lg" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">이번 달 사용량</Text>
                                <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                                    <TrendingUp size={20} />
                                </ThemeIcon>
                            </Group>
                            <Box>
                                <Group gap="xs" align="baseline">
                                    <Title order={3} style={{ color: '#111827' }}>
                                        {usedCredits}
                                    </Title>
                                    <Text size="sm" c="gray.5">회 생성</Text>
                                </Group>
                            </Box>
                        </Stack>
                    </Card>

                    <Card padding="lg" radius="xl" withBorder>
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">총 프로젝트</Text>
                                <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                                    <Sparkles size={20} />
                                </ThemeIcon>
                            </Group>
                            <Title order={3} style={{ color: '#111827' }}>
                                {projects.length}개
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
                        <Group gap="sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src="/images/icons/icon-document.png" alt="" width={28} height={28} style={{ objectFit: 'contain' }} />
                            <Title order={4}>최근 프로젝트</Title>
                        </Group>
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
                        {isLoading ? (
                            <Box p="xl" ta="center">
                                <Group justify="center" gap="sm">
                                    <Loader size="sm" color="violet" />
                                    <Text c="gray.6">불러오는 중...</Text>
                                </Group>
                            </Box>
                        ) : projects.length > 0 ? (
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
                                    {projects.map((project) => (
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
                                                    {ARCHETYPE_NAMES[project.archetype] || project.archetype}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Tooltip label="수정">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="blue"
                                                            component={Link}
                                                            href={`/dashboard/archive?id=${project.id}`}
                                                        >
                                                            <Pencil size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="삭제">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() => alert('삭제 기능은 현재 준비 중입니다.')}
                                                        >
                                                            <Trash2 size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Box p="xl" ta="center">
                                <Text c="gray.5">
                                    아직 생성된 프로젝트가 없습니다. 새 프로젝트를 시작해보세요!
                                </Text>
                                <Button
                                    component={Link}
                                    href="/dashboard/scripts"
                                    variant="light"
                                    color="violet"
                                    mt="md"
                                >
                                    ✨ 새 스크립트 만들기
                                </Button>
                            </Box>
                        )}
                    </Card>
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
                                Pro 팁
                            </Text>
                            <Text size="sm" style={{ color: '#B45309' }}>
                                참고 스크립트를 최대한 자세히 입력하면 더 좋은 결과를 얻을 수 있어요!
                            </Text>
                        </Box>
                    </Group>
                </Card>
            </Stack>
        </Container >
    );
}
