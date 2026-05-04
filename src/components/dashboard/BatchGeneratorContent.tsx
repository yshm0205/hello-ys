'use client';

/**
 * 배치 스크립트 생성기
 * - 니치 선택 → 소재 입력 → 큐 → 순차 생성 → 탭형 결과 확인
 * - 리서치 기반 UX: Writesonic 자동 저장 + 탭형 결과 + 컴팩트 큐
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
    Container,
    Title,
    Text,
    Button,
    Stack,
    Card,
    Textarea,
    Group,
    Badge,
    Box,
    ActionIcon,
    Progress,
    Paper,
    CopyButton,
    Tabs,
} from '@mantine/core';
import {
    Plus,
    Trash2,
    Play,
    Zap,
    Clock,
    Check,
    AlertCircle,
    Copy,
    ListOrdered,
    ArrowRight,
    Brain,
    FolderOpen,
    RotateCcw,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useDashboardShell } from '@/components/dashboard/DashboardLayout';

// ============ 타입 ============

interface QueueItem {
    id: string;
    material: string;
    niche?: string;
    status: 'waiting' | 'generating' | 'done' | 'error';
    phase?: 'analyzing' | 'generating' | 'reviewing';
    scripts?: Array<{ hook: string; full_script: string }>;
    error?: string;
    elapsed?: number;
    creditsRefunded?: number;
    finishedAt?: string;
}

interface RemoteBatchJobItem {
    id: string;
    material: string;
    niche?: string;
    status: 'queued' | 'processing' | 'done' | 'error' | 'cancelled';
    phase?: 'analyzing' | 'generating' | 'reviewing' | null;
    scripts?: Array<{ hook: string; full_script: string }> | null;
    error?: string | null;
    elapsed?: number | null;
    creditsRefunded?: number;
    sortOrder?: number;
    finishedAt?: string | null;
}

interface RemoteBatchJob {
    id: string;
    niche: string;
    status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
    lastError?: string | null;
    items: RemoteBatchJobItem[];
    totalCount: number;
    doneCount: number;
}

interface RemoteBatchCurrentResponse {
    job: RemoteBatchJob | null;
    recentCompleted?: RemoteBatchJobItem[] | null;
}

// ============ 니치 (V2 에셋 재사용) ============

const NICHE_OPTIONS = [
    { value: 'knowledge', label: '잡학지식', desc: '놀라운 사실, 과학 원리', image: '/images/niches/knowledge.png', enabled: true },
    { value: 'seollem', label: '설렘/썰', desc: '연애·썸·고백 등 감성 스토리', image: '/images/niches/seollem.png', enabled: true },
    { value: 'lifetips', label: '쇼핑 영상', desc: '꿀팁·아이템 리뷰·쇼핑 썰', image: null, enabled: true },
    { value: 'animal', label: '동물/자연', desc: '신기한 동물, 자연 현상', image: null, enabled: false },
];

const NICHE_LABELS: Record<string, string> = {
    knowledge: '지식',
    seollem: '설렘/썰',
    lifetips: '쇼핑',
    animal: '동물',
};

const NICHE_COLORS: Record<string, string> = {
    knowledge: 'violet',
    seollem: 'pink',
    lifetips: 'orange',
    animal: 'green',
};

function getQueueNicheLabel(niche?: string) {
    return NICHE_LABELS[niche ?? ''] ?? '지식';
}

function getQueueNicheColor(niche?: string) {
    return NICHE_COLORS[niche ?? ''] ?? 'violet';
}

// ============ 에이전트 팀 (V2 에셋 재사용) ============

const AGENT_TEAM = [
    { name: '리서치 분석가', role: 'Researcher', image: '/images/robot-analyzer.png', color: '#8b5cf6', desc: '패턴을 분석하고 훅을 설계합니다', icon3D: '/images/icons/icon-search.png' },
    { name: '스크립트 작가', role: 'Script Writer', image: '/images/robot-hero.png', color: '#8b5cf6', desc: '3개의 스크립트를 병렬 생성합니다', icon3D: '/images/icons/icon-pen.png' },
    { name: '품질 검수자', role: 'Quality Checker', image: '/images/robot-working.png', color: '#22c55e', desc: '말투와 흐름을 최적화합니다', icon3D: '/images/icons/icon-shield.png' },
];

const mono = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' };
const RECENT_COMPLETED_WINDOW_MS = 2 * 60 * 60 * 1000;

// ============ 에이전트 진행 표시 ============

function AgentProgressMini({ phase }: { phase: 'analyzing' | 'generating' | 'reviewing' }) {
    const getStatus = (index: number): 'waiting' | 'active' | 'done' => {
        if (phase === 'analyzing') return index === 0 ? 'active' : 'waiting';
        if (phase === 'generating') return index === 0 ? 'done' : index === 1 ? 'active' : 'waiting';
        if (phase === 'reviewing') return index <= 1 ? 'done' : 'active';
        return 'waiting';
    };

    return (
        <Box style={{
            background: 'rgba(139, 92, 246, 0.03)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.12)',
        }}>
            <Stack gap="md">
                <Group justify="center" gap="xs">
                    <Brain size={18} color="#8b5cf6" />
                    <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>
                        AI 에이전트 팀이 작업 중입니다
                    </Text>
                </Group>

                <Group justify="center" align="flex-start" gap="xl" wrap="wrap" className="batch-agent-team">
                    {AGENT_TEAM.map((agent, index) => {
                        const status = getStatus(index);
                        return (
                            <Box key={agent.role} style={{ position: 'relative' }}>
                                <Stack align="center" gap="sm" className="batch-agent-card">
                                    <Box style={{ position: 'relative', width: 56, height: 56 }}>
                                        <Box style={{
                                            position: 'absolute', inset: -3, borderRadius: '50%',
                                            border: `2.5px solid ${status === 'active' ? agent.color : status === 'done' ? '#22c55e' : '#e5e7eb'}`,
                                            animation: status === 'active' ? 'pulse 2s infinite' : 'none',
                                            boxShadow: status === 'active' ? `0 0 16px ${agent.color}40` : 'none',
                                        }} />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={agent.image} alt={agent.name} width={56} height={56}
                                            style={{
                                                borderRadius: '50%', objectFit: 'cover',
                                                filter: status === 'waiting' ? 'grayscale(80%) opacity(0.5)' : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                        {status === 'done' && (
                                            <Box style={{
                                                position: 'absolute', bottom: -2, right: -2,
                                                width: 22, height: 22, borderRadius: '50%',
                                                background: '#22c55e', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 6px rgba(34, 197, 94, 0.4)',
                                            }}>
                                                <Check size={12} color="#fff" strokeWidth={3} />
                                            </Box>
                                        )}
                                    </Box>
                                    <Stack align="center" gap={2}>
                                        <Group gap={4}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={agent.icon3D} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                                            <Text fw={600} size="xs" style={{
                                                color: status === 'active' ? agent.color : status === 'done' ? '#374151' : '#9ca3af',
                                            }}>{agent.name}</Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" ta="center" style={{ fontSize: '10px' }}>
                                            {status === 'active' ? agent.desc : status === 'done' ? '완료!' : '대기 중'}
                                        </Text>
                                    </Stack>
                                </Stack>
                                {index < 2 && (
                                    <Box className="batch-agent-arrow" style={{ position: 'absolute', top: 28, right: -20, transform: 'translateY(-50%)' }}>
                                        <ArrowRight size={16} color={getStatus(index) === 'done' ? '#22c55e' : '#e5e7eb'} style={{ transition: 'color 0.3s' }} />
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Group>

                <Text ta="center" size="xs" c="gray.5">
                    {phase === 'analyzing' && '소재 패턴을 분석하고 훅을 설계하는 중...'}
                    {phase === 'generating' && '3개 스크립트를 병렬 생성하는 중...'}
                    {phase === 'reviewing' && '품질 검증 및 말투 최적화 중...'}
                </Text>
            </Stack>
        </Box>
    );
}

// ============ 결과 뷰어 (탭형) ============

function ScriptResultViewer({ item }: { item: QueueItem }) {
    if (!item.scripts) return null;

    const getCharCount = (script: string) => script.replace(/\s/g, '').length;
    const getEstimatedSeconds = (charCount: number) => Math.round(charCount / 7);

    return (
        <Card padding="lg" radius="lg" withBorder style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
            <Stack gap="md">
                {/* 소재 + 메타 */}
                <Group justify="space-between" wrap="nowrap">
                    <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text size="xs" c="gray.5" mb={2}>소재</Text>
                        <Text size="sm" fw={500} style={{ color: 'var(--mantine-color-text)' }} lineClamp={2}>{item.material}</Text>
                    </Box>
                    {item.elapsed && (
                        <Badge variant="light" color="gray" size="sm" leftSection={<Clock size={12} />} style={{ flexShrink: 0 }}>
                            {item.elapsed}초
                        </Badge>
                    )}
                </Group>

                {/* 탭: 옵션 A / B / C */}
                <Tabs defaultValue="0" variant="pills" color="violet" radius="lg">
                    <Tabs.List mb="md">
                        {item.scripts.map((_, si) => (
                            <Tabs.Tab key={si} value={String(si)} style={{ fontWeight: 600 }}>
                                옵션 {String.fromCharCode(65 + si)}
                            </Tabs.Tab>
                        ))}
                    </Tabs.List>

                    {item.scripts.map((script, si) => {
                        const charCount = getCharCount(script.full_script);
                        const seconds = getEstimatedSeconds(charCount);

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
                                            {script.hook}
                                        </Text>
                                    </Paper>

                                    {/* 전체 스크립트 */}
                                    <Paper p="md" radius="md" withBorder>
                                        <Text size="sm" style={{
                                            color: 'var(--mantine-color-text)',
                                            lineHeight: 1.8,
                                            whiteSpace: 'pre-wrap',
                                        }}>
                                            {script.full_script}
                                        </Text>
                                    </Paper>

                                    {/* 하단: 자수 + 액션 */}
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <Text size="xs" c="gray.5" style={mono}>
                                                {charCount}자
                                            </Text>
                                            <Text size="xs" c="gray.5">·</Text>
                                            <Text size="xs" c="gray.5" style={mono}>
                                                약 {seconds}초
                                            </Text>
                                        </Group>
                                        <CopyButton value={script.full_script}>
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
                                    </Group>
                                </Stack>
                            </Tabs.Panel>
                        );
                    })}
                </Tabs>
            </Stack>
        </Card>
    );
}

// ============ 메인 컴포넌트 ============

export function BatchGeneratorContent() {
    const { initialCredits } = useDashboardShell();
    const [niche, setNiche] = useState('knowledge');
    const [materialInput, setMaterialInput] = useState('');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [recentCompleted, setRecentCompleted] = useState<QueueItem[]>([]);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<'draft' | 'running' | 'paused' | 'completed' | 'failed' | null>(null);
    const [currentTotalCount, setCurrentTotalCount] = useState(0);
    const [currentDoneCount, setCurrentDoneCount] = useState(0);
    const [selectedResult, setSelectedResult] = useState<string | null>(null);
    const [credits, setCredits] = useState<number | null>(initialCredits);
    const [creditError, setCreditError] = useState<string | null>(null);
    const jobIdRef = useRef<string | null>(null);
    const creditsRef = useRef<number | null>(initialCredits);
    const processLockRef = useRef(false);
    const pollingRef = useRef<number | null>(null);
    const MAX_QUEUE = 10;

    const isRecentCompleted = useCallback((item: QueueItem) => {
        if (item.status !== 'done' || !item.finishedAt) return false;
        return Date.now() - new Date(item.finishedAt).getTime() < RECENT_COMPLETED_WINDOW_MS;
    }, []);

    const toQueueItem = useCallback((item: RemoteBatchJobItem): QueueItem => ({
        id: item.id,
        material: item.material,
        niche: item.niche,
        status:
            item.status === 'queued'
                ? 'waiting'
                : item.status === 'processing'
                    ? 'generating'
                    : item.status === 'done'
                        ? 'done'
                        : 'error',
        phase: item.phase ?? undefined,
        scripts: item.scripts ?? undefined,
        error: item.error ?? undefined,
        elapsed: item.elapsed ?? undefined,
        creditsRefunded: item.creditsRefunded ?? 0,
        finishedAt: item.finishedAt ?? undefined,
    }), []);

    const mergeRecentCompleted = useCallback((items: QueueItem[]) => {
        const deduped = new Map<string, QueueItem>();

        for (const item of items) {
            if (!isRecentCompleted(item)) continue;

            const existing = deduped.get(item.id);
            if (!existing) {
                deduped.set(item.id, item);
                continue;
            }

            const existingFinished = existing.finishedAt ? new Date(existing.finishedAt).getTime() : 0;
            const nextFinished = item.finishedAt ? new Date(item.finishedAt).getTime() : 0;
            if (nextFinished >= existingFinished) {
                deduped.set(item.id, item);
            }
        }

        return Array.from(deduped.values())
            .sort((a, b) => {
                const aFinished = a.finishedAt ? new Date(a.finishedAt).getTime() : 0;
                const bFinished = b.finishedAt ? new Date(b.finishedAt).getTime() : 0;
                return bFinished - aFinished;
            })
            .slice(0, 3);
    }, [isRecentCompleted]);

    const applyBatchState = useCallback((job: RemoteBatchJob | null, serverRecentCompleted?: RemoteBatchJobItem[] | null) => {
        const mappedItems = job ? job.items.map(toQueueItem) : [];
        const activeItems = mappedItems.filter((item) => item.status !== 'done');
        const doneItems = mappedItems.filter((item) => item.status === 'done');
        const nextRecentCompleted = (serverRecentCompleted ?? []).map(toQueueItem).filter((item) => item.status === 'done');

        setJobId(job?.id ?? null);
        setJobStatus(job?.status ?? null);
        setCurrentTotalCount(job?.totalCount ?? 0);
        setCurrentDoneCount(job?.doneCount ?? 0);
        setQueue(activeItems);
        setRecentCompleted((prev) => mergeRecentCompleted([
            ...doneItems,
            ...(serverRecentCompleted ? nextRecentCompleted : prev),
        ]));

        if (job?.status === 'paused' && job.lastError) {
            setCreditError(job.lastError);
        } else if (!job?.lastError) {
            setCreditError(null);
        }
    }, [mergeRecentCompleted, toQueueItem]);

    useEffect(() => {
        if (initialCredits === null) return;
        setCredits((prev) => prev ?? initialCredits);
        if (creditsRef.current === null) {
            creditsRef.current = initialCredits;
        }
    }, [initialCredits]);

    const fetchCurrentJob = useCallback(async () => {
        try {
            const res = await fetch('/api/batch-jobs/current', { cache: 'no-store' });
            const data = await res.json() as RemoteBatchCurrentResponse & { error?: string };

            if (!res.ok) {
                setCreditError(data.error || '배치 큐를 불러오지 못했습니다.');
                return null;
            }

            const job = (data.job ?? null) as RemoteBatchJob | null;
            applyBatchState(job, data.recentCompleted ?? []);
            return job;
        } catch {
            setCreditError('배치 큐를 불러오지 못했습니다.');
            return null;
        }
    }, [applyBatchState]);

    useEffect(() => {
        jobIdRef.current = jobId;
    }, [jobId]);

    const processNext = useCallback(async (targetJobId?: string) => {
        const activeJobId = targetJobId ?? jobIdRef.current;
        if (!activeJobId || processLockRef.current) return null;

        processLockRef.current = true;

        try {
            const res = await fetch(`/api/batch-jobs/${activeJobId}/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await res.json().catch(() => ({})) as RemoteBatchCurrentResponse & { credits?: number; error?: string };

            if (typeof data.credits === 'number') {
                setCredits(data.credits);
                creditsRef.current = data.credits;
            }

            if (data.job) {
                applyBatchState(data.job as RemoteBatchJob, data.recentCompleted ?? undefined);
            } else {
                await fetchCurrentJob();
            }

            if (!res.ok) {
                setCreditError(data.error || '배치 생성에 실패했습니다.');
                return null;
            }

            if (data.job?.status !== 'paused') {
                setCreditError(null);
            }

            return (data.job ?? null) as RemoteBatchJob | null;
        } catch {
            setCreditError('배치 생성 서버 연결에 실패했습니다.');
            return null;
        } finally {
            processLockRef.current = false;
        }
    }, [applyBatchState, fetchCurrentJob]);

    useEffect(() => {
        async function initializeBatchPage() {
            const job = await fetchCurrentJob();
            if (!job || job.status !== 'running') return;

            const hasProcessing = job.items.some((item) => item.status === 'processing');
            const hasQueued = job.items.some((item) => item.status === 'queued');

            if (!hasProcessing && hasQueued) {
                await processNext(job.id);
            }
        }

        void initializeBatchPage();
    }, [fetchCurrentJob, processNext]);

    useEffect(() => {
        if (!jobId || jobStatus !== 'running') {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            return;
        }

        let tickRunning = false;
        const tick = async () => {
            if (document.visibilityState !== 'visible') return;
            if (tickRunning) return;
            tickRunning = true;

            try {
                const job = await fetchCurrentJob();
                if (!job || job.status !== 'running') return;

                const hasProcessing = job.items.some((item) => item.status === 'processing');
                const hasQueued = job.items.some((item) => item.status === 'queued');

                if (!hasProcessing && hasQueued) {
                    await processNext(job.id);
                }
            } finally {
                tickRunning = false;
            }
        };

        const stopPolling = () => {
            if (pollingRef.current) {
                window.clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
        };

        const startPolling = () => {
            stopPolling();
            if (document.visibilityState !== 'visible') return;

            pollingRef.current = window.setInterval(() => {
                void tick();
            }, 5000);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                startPolling();
                void tick();
                return;
            }
            stopPolling();
        };

        const handleFocus = () => {
            if (document.visibilityState === 'visible') {
                void tick();
            }
        };

        startPolling();
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [fetchCurrentJob, jobId, jobStatus, processNext]);

    const addToQueue = useCallback(async () => {
        const material = materialInput.trim();
        if (!material) return;

        // 낙관적 UI: 즉시 큐에 추가
        const tempId = `temp_${Date.now()}`;
        setQueue(prev => [...prev, { id: tempId, material, niche, status: 'waiting' as const }]);
        setMaterialInput('');
        setCreditError(null);

        try {
            const res = await fetch('/api/batch-jobs/current', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ material, niche }),
            });
            const data = await res.json() as RemoteBatchCurrentResponse & { error?: string };

            if (!res.ok) {
                // 실패 시 롤백
                setQueue(prev => prev.filter(q => q.id !== tempId));
                setMaterialInput(material);
                setCreditError(data.error || '큐에 추가하지 못했습니다.');
                return;
            }

            applyBatchState((data.job ?? null) as RemoteBatchJob | null, data.recentCompleted ?? []);
        } catch {
            setQueue(prev => prev.filter(q => q.id !== tempId));
            setMaterialInput(material);
            setCreditError('큐에 추가하지 못했습니다.');
        }
    }, [applyBatchState, materialInput, niche]);

    const removeFromQueue = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/batch-jobs/items/${id}`, { method: 'DELETE' });
            const data = await res.json();

            if (!res.ok) {
                setCreditError(data.error || '큐 항목을 삭제하지 못했습니다.');
                return;
            }

            applyBatchState((data.job ?? null) as RemoteBatchJob | null);
        } catch {
            setCreditError('큐 항목을 삭제하지 못했습니다.');
        }
    }, [applyBatchState]);

    const retryItem = useCallback(async (id: string) => {
        try {
            setCreditError(null);
            const res = await fetch(`/api/batch-jobs/items/${id}/retry`, { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                setCreditError(data.error || '재시도에 실패했습니다.');
                return;
            }

            applyBatchState((data.job ?? null) as RemoteBatchJob | null);

            // 재시도 후 자동으로 처리 시작
            if (data.job?.id) {
                setTimeout(() => processNext(data.job.id), 500);
            }
        } catch {
            setCreditError('재시도에 실패했습니다.');
        }
    }, [applyBatchState, processNext]);

    const startGeneration = useCallback(async () => {
        if (!jobId) return;
        setCreditError(null);

        // 즉시 UI 전환: 첫 번째 waiting → generating 표시
        setJobStatus('running');
        setQueue(prev => {
            const idx = prev.findIndex(q => q.status === 'waiting');
            if (idx === -1) return prev;
            const updated = [...prev];
            updated[idx] = { ...updated[idx], status: 'generating', phase: 'analyzing' };
            return updated;
        });

        // 백그라운드에서 실제 process (6~7초 걸려도 UI는 이미 전환됨)
        await processNext(jobId);
    }, [jobId, processNext]);

    const waitingCount = queue.filter(q => q.status === 'waiting').length;
    const recentCompletedCount = recentCompleted.length;
    const activeSlotCount = queue.length;
    const generatingItem = queue.find(q => q.status === 'generating');
    const selectedItem = recentCompleted.find(q => q.id === selectedResult);
    const isRunning = jobStatus === 'running' || queue.some((item) => item.status === 'generating');

    useEffect(() => {
        if (selectedResult && !recentCompleted.some((item) => item.id === selectedResult)) {
            setSelectedResult(null);
        }
    }, [recentCompleted, selectedResult]);

    useEffect(() => {
        if (recentCompleted.length === 0) return;

        const prune = () => {
            setRecentCompleted((prev) => prev.filter(isRecentCompleted));
        };

        prune();
        const timer = window.setInterval(prune, 60 * 1000);
        return () => window.clearInterval(timer);
    }, [isRecentCompleted, recentCompleted.length]);

    return (
        <Container size="md" py="lg">
            <Stack gap="xl">

                {/* ──── 헤더 ──── */}
                <Box>
                    <Group gap="sm" mb={4}>
                        <Zap size={24} color="#8b5cf6" />
                        <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>스크립트 생성</Title>
                    </Group>
                    <Text size="sm" c="gray.6">
                        소재를 추가하고 한 번에 생성하세요
                    </Text>
                </Box>

                {/* ──── 니치 선택 ──── */}
                <Box>
                    <Text fw={600} size="sm" c="dimmed" mb="sm">채널 니치</Text>
                    <Box style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: '12px',
                        maxWidth: '560px',
                    }}>
                        {NICHE_OPTIONS.map((opt) => {
                            const isSelected = niche === opt.value;
                            return (
                                <Box
                                    key={opt.value}
                                    onClick={() => opt.enabled && setNiche(opt.value)}
                                    style={{
                                        borderRadius: '12px',
                                        border: isSelected ? '2px solid #8b5cf6' : opt.enabled ? '2px solid var(--mantine-color-default-border)' : '2px dashed var(--mantine-color-default-border)',
                                        background: isSelected ? 'rgba(139, 92, 246, 0.04)' : 'var(--mantine-color-body)',
                                        cursor: opt.enabled ? 'pointer' : 'not-allowed',
                                        opacity: opt.enabled ? 1 : 0.5,
                                        transition: 'all 0.15s ease',
                                        overflow: 'hidden',
                                        boxShadow: isSelected ? '0 0 0 2px #8b5cf6' : 'none',
                                        position: 'relative',
                                    }}
                                >
                                    {!opt.enabled && (
                                        <Box style={{
                                            position: 'absolute', top: 8, right: 8, zIndex: 10,
                                            padding: '2px 8px', borderRadius: '99px',
                                            background: '#9ca3af', color: '#fff',
                                            fontSize: '10px', fontWeight: 700,
                                            textTransform: 'uppercase' as const,
                                        }}>
                                            Soon
                                        </Box>
                                    )}
                                    {isSelected && (
                                        <Box style={{
                                            position: 'absolute', top: 8, right: 8, zIndex: 10,
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#8b5cf6', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Check size={12} color="#fff" strokeWidth={3} />
                                        </Box>
                                    )}
                                    <Box style={{ aspectRatio: '9/13', width: '100%', overflow: 'hidden', background: 'var(--mantine-color-gray-1)' }}>
                                        {opt.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={opt.image} alt={opt.label}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Box style={{ width: 40, height: 40, opacity: 0.3 }}>
                                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                                                        <rect x="3" y="3" width="18" height="18" rx="2" />
                                                        <circle cx="8.5" cy="8.5" r="1.5" />
                                                        <path d="m21 15-5-5L5 21" />
                                                    </svg>
                                                </Box>
                                            </Box>
                                        )}
                                    </Box>
                                    <Box style={{ padding: '10px', textAlign: 'center' }}>
                                        <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)', opacity: opt.enabled ? 1 : 0.5 }}>
                                            {opt.label}
                                        </Text>
                                        <Text size="xs" c="gray.5" mt={2}>{opt.desc}</Text>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* ──── 소재 입력 + 생성 큐 (통합) ──── */}
                <Card padding="lg" radius="lg" withBorder>
                    <Stack gap="md">
                        {/* 소재 입력 — 항상 상단 */}
                        <Textarea
                            placeholder="YouTube Shorts 소재를 입력하세요..."
                            minRows={2}
                            maxRows={5}
                            autosize
                            value={materialInput}
                            onChange={(e) => setMaterialInput(e.currentTarget.value)}
                            styles={{
                                input: {
                                    border: '1.5px solid var(--mantine-color-default-border)',
                                    fontSize: '15px',
                                    lineHeight: 1.7,
                                },
                            }}
                        />
                        <Group justify="space-between">
                            <Text size="xs" c={materialInput.trim().length > 0 && materialInput.trim().length < 10 ? "red.5" : "gray.5"}>
                                {materialInput.trim().length > 0 && materialInput.trim().length < 10
                                    ? `소재를 10자 이상 입력해 주세요 (현재 ${materialInput.trim().length}자)`
                                    : <>1개당 10cr{credits !== null && ` · 보유: ${credits}cr`}</>
                                }
                            </Text>
                            <Group gap="xs">
                                <Button
                                    leftSection={<Plus size={16} />}
                                    variant="light"
                                    color="violet"
                                    radius="lg"
                                    size="sm"
                                    onClick={addToQueue}
                                    disabled={!materialInput.trim() || materialInput.trim().length < 10 || activeSlotCount >= MAX_QUEUE}
                                >
                                    추가 ({activeSlotCount}/{MAX_QUEUE})
                                </Button>
                                {!isRunning && waitingCount > 0 && (
                                    <Button
                                        leftSection={<Play size={16} />}
                                        color="violet"
                                        radius="lg"
                                        size="sm"
                                        onClick={startGeneration}
                                    >
                                        생성 시작 ({waitingCount * 10}cr)
                                    </Button>
                                )}
                            </Group>
                        </Group>

                        {/* 크레딧 에러 — 큐 유무와 무관하게 항상 표시 */}
                        {creditError && (
                            <Paper p="sm" radius="md" style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <Group gap="sm">
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text size="sm" c="red.6">{creditError}</Text>
                                </Group>
                            </Paper>
                        )}

                        {/* 현재 작업 큐 */}
                        {queue.length > 0 && (
                            <>
                                <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 12 }}>
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <ListOrdered size={16} color="#8b5cf6" />
                                            <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>현재 큐</Text>
                                            <Badge variant="light" color="violet" size="sm">{queue.length}건</Badge>
                                            {currentDoneCount > 0 && (
                                                <Badge variant="light" color="green" size="sm">{currentDoneCount} 완료</Badge>
                                            )}
                                        </Group>
                                        {isRunning && currentTotalCount > 0 && (
                                            <Badge variant="light" color="orange" size="md" leftSection={<Clock size={14} />}>
                                                {currentDoneCount}/{currentTotalCount} 진행 중
                                            </Badge>
                                        )}
                                    </Group>
                                </Box>

                                {isRunning && currentTotalCount > 1 && (
                                    <Progress
                                        value={(currentDoneCount / currentTotalCount) * 100}
                                        color="violet"
                                        radius="xl"
                                        size="sm"
                                        animated
                                    />
                                )}

                                <Stack gap={4}>
                                    {queue.map((item, index) => (
                                        <Paper
                                            key={item.id}
                                            p="xs"
                                            radius="md"
                                            style={{
                                                border: item.status === 'generating'
                                                    ? '1.5px solid rgba(139, 92, 246, 0.3)'
                                                    : '1.5px solid transparent',
                                                background: item.status === 'generating'
                                                    ? 'rgba(139, 92, 246, 0.02)'
                                                    : 'transparent',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <Group justify="space-between" wrap="nowrap" gap="sm">
                                                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                    <Text size="xs" c="gray.4" style={{ ...mono, flexShrink: 0, width: 20, textAlign: 'right' }}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </Text>

                                                    {item.status === 'waiting' && (
                                                        <Box style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #d1d5db', flexShrink: 0 }} />
                                                    )}
                                                    {item.status === 'generating' && (
                                                        <Box style={{
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            border: '2px solid #8b5cf6', borderTopColor: 'transparent',
                                                            animation: 'spin 1s linear infinite', flexShrink: 0,
                                                        }} />
                                                    )}
                                                    {item.status === 'error' && (
                                                        <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                                                    )}

                                                    <Badge
                                                        variant="light"
                                                        color={getQueueNicheColor(item.niche)}
                                                        size="xs"
                                                        radius="sm"
                                                        style={{ flexShrink: 0 }}
                                                    >
                                                        {getQueueNicheLabel(item.niche)}
                                                    </Badge>

                                                    <Text size="sm" lineClamp={1} style={{ color: 'var(--mantine-color-text)', flex: 1, minWidth: 0 }}>
                                                        {item.material}
                                                    </Text>
                                                </Group>

                                                <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                                                    {item.status === 'generating' && item.phase && (
                                                        <Text size="xs" c="violet" fw={500}>
                                                            {item.phase === 'analyzing' ? '분석 중' : item.phase === 'generating' ? '생성 중' : '검수 중'}
                                                        </Text>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <Text size="xs" c={item.creditsRefunded ? "green.6" : "red.5"}>
                                                            {item.creditsRefunded ? `실패 · ${item.creditsRefunded}cr 환불됨` : '실패 · 환불 대기'}
                                                        </Text>
                                                    )}
                                                    {item.status === 'error' && !isRunning && (
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="violet"
                                                            size="sm"
                                                            onClick={() => retryItem(item.id)}
                                                            title="재시도"
                                                        >
                                                            <RotateCcw size={14} />
                                                        </ActionIcon>
                                                    )}
                                                    {(item.status === 'waiting' || item.status === 'error') && !isRunning && (
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            size="sm"
                                                            onClick={() => removeFromQueue(item.id)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </ActionIcon>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Paper>
                                    ))}
                                </Stack>
                            </>
                        )}

                        {/* 최근 완료 */}
                        {recentCompletedCount > 0 && (
                            <>
                                <Box style={{ borderTop: '1px solid var(--mantine-color-default-border)', paddingTop: 12 }}>
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <Check size={16} color="#22c55e" />
                                            <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>최근 완료</Text>
                                            <Badge variant="light" color="green" size="sm">{recentCompletedCount}건</Badge>
                                        </Group>
                                        <Button
                                            component={Link}
                                            href="/dashboard/archive"
                                            variant="subtle"
                                            color="violet"
                                            radius="lg"
                                            size="xs"
                                            leftSection={<FolderOpen size={14} />}
                                        >
                                            보관함
                                        </Button>
                                    </Group>
                                    <Text size="xs" c="gray.5" mt={6}>
                                        최근 완료는 2시간 동안 최대 3건까지 표시됩니다.
                                    </Text>
                                </Box>

                                <Stack gap={4}>
                                    {recentCompleted.map((item, index) => {
                                        const isActive = selectedResult === item.id;
                                        return (
                                            <Paper
                                                key={item.id}
                                                p="xs"
                                                radius="md"
                                                onClick={() => setSelectedResult(isActive ? null : item.id)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: isActive ? '1.5px solid #8b5cf6' : '1.5px solid transparent',
                                                    background: isActive ? 'rgba(139, 92, 246, 0.04)' : 'rgba(34, 197, 94, 0.03)',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                <Group justify="space-between" wrap="nowrap" gap="sm">
                                                    <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                        <Text size="xs" c="gray.4" style={{ ...mono, flexShrink: 0, width: 20, textAlign: 'right' }}>
                                                            {String(index + 1).padStart(2, '0')}
                                                        </Text>
                                                        <Box style={{
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            background: '#22c55e', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        }}>
                                                            <Check size={10} color="#fff" strokeWidth={3} />
                                                        </Box>
                                                        <Badge
                                                            variant="light"
                                                            color={getQueueNicheColor(item.niche)}
                                                            size="xs"
                                                            radius="sm"
                                                            style={{ flexShrink: 0 }}
                                                        >
                                                            {getQueueNicheLabel(item.niche)}
                                                        </Badge>
                                                        <Text size="sm" lineClamp={1} style={{ color: 'var(--mantine-color-text)', flex: 1, minWidth: 0 }}>
                                                            {item.material}
                                                        </Text>
                                                    </Group>

                                                    <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                                                        {item.elapsed && (
                                                            <Text size="xs" c="gray.5" style={mono}>{item.elapsed}초</Text>
                                                        )}
                                                        <Text size="xs" c="violet" fw={500}>
                                                            {isActive ? '접기' : '보기'}
                                                        </Text>
                                                    </Group>
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card>

                {/* ──── 생성 중: 에이전트 진행 표시 ──── */}
                {generatingItem && generatingItem.phase && (
                    <AgentProgressMini phase={generatingItem.phase} />
                )}

                {/* ──── 결과 뷰어 (탭형) ──── */}
                {selectedItem && selectedItem.status === 'done' && (
                    <ScriptResultViewer item={selectedItem} />
                )}

                {/* ──── 전체 완료 배너 ──── */}
                {jobStatus === 'completed' && currentDoneCount > 0 && !selectedResult && (
                    <Paper p="md" radius="md" style={{ background: 'rgba(34, 197, 94, 0.04)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                        <Group justify="space-between">
                            <Group gap="sm">
                                <Box style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: '#22c55e', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Check size={14} color="#fff" strokeWidth={3} />
                                </Box>
                                <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>
                                    {currentDoneCount}건 완료 · 최근 완료에서 바로 확인할 수 있습니다
                                </Text>
                            </Group>
                            <Button
                                component={Link}
                                href="/dashboard/archive"
                                variant="light"
                                color="violet"
                                radius="lg"
                                size="xs"
                                leftSection={<FolderOpen size={14} />}
                            >
                                보관함
                            </Button>
                        </Group>
                    </Paper>
                )}

                {/* CSS */}
                <style>{`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.05); }
                    }
                    @media (max-width: 768px) {
                        .batch-agent-team { gap: 12px !important; }
                        .batch-agent-arrow { display: none !important; }
                    }
                `}</style>
            </Stack>
        </Container>
    );
}
