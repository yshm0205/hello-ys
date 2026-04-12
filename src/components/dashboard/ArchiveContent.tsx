'use client';

/**
 * 보관함 페이지 (v2)
 * - 왼쪽: 날짜별 그룹 카드 리스트 + 검색/필터
 * - 오른쪽: 탭형 스크립트 뷰어 (A/B/C)
 * - 모바일: 리스트 → 뷰어 토글
 */

import { useState, useEffect, useMemo } from 'react';
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
    ActionIcon,
    Tooltip,
    TextInput,
    SegmentedControl,
    Paper,
    CopyButton,
    Tabs,
    Loader,
} from '@mantine/core';
import {
    FolderOpen,
    Trash2,
    Search,
    Copy,
    Check,
    Clock,
    ChevronLeft,
    Zap,
    Plus,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// ============ 타입 ============

interface ScriptVersion {
    hook_preview: string;
    full_script: string;
    archetype?: string;
}

interface ScriptItem {
    id: string;
    title: string;
    inputText: string;
    scripts: ScriptVersion[];
    createdAt: string;
    archetype: string;
    versions: number;
    niche?: string | null;
    tone?: string | null;
}

// ============ 유틸 ============

const mono = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' };

const NICHE_LABELS: Record<string, string> = {
    knowledge: '지식',
    seollem: '설렘',
    animal: '동물',
    history: '역사',
    place: '여행',
};

function getNicheLabel(item: ScriptItem): string {
    if (item.niche && NICHE_LABELS[item.niche]) return NICHE_LABELS[item.niche];
    if (item.archetype === 'V2_PIPELINE') return item.niche || '기타';
    return '지식';
}

function getCharCount(text: string): number {
    return text.replace(/\s/g, '').length;
}

function getRelativeDate(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function getDateGroup(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);

    const todayStr = now.toDateString();
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toDateString();

    if (date.toDateString() === todayStr) return '오늘';
    if (date.toDateString() === yesterdayStr) return '어제';
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
}

function groupByDate(items: ScriptItem[]): { label: string; items: ScriptItem[] }[] {
    const groups: Record<string, ScriptItem[]> = {};
    const order: string[] = [];

    items.forEach(item => {
        const label = getDateGroup(item.createdAt);
        if (!groups[label]) {
            groups[label] = [];
            order.push(label);
        }
        groups[label].push(item);
    });

    return order.map(label => ({ label, items: groups[label] }));
}

// ============ 스크립트 뷰어 (재사용) ============

function ScriptViewer({ item, onDelete }: { item: ScriptItem; onDelete: (id: string) => void }) {
    const scripts = item.scripts || [];

    if (scripts.length === 0) {
        return (
            <Card padding="xl" radius="lg" withBorder>
                <Text c="gray.5" ta="center">스크립트 데이터가 없습니다.</Text>
            </Card>
        );
    }

    return (
        <Stack gap="md">
            {/* 소재 정보 */}
            <Box>
                <Text size="xs" c="dimmed" mb={4}>소재</Text>
                <Text size="sm" fw={500} style={{ color: 'var(--mantine-color-text)', lineHeight: 1.6 }}>
                    {item.inputText}
                </Text>
                <Group gap="sm" mt="xs">
                    <Badge variant="light" color="violet" size="sm">{getNicheLabel(item)}</Badge>
                    <Text size="xs" c="dimmed">{getRelativeDate(item.createdAt)}</Text>
                </Group>
            </Box>

            {/* 탭: 옵션 A / B / C */}
            <Tabs defaultValue="0" variant="pills" color="violet" radius="lg">
                <Tabs.List mb="md">
                    {scripts.map((_, si) => (
                        <Tabs.Tab key={si} value={String(si)} style={{ fontWeight: 600 }}>
                            옵션 {String.fromCharCode(65 + si)}
                        </Tabs.Tab>
                    ))}
                </Tabs.List>

                {scripts.map((script, si) => {
                    const text = script.full_script || '';
                    const charCount = getCharCount(text);
                    const seconds = Math.round(charCount / 7);

                    return (
                        <Tabs.Panel key={si} value={String(si)}>
                            <Stack gap="md">
                                {/* 훅 */}
                                <Paper p="md" radius="md" style={{
                                    background: 'rgba(139, 92, 246, 0.04)',
                                    border: '1px solid rgba(139, 92, 246, 0.1)',
                                }}>
                                    <Text size="xs" fw={600} c="violet" mb={4}>훅</Text>
                                    <Text size="sm" fw={500} style={{ color: 'var(--mantine-color-text)', lineHeight: 1.7 }}>
                                        {script.hook_preview}
                                    </Text>
                                </Paper>

                                {/* 전체 스크립트 */}
                                <Paper p="md" radius="md" withBorder>
                                    <Text size="sm" style={{
                                            color: 'var(--mantine-color-text)',
                                        lineHeight: 1.8,
                                        whiteSpace: 'pre-wrap',
                                    }}>
                                        {text}
                                    </Text>
                                </Paper>

                                {/* 하단: 자수 + 액션 */}
                                <Group justify="space-between">
                                    <Group gap="sm">
                                        <Text size="xs" c="dimmed" style={mono}>{charCount}자</Text>
                                        <Text size="xs" c="dimmed">·</Text>
                                        <Text size="xs" c="dimmed" style={mono}>약 {seconds}초</Text>
                                    </Group>
                                    <Group gap="xs">
                                        <CopyButton value={text}>
                                            {({ copied, copy }) => (
                                                <Button
                                                    variant={copied ? 'filled' : 'light'}
                                                    color={copied ? 'green' : 'violet'}
                                                    size="xs"
                                                    radius="lg"
                                                    leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                                                    onClick={copy}
                                                >
                                                    {copied ? '복사됨' : '복사'}
                                                </Button>
                                            )}
                                        </CopyButton>
                                        <Tooltip label="삭제">
                                            <ActionIcon
                                                variant="subtle"
                                                color="red"
                                                size="md"
                                                onClick={() => {
                                                    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
                                                        onDelete(item.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Group>
                                </Group>
                            </Stack>
                        </Tabs.Panel>
                    );
                })}
            </Tabs>
        </Stack>
    );
}

// ============ 메인 ============

export function ArchiveContent() {
    const [scripts, setScripts] = useState<ScriptItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [nicheFilter, setNicheFilter] = useState('all');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'viewer'>('list');

    // 데이터 로드
    useEffect(() => {
        async function fetchScripts() {
            try {
                setIsLoading(true);
                const res = await fetch('/api/scripts/history');
                const data = await res.json();
                if (data.success && data.scripts) {
                    setScripts(data.scripts);
                    // 첫 번째 항목 자동 선택
                    if (data.scripts.length > 0) {
                        setSelectedId(data.scripts[0].id);
                    }
                }
            } catch {
                // ignore
            } finally {
                setIsLoading(false);
            }
        }
        fetchScripts();
    }, []);

    // 필터링
    const filtered = useMemo(() => {
        return scripts.filter(item => {
            const matchSearch = !searchQuery ||
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.inputText.toLowerCase().includes(searchQuery.toLowerCase());

            const matchNiche = nicheFilter === 'all' ||
                item.niche === nicheFilter ||
                (nicheFilter === 'knowledge' && !item.niche && item.archetype !== 'V2_PIPELINE');

            return matchSearch && matchNiche;
        });
    }, [scripts, searchQuery, nicheFilter]);

    // 날짜 그룹핑
    const groups = useMemo(() => groupByDate(filtered), [filtered]);

    // 선택된 항목
    const selectedItem = filtered.find(s => s.id === selectedId) || null;

    // 삭제
    const handleDelete = async (id: string) => {
        try {
            const res = await fetch('/api/scripts/history', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            const data = await res.json();
            if (data.success) {
                setScripts(prev => prev.filter(s => s.id !== id));
                if (selectedId === id) {
                    setSelectedId(null);
                    setMobileView('list');
                }
            }
        } catch {
            alert('삭제에 실패했습니다.');
        }
    };

    // 카드 클릭
    const handleSelect = (id: string) => {
        setSelectedId(id);
        setMobileView('viewer');
    };

    return (
        <Container size="xl" py="md">
            <Stack gap="lg">
                {/* ──── 헤더 ──── */}
                <Group justify="space-between">
                    <Box>
                        <Group gap="sm" mb={4}>
                            <FolderOpen size={24} color="#8b5cf6" />
                            <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>보관함</Title>
                        </Group>
                        <Text size="sm" c="dimmed">
                            생성한 스크립트를 확인하고 관리하세요
                        </Text>
                    </Box>
                    <Button
                        component={Link}
                        href="/dashboard/batch"
                        prefetch={false}
                        leftSection={<Plus size={16} />}
                        color="violet"
                        radius="lg"
                    >
                        새로 만들기
                    </Button>
                </Group>

                {/* ──── 검색 + 필터 ──── */}
                <Group gap="md">
                    <TextInput
                        placeholder="스크립트 검색..."
                        leftSection={<Search size={16} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        radius="lg"
                        style={{ flex: 1, maxWidth: 360 }}
                    />
                    <SegmentedControl
                        value={nicheFilter}
                        onChange={setNicheFilter}
                        data={[
                            { label: '전체', value: 'all' },
                            { label: '지식', value: 'knowledge' },
                            { label: '설렘', value: 'seollem' },
                        ]}
                        radius="lg"
                        color="violet"
                    />
                    <Text size="xs" c="dimmed" style={mono}>
                        {filtered.length}개
                    </Text>
                </Group>

                {/* ──── 로딩 ──── */}
                {isLoading && (
                    <Card padding="xl" radius="lg" withBorder>
                        <Group justify="center" py="xl" gap="sm">
                            <Loader size="sm" color="violet" />
                            <Text c="dimmed">불러오는 중...</Text>
                        </Group>
                    </Card>
                )}

                {/* ──── 빈 상태 ──── */}
                {!isLoading && filtered.length === 0 && (
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack align="center" gap="md" py="xl">
                            <Box style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'rgba(139, 92, 246, 0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <FolderOpen size={28} color="#8b5cf6" />
                            </Box>
                            <Stack gap={4} align="center">
                                <Text fw={600} style={{ color: 'var(--mantine-color-text)' }}>
                                    {scripts.length === 0 ? '아직 생성한 스크립트가 없습니다' : '검색 결과가 없습니다'}
                                </Text>
                                <Text size="sm" c="dimmed">
                                    {scripts.length === 0
                                        ? '스크립트를 만들고 자동으로 보관함에 저장됩니다'
                                        : '다른 검색어를 시도해보세요'}
                                </Text>
                            </Stack>
                            {scripts.length === 0 && (
                                <Button
                                    component={Link}
                                    href="/dashboard/batch"
                                    prefetch={false}
                                    leftSection={<Zap size={16} />}
                                    color="violet"
                                    radius="lg"
                                >
                                    스크립트 만들기
                                </Button>
                            )}
                        </Stack>
                    </Card>
                )}

                {/* ──── 메인 레이아웃: 리스트 + 뷰어 ──── */}
                {!isLoading && filtered.length > 0 && (
                    <Box style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(280px, 340px) 1fr',
                        gap: '20px',
                        alignItems: 'start',
                    }}
                        className="archive-layout"
                    >
                        {/* 왼쪽: 프로젝트 리스트 */}
                        <Box className="archive-list" style={{
                            maxHeight: 'calc(100vh - 240px)',
                            overflowY: 'auto',
                            paddingRight: 4,
                        }}>
                            <Stack gap="md">
                                {groups.map(group => (
                                    <Box key={group.label}>
                                        <Text size="xs" fw={600} c="dimmed" mb="xs"
                                            style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
                                        >
                                            {group.label}
                                        </Text>
                                        <Stack gap={6}>
                                            {group.items.map(item => {
                                                const isActive = selectedId === item.id;
                                                const charCount = item.scripts?.[0]
                                                    ? getCharCount(item.scripts[0].full_script)
                                                    : 0;

                                                return (
                                                    <Paper
                                                        key={item.id}
                                                        p="sm"
                                                        radius="lg"
                                                        onClick={() => handleSelect(item.id)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            border: isActive
                                                                ? '1.5px solid #8b5cf6'
                                                                : '1.5px solid transparent',
                                                            background: isActive
                                                                ? 'rgba(139, 92, 246, 0.04)'
                                                                : 'var(--mantine-color-body)',
                                                            transition: 'all 0.15s ease',
                                                        }}
                                                    >
                                                        <Text size="sm" fw={500} lineClamp={1} style={{ color: 'var(--mantine-color-text)' }} mb={4}>
                                                            {item.title}
                                                        </Text>
                                                        <Group gap="sm" wrap="nowrap">
                                                            <Badge
                                                                variant={isActive ? 'filled' : 'light'}
                                                                color="violet"
                                                                size="xs"
                                                            >
                                                                {getNicheLabel(item)}
                                                            </Badge>
                                                            <Text size="xs" c="dimmed">
                                                                {getRelativeDate(item.createdAt)}
                                                            </Text>
                                                            {charCount > 0 && (
                                                                <Text size="xs" c="dimmed" style={mono}>
                                                                    {charCount}자
                                                                </Text>
                                                            )}
                                                        </Group>
                                                    </Paper>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>

                        {/* 오른쪽: 스크립트 뷰어 */}
                        <Card padding="lg" radius="lg" withBorder className="archive-viewer"
                            style={{
                                position: 'sticky',
                                top: 20,
                                maxHeight: 'calc(100vh - 240px)',
                                overflowY: 'auto',
                            }}
                        >
                            {selectedItem ? (
                                <ScriptViewer item={selectedItem} onDelete={handleDelete} />
                            ) : (
                                <Stack align="center" gap="md" py="xl">
                                    <FolderOpen size={40} color="#d1d5db" />
                                    <Text c="dimmed">
                                        왼쪽에서 스크립트를 선택하세요
                                    </Text>
                                </Stack>
                            )}
                        </Card>
                    </Box>
                )}

                {/* ──── 모바일용 뷰어 오버레이 ──── */}
                {mobileView === 'viewer' && selectedItem && (
                    <Box className="archive-mobile-viewer">
                        <Box mb="md">
                            <Button
                                variant="subtle"
                                color="gray"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                                onClick={() => setMobileView('list')}
                            >
                                목록으로
                            </Button>
                        </Box>
                        <ScriptViewer item={selectedItem} onDelete={handleDelete} />
                    </Box>
                )}

                {/* ──── 반응형 CSS ──── */}
                <style>{`
                    /* 데스크탑: 2컬럼 */
                    .archive-mobile-viewer { display: none; }

                    /* 모바일: 1컬럼 토글 */
                    @media (max-width: 768px) {
                        .archive-layout {
                            grid-template-columns: 1fr !important;
                        }
                        .archive-viewer {
                            display: none !important;
                        }
                        .archive-mobile-viewer {
                            display: block !important;
                        }
                        /* 모바일에서 뷰어 열렸을 때 리스트 숨김 */
                        ${mobileView === 'viewer' ? `
                            .archive-list { display: none !important; }
                        ` : ''}
                    }

                    /* 스크롤바 스타일 */
                    .archive-list::-webkit-scrollbar {
                        width: 4px;
                    }
                    .archive-list::-webkit-scrollbar-thumb {
                        background: rgba(139, 92, 246, 0.2);
                        border-radius: 99px;
                    }
                    .archive-viewer::-webkit-scrollbar {
                        width: 4px;
                    }
                    .archive-viewer::-webkit-scrollbar-thumb {
                        background: rgba(139, 92, 246, 0.2);
                        border-radius: 99px;
                    }
                `}</style>
            </Stack>
        </Container>
    );
}
