'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
    NumberInput,
    ActionIcon,
} from '@mantine/core';
import { ExternalLink, Lock, BarChart3, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';

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

type SortColumn = 'subscribers' | 'avg_views' | 'median_views';
type SortDir = 'asc' | 'desc';

interface SortState {
    column: SortColumn;
    dir: SortDir;
}

interface RangeFilter {
    subsMin: number | '';
    subsMax: number | '';
    avgMin: number | '';
    avgMax: number | '';
    medianMin: number | '';
    medianMax: number | '';
}

// ── 상수 ──
const AVAILABLE_MONTHS = [
    { value: '2026-02', label: '2026년 2월', file: 'channels_2026_02.json' },
    { value: '2026-01', label: '2026년 1월', file: 'channels_2026_01.json' },
];

const MAIN_CATEGORIES = ['전체', '지식/정보', '취미/덕질', '연예/팬덤', '일상/공감', '기타'] as const;
type CategoryFilter = (typeof MAIN_CATEGORIES)[number];

const MINOR_CATEGORIES = ['푸드/뷰티', '방송/영상', '글로벌/문화', '쇼핑 쇼츠', '음악/댄스'];

const FREE_PREVIEW_COUNT = 5;

const EMPTY_FILTER: RangeFilter = {
    subsMin: '', subsMax: '',
    avgMin: '', avgMax: '',
    medianMin: '', medianMax: '',
};

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

function hasActiveFilter(f: RangeFilter): boolean {
    return Object.values(f).some((v) => v !== '');
}

// ── 컴포넌트 ──
export function ChannelListContent({ isSubscribed }: { isSubscribed: boolean }) {
    const [month, setMonth] = useState(AVAILABLE_MONTHS[0].value);
    const [data, setData] = useState<ChannelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortState>({ column: 'avg_views', dir: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('전체');
    const [filter, setFilter] = useState<RangeFilter>(EMPTY_FILTER);

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

    // 헤더 클릭 → 정렬 토글
    const toggleSort = useCallback((col: SortColumn) => {
        setSort((prev) => ({
            column: col,
            dir: prev.column === col && prev.dir === 'desc' ? 'asc' : 'desc',
        }));
    }, []);

    // 필터 + 정렬
    const filtered = useMemo(() => {
        if (!data) return [];
        let list = data.channels;

        // 대분류 필터
        if (isSubscribed && categoryFilter !== '전체') {
            if (categoryFilter === '기타') {
                list = list.filter((c) => MINOR_CATEGORIES.includes(c.category));
            } else {
                list = list.filter((c) => c.category === categoryFilter);
            }
        }

        // 범위 필터
        if (isSubscribed && hasActiveFilter(filter)) {
            list = list.filter((c) => {
                if (filter.subsMin !== '' && c.subscribers < filter.subsMin) return false;
                if (filter.subsMax !== '' && c.subscribers > filter.subsMax) return false;
                if (filter.avgMin !== '' && c.avg_views < filter.avgMin) return false;
                if (filter.avgMax !== '' && c.avg_views > filter.avgMax) return false;
                if (filter.medianMin !== '' && c.median_views < filter.medianMin) return false;
                if (filter.medianMax !== '' && c.median_views > filter.medianMax) return false;
                return true;
            });
        }

        // 정렬 (stable sort with index fallback)
        const sorted = list.map((ch, i) => ({ ch, i }));
        sorted.sort((a, b) => {
            const diff = sort.dir === 'desc'
                ? b.ch[sort.column] - a.ch[sort.column]
                : a.ch[sort.column] - b.ch[sort.column];
            return diff !== 0 ? diff : a.i - b.i; // stable
        });
        return sorted.map((s) => s.ch);
    }, [data, categoryFilter, filter, sort, isSubscribed]);

    return (
        <Stack gap="md">
            {/* 헤더 + 컨트롤 통합 카드 */}
            <Card
                padding="lg"
                radius="lg"
                withBorder
                style={{ borderColor: '#e5e7eb' }}
            >
                <Stack gap="md">
                    {/* 타이틀 줄 */}
                    <Group justify="space-between" align="center" wrap="wrap">
                        <Group gap="sm" align="center">
                            <BarChart3 size={22} color="#8b5cf6" />
                            <Text size="lg" fw={700}>
                                채널 리스트
                            </Text>
                            {data && (
                                <Badge variant="light" color="violet" size="lg" radius="md">
                                    {filtered.length}개 채널
                                </Badge>
                            )}
                        </Group>
                        <Text size="xs" c="dimmed">
                            매달 업데이트
                        </Text>
                    </Group>

                    {/* 컨트롤 줄 */}
                    <Box
                        style={{
                            background: '#FAFAFA',
                            borderRadius: 10,
                            padding: '10px 12px',
                        }}
                    >
                        <Group justify="space-between" wrap="wrap" gap="sm">
                            <Group gap="sm" wrap="wrap">
                                {/* 월 선택 */}
                                <Select
                                    data={AVAILABLE_MONTHS.map((m) => ({ value: m.value, label: m.label }))}
                                    value={month}
                                    onChange={(v) => v && setMonth(v)}
                                    size="xs"
                                    w={140}
                                    allowDeselect={false}
                                    styles={{
                                        input: {
                                            fontWeight: 600,
                                            background: '#fff',
                                        },
                                    }}
                                />

                                {/* 대분류 필터 (수강생만) */}
                                {isSubscribed && (
                                    <>
                                        <Box
                                            style={{
                                                width: 1,
                                                height: 24,
                                                background: '#e0e0e0',
                                                alignSelf: 'center',
                                            }}
                                        />
                                        <Group gap={5}>
                                            {MAIN_CATEGORIES.map((cat) => (
                                                <Button
                                                    key={cat}
                                                    size="compact-xs"
                                                    radius="md"
                                                    variant={categoryFilter === cat ? 'filled' : 'default'}
                                                    color="violet"
                                                    onClick={() => setCategoryFilter(cat)}
                                                    styles={{
                                                        root: categoryFilter !== cat ? {
                                                            background: '#fff',
                                                            borderColor: '#e5e7eb',
                                                        } : {},
                                                    }}
                                                >
                                                    {cat}
                                                </Button>
                                            ))}
                                        </Group>
                                    </>
                                )}
                            </Group>

                            {/* 필터 초기화 (수강생만) */}
                            {isSubscribed && hasActiveFilter(filter) && (
                                <Button
                                    size="compact-xs"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<X size={12} />}
                                    onClick={() => setFilter(EMPTY_FILTER)}
                                >
                                    필터 초기화
                                </Button>
                            )}
                        </Group>

                        {/* 범위 필터 (수강생만) */}
                        {isSubscribed && (
                            <Box mt="sm">
                                <Group gap="md" wrap="wrap">
                                    <RangeInput
                                        label="구독자"
                                        min={filter.subsMin}
                                        max={filter.subsMax}
                                        onMinChange={(v) => setFilter((f) => ({ ...f, subsMin: v }))}
                                        onMaxChange={(v) => setFilter((f) => ({ ...f, subsMax: v }))}
                                        placeholder="명"
                                    />
                                    <RangeInput
                                        label="평균 조회수"
                                        min={filter.avgMin}
                                        max={filter.avgMax}
                                        onMinChange={(v) => setFilter((f) => ({ ...f, avgMin: v }))}
                                        onMaxChange={(v) => setFilter((f) => ({ ...f, avgMax: v }))}
                                        placeholder="회"
                                    />
                                    <RangeInput
                                        label="중위값"
                                        min={filter.medianMin}
                                        max={filter.medianMax}
                                        onMinChange={(v) => setFilter((f) => ({ ...f, medianMin: v }))}
                                        onMaxChange={(v) => setFilter((f) => ({ ...f, medianMax: v }))}
                                        placeholder="회"
                                    />
                                </Group>
                            </Box>
                        )}
                    </Box>
                </Stack>
            </Card>

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
                            sort={sort}
                            onSort={isSubscribed ? toggleSort : undefined}
                        />
                    </Box>

                    {/* 모바일 카드 (sm 미만) */}
                    <Box hiddenFrom="sm">
                        <Stack gap="sm">
                            {(isSubscribed ? filtered : filtered.slice(0, FREE_PREVIEW_COUNT)).map(
                                (ch, idx) => (
                                    <ChannelCard key={`${idx}-${ch.channel_url}`} channel={ch} />
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

// ── 범위 입력 ──
function RangeInput({
    label,
    min,
    max,
    onMinChange,
    onMaxChange,
    placeholder,
}: {
    label: string;
    min: number | '';
    max: number | '';
    onMinChange: (v: number | '') => void;
    onMaxChange: (v: number | '') => void;
    placeholder: string;
}) {
    return (
        <Group gap={6} align="end">
            <Text size="xs" fw={600} c="gray.7" style={{ minWidth: 60 }}>
                {label}
            </Text>
            <NumberInput
                size="xs"
                w={100}
                placeholder={`최소 (${placeholder})`}
                value={min}
                onChange={(v) => onMinChange(v === '' ? '' : Number(v))}
                min={0}
                thousandSeparator=","
                hideControls
                styles={{ input: { background: '#fff', fontSize: 12 } }}
            />
            <Text size="xs" c="dimmed">~</Text>
            <NumberInput
                size="xs"
                w={100}
                placeholder={`최대 (${placeholder})`}
                value={max}
                onChange={(v) => onMaxChange(v === '' ? '' : Number(v))}
                min={0}
                thousandSeparator=","
                hideControls
                styles={{ input: { background: '#fff', fontSize: 12 } }}
            />
        </Group>
    );
}

// ── 정렬 아이콘 ──
function SortIcon({ column, sort }: { column: SortColumn; sort: SortState }) {
    if (sort.column !== column) return <ArrowUpDown size={12} color="#9ca3af" />;
    return sort.dir === 'desc'
        ? <ArrowDown size={12} color="#8b5cf6" />
        : <ArrowUp size={12} color="#8b5cf6" />;
}

// ── 테이블 (PC) ──
function ChannelTable({
    channels,
    sort,
    onSort,
}: {
    channels: Channel[];
    sort: SortState;
    onSort?: (col: SortColumn) => void;
}) {
    const sortableStyle = onSort
        ? { cursor: 'pointer', userSelect: 'none' as const }
        : {};

    return (
        <Table
            striped
            highlightOnHover
            withTableBorder
            withColumnBorders={false}
            styles={{
                table: { fontSize: 14, borderRadius: 12, overflow: 'hidden' },
                th: { background: '#F3F0FF', fontWeight: 600, color: '#5b21b6', padding: '12px 14px', fontSize: 13 },
                td: { padding: '11px 14px' },
            }}
        >
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>채널명</Table.Th>
                    <Table.Th
                        style={{ textAlign: 'right', ...sortableStyle }}
                        onClick={() => onSort?.('subscribers')}
                    >
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                            구독자
                            {onSort && <SortIcon column="subscribers" sort={sort} />}
                        </Group>
                    </Table.Th>
                    <Table.Th
                        style={{ textAlign: 'right', ...sortableStyle }}
                        onClick={() => onSort?.('avg_views')}
                    >
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                            평균 조회수
                            {onSort && <SortIcon column="avg_views" sort={sort} />}
                        </Group>
                    </Table.Th>
                    <Table.Th
                        style={{ textAlign: 'right', ...sortableStyle }}
                        onClick={() => onSort?.('median_views')}
                    >
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                            중위값
                            {onSort && <SortIcon column="median_views" sort={sort} />}
                        </Group>
                    </Table.Th>
                    <Table.Th>소분류</Table.Th>
                    <Table.Th>제작형식</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {channels.map((ch, idx) => (
                    <Table.Tr key={`${idx}-${ch.channel_url}`}>
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
