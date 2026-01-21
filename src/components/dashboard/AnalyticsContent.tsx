'use client';

/**
 * 성과 분석 페이지 콘텐츠
 * Streamlit 기능 반영: 채널 통계, 스타일별 성과, 인사이트
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
    Table,
    Alert,
    Progress,
    ThemeIcon,
    Tabs,
    Loader,
    Center,
} from '@mantine/core';
import {
    TestTube,
    Youtube,
    Users,
    Eye,
    Clock,
    TrendingUp,
    TrendingDown,
    Lightbulb,
    RefreshCw,
    BarChart3,
    Target,
    Zap,
    Link2,
    ThumbsUp,
    MessageCircle,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// YouTube 채널 및 영상 타입
interface YouTubeChannel {
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
}

interface YouTubeVideo {
    id: string;
    title: string;
    thumbnail: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
}

interface YouTubeStats {
    connected: boolean;
    channel: YouTubeChannel | null;
    videos: YouTubeVideo[];
    error?: string;
}

// 아키타입 한글 이름
const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '🔄 반전형 (겉보기와 다른)',
    'EXTREME_METRIC_VARIANT': '📊 충격 수치형 (놀라운 숫자)',
    'TOOL_FORCE': '🔧 도구 위력형 (강력한 기능)',
    'PHENOMENON_SITE': '👁️ 현상 관찰형 (신기한 장면)',
    'HIDDEN_SCENE_DAILY': '🎬 숨겨진 장면형',
};

// Mock 데이터: 채널 정보
const mockChannel = {
    title: 'FlowSpot 테스트 채널',
    subscriberCount: 12500,
    videoCount: 48,
    viewCount: 1250000,
};

// Mock 데이터: 연결된 영상 분석
const mockVideoAnalytics = [
    {
        id: '1',
        title: '일본 건설 현장의 비밀',
        views: 45000,
        avgViewPct: 68.5,
        avgViewDuration: 42,
        subsGained: 120,
        hookStyle: 'APPEARANCE_VS_REALITY',
        isAboveAvg: true,
    },
    {
        id: '2',
        title: '사막에서 차에 엔진 오일을 뿌리는 이유',
        views: 32000,
        avgViewPct: 55.2,
        avgViewDuration: 35,
        subsGained: 85,
        hookStyle: 'PHENOMENON_SITE',
        isAboveAvg: true,
    },
    {
        id: '3',
        title: '소금 호수가 분홍색인 이유',
        views: 28000,
        avgViewPct: 52.1,
        avgViewDuration: 33,
        subsGained: 62,
        hookStyle: 'EXTREME_METRIC_VARIANT',
        isAboveAvg: false,
    },
    {
        id: '4',
        title: '화물선 선원들의 극한 일상',
        views: 18000,
        avgViewPct: 48.3,
        avgViewDuration: 28,
        subsGained: 45,
        hookStyle: 'HIDDEN_SCENE_DAILY',
        isAboveAvg: false,
    },
    {
        id: '5',
        title: '트랙터의 무시무시한 위력',
        views: 52000,
        avgViewPct: 72.1,
        avgViewDuration: 48,
        subsGained: 150,
        hookStyle: 'TOOL_FORCE',
        isAboveAvg: true,
    },
];

// 스타일별 성과 계산
const calculateStylePerformance = () => {
    const grouped: Record<string, { views: number[]; retention: number[]; count: number }> = {};

    mockVideoAnalytics.forEach((v) => {
        if (!grouped[v.hookStyle]) {
            grouped[v.hookStyle] = { views: [], retention: [], count: 0 };
        }
        grouped[v.hookStyle].views.push(v.views);
        grouped[v.hookStyle].retention.push(v.avgViewPct);
        grouped[v.hookStyle].count++;
    });

    return Object.entries(grouped)
        .map(([style, data]) => ({
            style,
            avgViews: Math.round(data.views.reduce((a, b) => a + b, 0) / data.count),
            avgRetention: (data.retention.reduce((a, b) => a + b, 0) / data.count).toFixed(1),
            count: data.count,
        }))
        .sort((a, b) => b.avgViews - a.avgViews);
};

export function AnalyticsContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<string | null>('youtube');

    // YouTube 연동 상태
    const [youtubeStats, setYoutubeStats] = useState<YouTubeStats | null>(null);
    const [youtubeLoading, setYoutubeLoading] = useState(true);

    // YouTube 데이터 가져오기
    useEffect(() => {
        const fetchYoutubeStats = async () => {
            try {
                const res = await fetch('/api/youtube/stats');
                const data = await res.json();
                setYoutubeStats(data);
            } catch (error) {
                console.error('Failed to fetch YouTube stats:', error);
                setYoutubeStats({ connected: false, channel: null, videos: [] });
            } finally {
                setYoutubeLoading(false);
            }
        };
        fetchYoutubeStats();
    }, []);

    const channelAvgViews = youtubeStats?.channel?.viewCount
        ? Math.round(youtubeStats.channel.viewCount / (youtubeStats.channel.videoCount || 1))
        : 30000;
    const linkedAvgViews = mockVideoAnalytics.reduce((a, b) => a + b.views, 0) / mockVideoAnalytics.length;
    const linkedAvgRetention = mockVideoAnalytics.reduce((a, b) => a + b.avgViewPct, 0) / mockVideoAnalytics.length;

    const stylePerformance = calculateStylePerformance();
    const bestStyle = stylePerformance[0];

    const aboveAvgVideos = mockVideoAnalytics.filter((v) => v.isAboveAvg);
    const belowAvgVideos = mockVideoAnalytics.filter((v) => !v.isAboveAvg);

    const handleRefresh = async () => {
        setIsLoading(true);
        setYoutubeLoading(true);
        try {
            const res = await fetch('/api/youtube/stats');
            const data = await res.json();
            setYoutubeStats(data);
        } catch (error) {
            console.error('Refresh failed:', error);
        } finally {
            setIsLoading(false);
            setYoutubeLoading(false);
        }
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Box>
                        <Group gap="sm">
                            <TestTube size={28} color="#8b5cf6" />
                            <Title order={2} style={{ color: '#111827' }}>
                                🧪 성과/트렌드 분석실
                            </Title>
                        </Group>
                        <Text c="gray.6" mt={4}>
                            어떤 영상이 왜 잘 됐는지 데이터로 증명합니다
                        </Text>
                    </Box>
                    <Button
                        leftSection={<RefreshCw size={18} />}
                        variant="light"
                        loading={isLoading}
                        onClick={handleRefresh}
                    >
                        데이터 새로고침
                    </Button>
                </Group>

                {/* 안내 */}
                <Alert
                    icon={<Lightbulb size={18} />}
                    title="💡 Step 2. 스타일 위너 찾기"
                    color="blue"
                    variant="light"
                    radius="lg"
                >
                    어떤 영상이 왜 잘 됐는지 데이터로 증명합니다. 다음 영상 기획의 근거를 찾으세요.
                </Alert>

                {/* 채널 정보 */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="lg">
                    <Card padding="lg" radius="xl" withBorder>
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="lg" color="red" variant="light">
                                <Youtube size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.5">채널명</Text>
                                <Text fw={600}>{youtubeStats?.channel?.title || mockChannel.title}</Text>
                            </Box>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder>
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="lg" color="blue" variant="light">
                                <Users size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.5">구독자</Text>
                                <Text fw={600}>{(youtubeStats?.channel?.subscriberCount || mockChannel.subscriberCount).toLocaleString()}</Text>
                            </Box>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder>
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="lg" color="violet" variant="light">
                                <BarChart3 size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.5">영상 수</Text>
                                <Text fw={600}>{youtubeStats?.channel?.videoCount || mockChannel.videoCount}</Text>
                            </Box>
                        </Group>
                    </Card>
                    <Card padding="lg" radius="xl" withBorder>
                        <Group gap="sm">
                            <ThemeIcon size="lg" radius="lg" color="green" variant="light">
                                <Eye size={20} />
                            </ThemeIcon>
                            <Box>
                                <Text size="xs" c="gray.5">총 조회수</Text>
                                <Text fw={600}>{(youtubeStats?.channel?.viewCount || mockChannel.viewCount).toLocaleString()}</Text>
                            </Box>
                        </Group>
                    </Card>
                </SimpleGrid>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="lg">
                    <Tabs.List>
                        <Tabs.Tab value="youtube" leftSection={<Youtube size={18} />}>
                            📺 YouTube 연동
                        </Tabs.Tab>
                        <Tabs.Tab value="analysis" leftSection={<TestTube size={18} />}>
                            🧪 심층 분석
                        </Tabs.Tab>
                        <Tabs.Tab value="stats" leftSection={<BarChart3 size={18} />}>
                            📈 기본 통계
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* YouTube 연동 탭 */}
                    <Tabs.Panel value="youtube" pt="xl">
                        <Stack gap="xl">
                            {youtubeLoading ? (
                                <Center py="xl">
                                    <Loader size="lg" />
                                </Center>
                            ) : !youtubeStats?.connected ? (
                                <Card padding="xl" radius="xl" withBorder>
                                    <Stack gap="lg" align="center">
                                        <ThemeIcon size={80} radius="xl" color="red" variant="light">
                                            <Youtube size={40} />
                                        </ThemeIcon>
                                        <Title order={3}>YouTube 채널을 연결하세요</Title>
                                        <Text c="gray.6" ta="center">
                                            YouTube 채널을 연결하면 실제 영상 통계를 확인할 수 있습니다.
                                            <br />
                                            구독자 수, 조회수, 좋아요, 시청 시간 등을 한눈에!
                                        </Text>
                                        <Button
                                            component="a"
                                            href="/api/youtube/auth"
                                            size="lg"
                                            radius="lg"
                                            style={{ background: '#FF0000', border: 'none' }}
                                        >
                                            🔗 YouTube 채널 연결하기
                                        </Button>
                                    </Stack>
                                </Card>
                            ) : (
                                <Stack gap="lg">
                                    <Alert color="green" radius="lg" icon={<Youtube size={18} />}>
                                        ✅ YouTube 채널 <strong>{youtubeStats.channel?.title}</strong>이(가) 연결되었습니다!
                                    </Alert>

                                    {/* 최근 영상 목록 */}
                                    <Box>
                                        <Title order={4} mb="lg">📺 최근 영상 (최대 10개)</Title>
                                        <Card padding={0} radius="lg" withBorder>
                                            <Table>
                                                <Table.Thead>
                                                    <Table.Tr>
                                                        <Table.Th>제목</Table.Th>
                                                        <Table.Th>조회수</Table.Th>
                                                        <Table.Th>좋아요</Table.Th>
                                                        <Table.Th>댓글</Table.Th>
                                                        <Table.Th>업로드</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {youtubeStats.videos.map((video) => (
                                                        <Table.Tr key={video.id}>
                                                            <Table.Td>
                                                                <Text fw={500} lineClamp={1} maw={300}>
                                                                    {video.title}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Group gap="xs">
                                                                    <Eye size={14} />
                                                                    <Text>{video.viewCount.toLocaleString()}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Group gap="xs">
                                                                    <ThumbsUp size={14} />
                                                                    <Text>{video.likeCount.toLocaleString()}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Group gap="xs">
                                                                    <MessageCircle size={14} />
                                                                    <Text>{video.commentCount.toLocaleString()}</Text>
                                                                </Group>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" c="gray.6">
                                                                    {new Date(video.publishedAt).toLocaleDateString('ko-KR')}
                                                                </Text>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                </Table.Tbody>
                                            </Table>
                                        </Card>
                                    </Box>
                                </Stack>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    {/* 심층 분석 탭 */}
                    <Tabs.Panel value="analysis" pt="xl">
                        <Stack gap="xl">
                            {/* 채널 평균 vs 연결 영상 */}
                            <Box>
                                <Title order={4} mb="lg">📊 채널 평균 vs 연결된 영상</Title>
                                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
                                    <Card padding="lg" radius="xl" withBorder>
                                        <Text size="sm" c="gray.6" mb="xs">채널 전체 평균 조회수</Text>
                                        <Title order={3}>{channelAvgViews.toLocaleString()}</Title>
                                    </Card>
                                    <Card padding="lg" radius="xl" withBorder>
                                        <Text size="sm" c="gray.6" mb="xs">연결 영상 평균 조회수</Text>
                                        <Group gap="sm">
                                            <Title order={3}>{linkedAvgViews.toLocaleString()}</Title>
                                            <Badge color={linkedAvgViews > channelAvgViews ? 'green' : 'red'}>
                                                {linkedAvgViews > channelAvgViews ? '+' : ''}
                                                {((linkedAvgViews / channelAvgViews - 1) * 100).toFixed(0)}%
                                            </Badge>
                                        </Group>
                                    </Card>
                                    <Card padding="lg" radius="xl" withBorder>
                                        <Text size="sm" c="gray.6" mb="xs">평균 시청률</Text>
                                        <Title order={3}>{linkedAvgRetention.toFixed(1)}%</Title>
                                    </Card>
                                </SimpleGrid>
                            </Box>

                            {/* 잘 된 영상 */}
                            <Box>
                                <Group gap="sm" mb="lg">
                                    <TrendingUp size={20} color="#22c55e" />
                                    <Title order={4}>🏆 평균 이상 성과 영상 ({aboveAvgVideos.length}개)</Title>
                                </Group>
                                <Card padding={0} radius="lg" withBorder>
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>제목</Table.Th>
                                                <Table.Th>조회수</Table.Th>
                                                <Table.Th>시청률</Table.Th>
                                                <Table.Th>구독 전환</Table.Th>
                                                <Table.Th>스타일</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {aboveAvgVideos.map((video) => (
                                                <Table.Tr key={video.id}>
                                                    <Table.Td>
                                                        <Text fw={500}>{video.title}</Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            <Text>{video.views.toLocaleString()}</Text>
                                                            <Badge color="green" size="xs">
                                                                +{((video.views / channelAvgViews - 1) * 100).toFixed(0)}%
                                                            </Badge>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>{video.avgViewPct}%</Table.Td>
                                                    <Table.Td>{video.subsGained}</Table.Td>
                                                    <Table.Td>
                                                        <Badge variant="outline" color="violet">
                                                            {ARCHETYPE_NAMES[video.hookStyle]?.split(' ')[0] || video.hookStyle}
                                                        </Badge>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Card>
                            </Box>

                            {/* 스타일별 성과 */}
                            <Box>
                                <Title order={4} mb="lg">📈 스타일별 성과 비교</Title>
                                <Card padding="lg" radius="lg" withBorder>
                                    <Table>
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>스타일</Table.Th>
                                                <Table.Th>평균 조회수</Table.Th>
                                                <Table.Th>평균 시청률</Table.Th>
                                                <Table.Th>영상 수</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {stylePerformance.map((style, idx) => (
                                                <Table.Tr key={style.style}>
                                                    <Table.Td>
                                                        <Group gap="xs">
                                                            {idx === 0 && <Badge color="yellow">🥇</Badge>}
                                                            <Text fw={idx === 0 ? 600 : 400}>
                                                                {ARCHETYPE_NAMES[style.style] || style.style}
                                                            </Text>
                                                        </Group>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text fw={600}>{style.avgViews.toLocaleString()}</Text>
                                                    </Table.Td>
                                                    <Table.Td>{style.avgRetention}%</Table.Td>
                                                    <Table.Td>{style.count}</Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Card>
                                {bestStyle && (
                                    <Alert color="green" radius="lg" mt="md" icon={<Target size={18} />}>
                                        🎯 <strong>{ARCHETYPE_NAMES[bestStyle.style]}</strong> 스타일이 평균{' '}
                                        {bestStyle.avgViews.toLocaleString()}회로 가장 높은 조회수!
                                    </Alert>
                                )}
                            </Box>

                            {/* AI 인사이트 */}
                            <Box>
                                <Title order={4} mb="lg">💡 분석 인사이트</Title>
                                <Stack gap="md">
                                    <Alert color="violet" radius="lg" icon={<Zap size={18} />}>
                                        ✅ 다음 영상은 <strong>{ARCHETYPE_NAMES[bestStyle?.style || '']}</strong> 스타일로 만들어보세요!
                                    </Alert>
                                    <Alert color="green" radius="lg" icon={<TrendingUp size={18} />}>
                                        🎉 연결된 영상들이 채널 평균보다 <strong>{((linkedAvgViews / channelAvgViews - 1) * 100).toFixed(0)}% 높은 조회수</strong>를 기록 중!
                                    </Alert>
                                    <Alert color="blue" radius="lg" icon={<Lightbulb size={18} />}>
                                        📌 상위 영상 {aboveAvgVideos.length}개 중 <strong>{aboveAvgVideos.filter(v => v.hookStyle === 'TOOL_FORCE').length}개</strong>가 도구 위력형 스타일입니다.
                                    </Alert>
                                </Stack>
                            </Box>
                        </Stack>
                    </Tabs.Panel>

                    {/* 기본 통계 탭 */}
                    <Tabs.Panel value="stats" pt="xl">
                        <Stack gap="xl">
                            <Alert color="gray" radius="lg">
                                YouTube 채널 연동 후 더 자세한 통계를 확인할 수 있습니다.
                            </Alert>

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                <Card padding="xl" radius="xl" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>분석된 영상</Text>
                                            <Badge size="lg" color="violet">{mockVideoAnalytics.length}개</Badge>
                                        </Group>
                                        <Progress value={100} color="violet" />
                                    </Stack>
                                </Card>
                                <Card padding="xl" radius="xl" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>총 조회수</Text>
                                            <Badge size="lg" color="green">
                                                {mockVideoAnalytics.reduce((a, b) => a + b.views, 0).toLocaleString()}
                                            </Badge>
                                        </Group>
                                        <Progress value={65} color="green" />
                                    </Stack>
                                </Card>
                                <Card padding="xl" radius="xl" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>총 구독 전환</Text>
                                            <Badge size="lg" color="blue">
                                                {mockVideoAnalytics.reduce((a, b) => a + b.subsGained, 0).toLocaleString()}
                                            </Badge>
                                        </Group>
                                        <Progress value={45} color="blue" />
                                    </Stack>
                                </Card>
                                <Card padding="xl" radius="xl" withBorder>
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Text fw={600}>평균 이상 성과</Text>
                                            <Badge size="lg" color="yellow">
                                                {aboveAvgVideos.length} / {mockVideoAnalytics.length}
                                            </Badge>
                                        </Group>
                                        <Progress value={(aboveAvgVideos.length / mockVideoAnalytics.length) * 100} color="yellow" />
                                    </Stack>
                                </Card>
                            </SimpleGrid>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
