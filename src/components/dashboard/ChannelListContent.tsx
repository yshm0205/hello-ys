'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Text,
    Group,
    Stack,
    Select,
    TextInput,
    Table,
    Badge,
    Avatar,
    Skeleton,
    Card,
    Anchor,
    Button,
    NumberInput,
} from '@mantine/core';
import { ExternalLink, Lock, BarChart3, ArrowUp, ArrowDown, ArrowUpDown, Search, X } from 'lucide-react';

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
    first_upload_date: string | null;
    profile_image_url: string;
    total_video_count: number;
}

interface ChannelData {
    month: string;
    updated_at: string;
    total: number;
    channels: Channel[];
}

type SortColumn = 'opportunity' | 'subscribers' | 'avg_views' | 'median_views';
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

const MAIN_CATEGORIES = ['전체', '지식/정보', '취미/덕질', '연예/팬덤', '일상/공감', '기타'] as const;

const MINOR_CATEGORIES = ['푸드/뷰티', '방송/영상', '글로벌/문화', '쇼핑 쇼츠', '음악/댄스'];

const FREE_PREVIEW_COUNT = 5;
type FormFilter = 'all' | 'ai' | 'shooting' | 'edit' | 'explain' | 'ranking' | 'community' | 'story';
type PerformanceGrade = 'Great' | 'Good' | 'Normal';

const FORM_FILTERS: { value: FormFilter; label: string; keywords: string[] }[] = [
    { value: 'all', label: '전체 폼', keywords: [] },
    { value: 'ai', label: 'AI', keywords: ['ai'] },
    { value: 'shooting', label: '촬영', keywords: ['촬영'] },
    { value: 'edit', label: '짜집기 편집', keywords: ['짜집기'] },
    { value: 'explain', label: '해설형', keywords: ['해설'] },
    { value: 'ranking', label: '랭킹 쇼츠', keywords: ['랭킹'] },
    { value: 'community', label: '커뮤니티', keywords: ['커뮤니티'] },
    { value: 'story', label: '썰형', keywords: ['썰'] },
];

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

function formatDateLabel(value: string | null): string {
    if (!value) return '-';
    const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!match) return value;
    return match[3] ? `${match[1]}.${match[2]}.${match[3]}` : `${match[1]}.${match[2]}`;
}

function formatVideoCount(value: number): string {
    return value > 0 ? `${formatCount(value)}개` : '-';
}

function getInitial(value: string): string {
    return value.trim().charAt(0) || '?';
}

function getChannelAgeMonths(value: string | null): number | null {
    if (!value) return null;
    const match = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
    if (!match) return null;
    const started = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3] || '1'));
    if (Number.isNaN(started.getTime())) return null;
    const now = new Date();
    return (now.getFullYear() - started.getFullYear()) * 12 + now.getMonth() - started.getMonth();
}

function getCategoryColor(category: string): string {
    switch (category) {
        case '지식/정보': return 'blue';
        case '취미/덕질': return 'teal';
        case '연예/팬덤': return 'pink';
        case '일상/공감': return 'yellow';
        case '푸드/뷰티': return 'orange';
        case '방송/영상': return 'indigo';
        case '글로벌/문화': return 'cyan';
        case '쇼핑 쇼츠': return 'lime';
        case '음악/댄스': return 'grape';
        default: return 'gray';
    }
}

function hasActiveFilter(f: RangeFilter): boolean {
    return Object.values(f).some((v) => v !== '');
}

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

function getOpportunityScore(ch: Channel): number {
    const subscriberBase = Math.max(ch.subscribers, 1000);
    const viewPower = ch.avg_views / subscriberBase;
    const stability = ch.avg_views > 0 ? Math.min(ch.median_views / ch.avg_views, 1) : 0;

    return viewPower * (0.75 + stability * 0.25);
}

function getStability(ch: Channel): number {
    return ch.avg_views > 0 ? Math.min(ch.median_views / ch.avg_views, 1) : 0;
}

function getPercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((sorted.length - 1) * percentile);
    return sorted[index] || 0;
}

function getPerformanceThresholds(channels: Channel[]) {
    const scores = channels.map(getOpportunityScore);
    return {
        great: getPercentile(scores, 0.85),
        good: getPercentile(scores, 0.5),
    };
}

function getPerformanceGrade(ch: Channel, thresholds: ReturnType<typeof getPerformanceThresholds>): PerformanceGrade {
    const score = getOpportunityScore(ch);
    const stability = getStability(ch);

    if (score >= thresholds.great && ch.avg_views >= 100_000 && stability >= 0.15) return 'Great';
    if (score >= thresholds.good && ch.avg_views >= 50_000) return 'Good';
    return 'Normal';
}

function getGradeColor(grade: PerformanceGrade): string {
    if (grade === 'Great') return 'green';
    if (grade === 'Good') return 'lime';
    return 'gray';
}

function matchesFormFilter(ch: Channel, formFilter: FormFilter): boolean {
    if (formFilter === 'all') return true;
    const selected = FORM_FILTERS.find((item) => item.value === formFilter);
    if (!selected) return true;
    const text = `${ch.format} ${ch.subcategory}`.toLowerCase();
    return selected.keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function getInsight(ch: Channel, thresholds: ReturnType<typeof getPerformanceThresholds>): string {
    const grade = getPerformanceGrade(ch, thresholds);
    const stability = getStability(ch);
    const ageMonths = getChannelAgeMonths(ch.first_upload_date);

    if (ageMonths !== null && ageMonths <= 12 && (grade === 'Great' || grade === 'Good')) {
        return '첫 업로드 이후 빠르게 성과가 나는 채널';
    }
    if (grade === 'Great') return '구독자 대비 조회수와 중위값이 모두 강함';
    if (grade === 'Good') return '선택한 월 안에서 성과 지표가 좋은 편';
    if (stability >= 0.6) return '조회수 편차가 비교적 안정적';
    return '참고 후보';
}

// ── 컴포넌트 ──
export function ChannelListContent({ isSubscribed }: { isSubscribed: boolean }) {
    const [months, setMonths] = useState<string[]>([]);
    const [month, setMonth] = useState('');
    const [data, setData] = useState<ChannelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [sort, setSort] = useState<SortState>({ column: 'opportunity', dir: 'desc' });
    const [categoryFilter, setCategoryFilter] = useState<string>('전체');
    const [formFilter, setFormFilter] = useState<FormFilter>('all');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<RangeFilter>(EMPTY_FILTER);

    // Supabase 데이터 fetch (월별)
    useEffect(() => {
        const url = month ? `/api/hot-channels?month=${month}` : '/api/hot-channels';
        fetch(url)
            .then((r) => r.json())
            .then((d: { months: string[]; month: string; channels: Channel[]; total: number }) => {
                setMonths(d.months || []);
                if (!month && d.month) setMonth(d.month);
                setData({
                    month: d.month || '',
                    updated_at: '',
                    total: d.total,
                    channels: d.channels,
                });
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

    const categoryOptions = useMemo(() => {
        const categories = new Set(data?.channels.map((channel) => channel.category).filter(Boolean) || []);
        const ordered = [
            ...MAIN_CATEGORIES.filter((category) => category !== '전체' && categories.has(category)),
            ...MINOR_CATEGORIES.filter((category) => categories.has(category)),
            ...[...categories].filter((category) =>
                !MAIN_CATEGORIES.includes(category as (typeof MAIN_CATEGORIES)[number]) &&
                !MINOR_CATEGORIES.includes(category)
            ).sort((a, b) => a.localeCompare(b, 'ko')),
        ];

        return [
            { value: '전체', label: '전체 주제' },
            ...ordered.map((category) => ({ value: category, label: category })),
        ];
    }, [data]);

    const performanceThresholds = useMemo(
        () => getPerformanceThresholds(data?.channels || []),
        [data]
    );

    // 필터 + 정렬
    const filtered = useMemo(() => {
        if (!data) return [];
        let list = data.channels;

        if (isSubscribed && categoryFilter !== '전체') {
            list = list.filter((c) => c.category === categoryFilter);
        }

        if (isSubscribed && formFilter !== 'all') {
            list = list.filter((c) => matchesFormFilter(c, formFilter));
        }

        const normalizedQuery = normalizeText(query);
        if (isSubscribed && normalizedQuery) {
            list = list.filter((c) =>
                normalizeText(`${c.name} ${c.category} ${c.subcategory} ${c.format}`).includes(normalizedQuery)
            );
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
            const aValue = sort.column === 'opportunity' ? getOpportunityScore(a.ch) : a.ch[sort.column];
            const bValue = sort.column === 'opportunity' ? getOpportunityScore(b.ch) : b.ch[sort.column];
            const diff = sort.dir === 'desc'
                ? bValue - aValue
                : aValue - bValue;
            return diff !== 0 ? diff : a.i - b.i; // stable
        });
        return sorted.map((s) => s.ch);
    }, [data, categoryFilter, filter, formFilter, query, sort, isSubscribed]);

    const hasControlFilter =
        categoryFilter !== '전체' ||
        formFilter !== 'all' ||
        query.trim() !== '' ||
        hasActiveFilter(filter);

    const resetFilters = () => {
        setCategoryFilter('전체');
        setFormFilter('all');
        setQuery('');
        setFilter(EMPTY_FILTER);
    };

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
                                    data={months.map((m) => {
                                        const [y, mo] = m.split('-');
                                        return { value: m, label: `${y}년 ${parseInt(mo)}월` };
                                    })}
                                    value={month}
                                    onChange={(v) => {
                                        if (!v) return;
                                        setLoading(true);
                                        setMonth(v);
                                    }}
                                    size="xs"
                                    label="월"
                                    w={140}
                                    allowDeselect={false}
                                    styles={{
                                        input: {
                                            fontWeight: 600,
                                            background: '#fff',
                                        },
                                    }}
                                />

                                {/* 주제/제작 폼 필터 (수강생만) */}
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
                                        <Select
                                            data={categoryOptions}
                                            value={categoryFilter}
                                            onChange={(v) => v && setCategoryFilter(v)}
                                            size="xs"
                                            label="주제"
                                            w={160}
                                            allowDeselect={false}
                                            styles={{ input: { background: '#fff', fontWeight: 600 } }}
                                        />
                                        <Select
                                            data={FORM_FILTERS.map((item) => ({ value: item.value, label: item.label }))}
                                            value={formFilter}
                                            onChange={(v) => v && setFormFilter(v as FormFilter)}
                                            size="xs"
                                            label="제작 폼"
                                            w={160}
                                            allowDeselect={false}
                                            styles={{ input: { background: '#fff', fontWeight: 600 } }}
                                        />
                                    </>
                                )}
                            </Group>

                            {/* 필터 초기화 (수강생만) */}
                            {isSubscribed && hasControlFilter && (
                                <Button
                                    size="compact-xs"
                                    variant="subtle"
                                    color="gray"
                                    leftSection={<X size={12} />}
                                    onClick={resetFilters}
                                >
                                    필터 초기화
                                </Button>
                            )}
                        </Group>

                        {/* 범위 필터 (수강생만) */}
                        {isSubscribed && (
                            <Stack gap="sm" mt="sm">
                                <Group gap="md" wrap="wrap" align="end">
                                    <TextInput
                                        label="검색"
                                        placeholder="채널명, 세부 주제"
                                        value={query}
                                        onChange={(event) => setQuery(event.currentTarget.value)}
                                        leftSection={<Search size={14} />}
                                        size="xs"
                                        w={240}
                                        styles={{ input: { background: '#fff', fontSize: 12 } }}
                                    />
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
                            </Stack>
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
                    {filtered.length === 0 ? (
                        <Card padding="xl" radius="lg" withBorder style={{ textAlign: 'center' }}>
                            <Stack gap="sm" align="center">
                                <Text fw={700}>조건에 맞는 채널이 없습니다</Text>
                                <Text size="sm" c="dimmed">
                                    필터를 넓히면 더 많은 참고 채널을 볼 수 있습니다.
                                </Text>
                                {isSubscribed && (
                                    <Button variant="light" color="violet" size="xs" onClick={resetFilters}>
                                        필터 초기화
                                    </Button>
                                )}
                            </Stack>
                        </Card>
                    ) : (
                        <>
                            {/* PC 테이블 (sm 이상) */}
                            <Box visibleFrom="sm">
                                <ChannelTable
                                    channels={isSubscribed ? filtered : filtered.slice(0, FREE_PREVIEW_COUNT)}
                                    sort={sort}
                                    onSort={isSubscribed ? toggleSort : undefined}
                                    performanceThresholds={performanceThresholds}
                                />
                            </Box>

                            {/* 모바일 카드 (sm 미만) */}
                            <Box hiddenFrom="sm">
                                <Stack gap="sm">
                                    {(isSubscribed ? filtered : filtered.slice(0, FREE_PREVIEW_COUNT)).map(
                                        (ch, idx) => (
                                            <ChannelCard
                                                key={`${idx}-${ch.channel_url}`}
                                                channel={ch}
                                                performanceThresholds={performanceThresholds}
                                            />
                                        )
                                    )}
                                </Stack>
                            </Box>

                            {/* 비수강생 블러 + CTA */}
                            {!isSubscribed && filtered.length > FREE_PREVIEW_COUNT && (
                                <BlurOverlay total={filtered.length} />
                            )}
                        </>
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
    performanceThresholds,
}: {
    channels: Channel[];
    sort: SortState;
    onSort?: (col: SortColumn) => void;
    performanceThresholds: ReturnType<typeof getPerformanceThresholds>;
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
                        onClick={() => onSort?.('opportunity')}
                    >
                        <Group gap={4} justify="flex-end" wrap="nowrap">
                            성과
                            {onSort && <SortIcon column="opportunity" sort={sort} />}
                        </Group>
                    </Table.Th>
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
                    <Table.Th>주제</Table.Th>
                    <Table.Th>세부 주제</Table.Th>
                    <Table.Th>제작 폼</Table.Th>
                    <Table.Th>지표 포인트</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {channels.map((ch, idx) => (
                    <Table.Tr key={`${idx}-${ch.channel_url}`}>
                        <Table.Td>
                            <Group gap="sm" wrap="nowrap">
                                <Avatar
                                    src={ch.profile_image_url || undefined}
                                    alt={ch.name}
                                    size={42}
                                    radius="xl"
                                    color="violet"
                                >
                                    {getInitial(ch.name)}
                                </Avatar>
                                <Stack gap={2}>
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
                                    <Text size="xs" c="dimmed">
                                        구독 {formatSubs(ch.subscribers)} · 영상 {formatVideoCount(ch.total_video_count)} · 첫 업로드 {formatDateLabel(ch.first_upload_date)}
                                    </Text>
                                </Stack>
                            </Group>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                            <Badge variant="light" color={getGradeColor(getPerformanceGrade(ch, performanceThresholds))} size="sm">
                                {getPerformanceGrade(ch, performanceThresholds)}
                            </Badge>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatSubs(ch.subscribers)}</Table.Td>
                        <Table.Td style={{ textAlign: 'right', fontWeight: 600 }}>
                            {formatCount(ch.avg_views)}
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatCount(ch.median_views)}</Table.Td>
                        <Table.Td>
                            <Badge variant="light" color={getCategoryColor(ch.category)} size="sm">
                                {ch.category}
                            </Badge>
                        </Table.Td>
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
                        <Table.Td>
                            <Text size="xs" c="gray.7">
                                {getInsight(ch, performanceThresholds)}
                            </Text>
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    );
}

// ── 카드 (모바일) ──
function ChannelCard({
    channel: ch,
    performanceThresholds,
}: {
    channel: Channel;
    performanceThresholds: ReturnType<typeof getPerformanceThresholds>;
}) {
    const grade = getPerformanceGrade(ch, performanceThresholds);

    return (
        <Card padding="sm" radius="md" withBorder>
            <Group justify="space-between" mb={4}>
                <Group gap="sm" wrap="nowrap">
                    <Avatar
                        src={ch.profile_image_url || undefined}
                        alt={ch.name}
                        size={38}
                        radius="xl"
                        color="violet"
                    >
                        {getInitial(ch.name)}
                    </Avatar>
                    <Stack gap={1}>
                        <Text fw={600} size="sm">
                            {ch.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                            구독 {formatSubs(ch.subscribers)} · 영상 {formatVideoCount(ch.total_video_count)} · 첫 업로드 {formatDateLabel(ch.first_upload_date)}
                        </Text>
                    </Stack>
                </Group>
                <Anchor href={ch.channel_url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} color="#8b5cf6" />
                </Anchor>
            </Group>
            <Group gap="xs" mb={4}>
                <Badge variant="light" color={getCategoryColor(ch.category)} size="xs">
                    {ch.category}
                </Badge>
                <Badge variant="light" color="gray" size="xs">
                    {ch.subcategory}
                </Badge>
            </Group>
            <Group gap="xs" mb={2}>
                <Badge variant="light" color={getGradeColor(grade)} size="xs">
                    {grade}
                </Badge>
                <Text size="xs" c="dimmed">
                    ·
                </Text>
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
            <Text size="xs" c="gray.7" mt={4}>
                {getInsight(ch, performanceThresholds)}
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
