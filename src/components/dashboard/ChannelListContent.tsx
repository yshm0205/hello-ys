'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Text,
    Group,
    Stack,
    Select,
    Table,
    Badge,
    Skeleton,
    Card,
    Anchor,
    Button,
} from '@mantine/core';
import { ExternalLink, Lock, BarChart3 } from 'lucide-react';

// ── 타입 ──
interface Channel {
    name: string;
    subscribers: number;
    avg_views: number;
    median_views: number;
    category: string;
    subcategory: string;
    format: string;
    channel_url: string;
}

interface ChannelData {
    month: string;
    updated_at: string;
    total: number;
    channels: Channel[];
}

// ── 상수 ──
const AVAILABLE_MONTHS = [
    { value: '2026-03', label: '2026년 3월', file: 'channels_2026_03.json' },
    { value: '2026-02', label: '2026년 2월', file: 'channels_2026_02.json' },
    { value: '2026-01', label: '2026년 1월', file: 'channels_2026_01.json' },
];

const MAIN_CATEGORIES = ['전체', '지식/정보', '취미/덕질', '연예/팬덤', '일상/공감', '기타'] as const;
type CategoryFilter = (typeof MAIN_CATEGORIES)[number];

const MINOR_CATEGORIES = ['푸드/뷰티', '방송/영상', '글로벌/문화', '쇼핑 쇼츠', '음악/댄스'];

const SORT_OPTIONS = [
    { value: 'avg_views_desc', label: '조회수 높은순' },
    { value: 'median_desc', label: '중위값 높은순' },
    { value: 'subs_asc', label: '구독자 적은순' },
    { value: 'subs_desc', label: '구독자 많은순' },
];

const FREE_PREVIEW_COUNT = 5;

// ── 포맷 유틸 ──
function formatCount(n: number): string {
    if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
    if (n >= 1_000) return n.toLocaleString();
    return String(n);
}

function formatSubs(n: number): string {
    if (n >= 1_000_000) return `${(n / 10_000).toFixed(0)}만`;
    if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
    return n.toLocaleString();
}

// ── 컴포넌트 ──
export function ChannelListContent({ isSubscribed }: { isSubscribed: boolean }) {
    const [month, setMonth] = useState(AVAILABLE_MONTHS[0].value);
    const [data, setData] = useState<ChannelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
    const [sortBy, setSortBy] = useState('avg_views_desc');

    // 월별 데이터 fetch
    useEffect(() => {
        const info = AVAILABLE_MONTHS.find((m) => m.value === month);
        if (!info) return;

        setLoading(true);
        fetch(`/data/${info.file}`)
            .then((r) => r.json())
            .then((d: ChannelData) => {
                setData(d);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [month]);

    // 필터 + 정렬
    const filtered = useMemo(() => {
        if (!data) return [];
        let list = data.channels;

        // 대분류 필터
        if (categoryFilter !== '전체') {
            if (categoryFilter === '기타') {
                list = list.filter((c) => MINOR_CATEGORIES.includes(c.category));
            } else {
                list = list.filter((c) => c.category === categoryFilter);
            }
        }

        // 정렬
        const sorted = [...list];
        switch (sortBy) {
            case 'avg_views_desc':
                sorted.sort((a, b) => b.avg_views - a.avg_views);
                break;
            case 'median_desc':
                sorted.sort((a, b) => b.median_views - a.median_views);
                break;
            case 'subs_asc':
                sorted.sort((a, b) => a.subscribers - b.subscribers);
                break;
            case 'subs_desc':
                sorted.sort((a, b) => b.subscribers - a.subscribers);
                break;
        }
        return sorted;
    }, [data, categoryFilter, sortBy]);

    return (
        <Stack gap="lg">
            {/* 헤더 */}
            <Group justify="space-between" align="flex-end" wrap="wrap">
                <Group gap="sm" align="center">
                    <BarChart3 size={24} color="#8b5cf6" />
                    <Text size="xl" fw={700}>
                        채널 리스트
                    </Text>
                </Group>
                <Group gap="md">
                    <Select
                        data={AVAILABLE_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
                        value={month}
                        onChange={(v) => v && setMonth(v)}
                        size="sm"
                        w={160}
                        allowDeselect={false}
                    />
                    {data && (
                        <Badge variant="light" color="gray" size="lg">
                            {filtered.length}개 채널
                        </Badge>
                    )}
                </Group>
            </Group>

            {/* 수강생 전용: 필터 + 정렬 */}
            {isSubscribed && (
                <Group justify="space-between" wrap="wrap" gap="sm">
                    {/* 대분류 탭 */}
                    <Group gap={6}>
                        {MAIN_CATEGORIES.map((cat) => (
                            <Button
                                key={cat}
                                size="xs"
                                radius="xl"
                                variant={categoryFilter === cat ? 'filled' : 'light'}
                                color="violet"
                                onClick={() => setCategoryFilter(cat)}
                            >
                                {cat}
                            </Button>
                        ))}
                    </Group>
                    {/* 정렬 */}
                    <Select
                        data={SORT_OPTIONS}
                        value={sortBy}
                        onChange={(v) => v && setSortBy(v)}
                        size="xs"
                        w={160}
                        allowDeselect={false}
                    />
                </Group>
            )}

            {/* 로딩 */}
            {loading && (
                <Stack gap="sm">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} height={48} radius="md" />
                    ))}
                </Stack>
            )}

            {/* 데이터 */}
            {!loading && data && (
                <Box pos="relative">
                    {/* PC 테이블 (sm 이상) */}
                    <Box visibleFrom="sm">
                        <ChannelTable
                            channels={isSubscribed ? filtered : filtered.slice(0, FREE_PREVIEW_COUNT)}
                        />
                    </Box>

                    {/* 모바일 카드 (sm 미만) */}
                    <Box hiddenFrom="sm">
                        <Stack gap="sm">
                            {(isSubscribed ? filtered : filtered.slice(0, FREE_PREVIEW_COUNT)).map(
                                (ch) => (
                                    <ChannelCard key={ch.name + ch.channel_url} channel={ch} />
                                )
                            )}
                        </Stack>
                    </Box>

                    {/* 비수강생 블러 + CTA */}
                    {!isSubscribed && filtered.length > FREE_PREVIEW_COUNT && (
                        <BlurOverlay total={filtered.length} />
                    )}
                </Box>
            )}
        </Stack>
    );
}

// ── 테이블 (PC) ──
function ChannelTable({ channels }: { channels: Channel[] }) {
    return (
        <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders={false}
            styles={{
                table: { fontSize: 14 },
                th: { background: '#F9FAFB', fontWeight: 600, color: '#374151', padding: '10px 12px' },
                td: { padding: '10px 12px' },
            }}
        >
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>채널명</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>구독자</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>평균 조회수</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>중위값</Table.Th>
                    <Table.Th>소분류</Table.Th>
                    <Table.Th>제작형식</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {channels.map((ch) => (
                    <Table.Tr key={ch.name + ch.channel_url}>
                        <Table.Td>
                            <Anchor
                                href={ch.channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                size="sm"
                                fw={500}
                                c="dark"
                                style={{ textDecoration: 'none' }}
                            >
                                <Group gap={4} wrap="nowrap">
                                    {ch.name}
                                    <ExternalLink size={13} color="#9ca3af" />
                                </Group>
                            </Anchor>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatSubs(ch.subscribers)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCount(ch.avg_views)}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatCount(ch.median_views)}</Table.Td>
                        <Table.Td>
                            <Badge variant="light" color="gray" size="sm">
                                {ch.subcategory}
                            </Badge>
                        </Table.Td>
                        <Table.Td>
                            <Text size="xs" c="dimmed">
                                {ch.format}
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}

// ── 카드 (모바일) ──
function ChannelCard({ channel: ch }: { channel: Channel }) {
    return (
        <Card padding="sm" radius="md" withBorder>
            <Group justify="space-between" mb={4}>
                <Text fw={600} size="sm">
                    {ch.name}
                </Text>
                <Anchor href={ch.channel_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} color="#8b5cf6" />
                </Anchor>
            </Group>
            <Group gap="xs" mb={4}>
                <Text size="xs" c="dimmed">
                    구독 {formatSubs(ch.subscribers)}
                </Text>
                <Text size="xs" c="dimmed">
                    ·
                </Text>
                <Badge variant="light" color="gray" size="xs">
                    {ch.subcategory}
                </Badge>
            </Group>
            <Group gap="xs" mb={2}>
                <Text size="xs">
                    평균 <b>{formatCount(ch.avg_views)}</b>
                </Text>
                <Text size="xs" c="dimmed">
                    ·
                </Text>
                <Text size="xs">
                    중위 <b>{formatCount(ch.median_views)}</b>
                </Text>
            </Group>
            <Text size="xs" c="dimmed">
                {ch.format}
            </Text>
        </Card>
    );
}

// ── 블러 오버레이 (비수강생) ──
function BlurOverlay({ total }: { total: number }) {
    return (
        <Box
            mt={-80}
            pt={100}
            pb={40}
            style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 20%, #fff 40%)',
                position: 'relative',
                zIndex: 1,
            }}
        >
            <Card
                withBorder
                shadow="sm"
                radius="lg"
                padding="xl"
                maw={440}
                mx="auto"
                style={{ textAlign: 'center', borderColor: '#e5e7eb' }}
            >
                <Stack align="center" gap="sm">
                    <Box
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            background: 'rgba(139, 92, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Lock size={24} color="#8b5cf6" />
                    </Box>
                    <Text fw={700} size="lg">
                        올인원 패스 수강생 전용
                    </Text>
                    <Text size="sm" c="dimmed">
                        매달 업데이트되는 {total}개+ 추천 채널 리스트를 확인하세요
                    </Text>
                    <Button
                        component="a"
                        href="https://flowspot-kr.vercel.app/#pricing"
                        target="_blank"
                        color="violet"
                        radius="md"
                        mt="xs"
                    >
                        올인원 패스 보기
                    </Button>
                </Stack>
            </Card>
        </Box>
    );
}
