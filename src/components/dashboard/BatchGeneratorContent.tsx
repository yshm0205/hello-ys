'use client';

/**
 * 배치 스크립트 생성기
 * - 니치 선택 → 소재 입력 → 큐 → 순차 생성 → 탭형 결과 확인
 * - 리서치 기반 UX: Writesonic 자동 저장 + 탭형 결과 + 컴팩트 큐
 */

import { useState, useCallback } from 'react';
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
    Tooltip,
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
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// ============ 타입 ============

interface QueueItem {
    id: string;
    material: string;
    status: 'waiting' | 'generating' | 'done' | 'error';
    phase?: 'analyzing' | 'generating' | 'reviewing';
    scripts?: Array<{ hook: string; full_script: string }>;
    error?: string;
    elapsed?: number;
}

// ============ 니치 (V2 에셋 재사용) ============

const NICHE_OPTIONS = [
    { value: 'knowledge', label: '잡학지식', desc: '놀라운 사실, 과학 원리', image: '/images/niches/knowledge.png', enabled: true },
    { value: 'seollem', label: '설렘/썰', desc: '연애·썸·고백 등 감성 스토리', image: '/images/niches/seollem.png', enabled: true },
    { value: 'animal', label: '동물/자연', desc: '신기한 동물, 자연 현상', image: null, enabled: false },
];

// ============ 에이전트 팀 (V2 에셋 재사용) ============

const AGENT_TEAM = [
    { name: '리서치 분석가', role: 'Researcher', image: '/images/robot-analyzer.png', color: '#8b5cf6', desc: '패턴을 분석하고 훅을 설계합니다', icon3D: '/images/icons/icon-search.png' },
    { name: '스크립트 작가', role: 'Script Writer', image: '/images/robot-hero.png', color: '#8b5cf6', desc: '3개의 스크립트를 병렬 생성합니다', icon3D: '/images/icons/icon-pen.png' },
    { name: '품질 검수자', role: 'Quality Checker', image: '/images/robot-working.png', color: '#22c55e', desc: '말투와 흐름을 최적화합니다', icon3D: '/images/icons/icon-shield.png' },
];

const mono = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' };

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
                    <Text fw={600} size="sm" className="text-foreground">
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
                        <Text size="sm" fw={500} className="text-foreground" lineClamp={2}>{item.material}</Text>
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
                                        <Text size="sm" fw={500} className="text-foreground" style={{ lineHeight: 1.7 }}>
                                            {script.hook}
                                        </Text>
                                    </Paper>

                                    {/* 전체 스크립트 */}
                                    <Paper p="md" radius="md" withBorder>
                                        <Text size="sm" className="text-foreground" style={{
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
    const [niche, setNiche] = useState('knowledge');
    const [materialInput, setMaterialInput] = useState('');
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [selectedResult, setSelectedResult] = useState<string | null>(null);

    const addToQueue = useCallback(() => {
        if (!materialInput.trim()) return;
        setQueue(prev => [...prev, {
            id: Date.now().toString(),
            material: materialInput.trim(),
            status: 'waiting',
        }]);
        setMaterialInput('');
    }, [materialInput]);

    const removeFromQueue = useCallback((id: string) => {
        setQueue(prev => prev.filter(item => item.id !== id));
    }, []);

    // 데모: 순차 생성 (3페이즈 시뮬레이션)
    const startGeneration = useCallback(async () => {
        setIsRunning(true);

        for (let i = 0; i < queue.length; i++) {
            if (queue[i].status !== 'waiting') continue;

            setQueue(prev => prev.map((q, idx) =>
                idx === i ? { ...q, status: 'generating' as const, phase: 'analyzing' as const } : q
            ));
            await new Promise(r => setTimeout(r, 1500));

            setQueue(prev => prev.map((q, idx) =>
                idx === i ? { ...q, phase: 'generating' as const } : q
            ));
            await new Promise(r => setTimeout(r, 1500));

            setQueue(prev => prev.map((q, idx) =>
                idx === i ? { ...q, phase: 'reviewing' as const } : q
            ));
            await new Promise(r => setTimeout(r, 1000));

            setQueue(prev => prev.map((q, idx) =>
                idx === i ? {
                    ...q,
                    status: 'done' as const,
                    phase: undefined,
                    elapsed: 40 + Math.floor(Math.random() * 25),
                    scripts: [
                        {
                            hook: `"${q.material.slice(0, 30)}에 대해 NASA가 공개한 사진 한 장이 전 세계를 뒤흔들었습니다"`,
                            full_script: `${q.material}에 대한 놀라운 사실이 있습니다.\n\n2024년, 한 연구팀이 이 현상을 처음으로 관측하는 데 성공했는데요.\n\n기존에 알려진 것과 완전히 다른 결과가 나왔습니다.\n\n연구팀은 3년간의 데이터를 분석한 결과, 이전 이론이 틀렸다는 것을 증명했습니다.\n\n가장 충격적인 건, 이 발견이 우리 일상에도 직접적인 영향을 미친다는 겁니다.\n\n전문가들은 앞으로 10년 안에 관련 기술이 상용화될 것으로 보고 있습니다.`,
                        },
                        {
                            hook: `"${q.material.slice(0, 30)}... 과학자들이 10년 넘게 숨겨온 사실이 드러났습니다"`,
                            full_script: `여러분, ${q.material} 들어보신 적 있으신가요?\n\n대부분의 사람들은 이걸 단순한 현상이라고 생각하지만, 실제로는 훨씬 복잡한 메커니즘이 숨어 있습니다.\n\n2023년 네이처에 실린 논문에 따르면, 이 현상의 원인은 지금까지 알려진 것과 정반대였습니다.\n\n쉽게 말해서, 우리가 상식이라고 믿어왔던 게 완전히 틀렸던 겁니다.\n\n더 놀라운 건, 이미 몇몇 기업들이 이 원리를 활용해 새로운 제품을 개발하고 있다는 사실입니다.`,
                        },
                        {
                            hook: `"${q.material.slice(0, 30)}의 비밀... 알고 나면 세상이 다르게 보입니다"`,
                            full_script: `이것 하나만 알면 ${q.material}을 완전히 다른 시각으로 볼 수 있습니다.\n\n보통 사람들은 표면적인 부분만 보고 지나치는데, 그 안에는 놀라운 과학적 원리가 숨어 있거든요.\n\n핵심은 바로 이겁니다.\n\n겉으로 보이는 현상과 실제 작동 원리가 완전히 다릅니다.\n\n이걸 처음 발견한 건 MIT 연구팀이었는데요, 발표 당시 학계에서 큰 논란이 일었습니다.\n\n하지만 이후 반복 실험에서 같은 결과가 나오면서, 지금은 정설로 받아들여지고 있습니다.`,
                        },
                    ],
                } : q
            ));
            setSelectedResult(queue[i].id);
        }

        setIsRunning(false);
    }, [queue]);

    const waitingCount = queue.filter(q => q.status === 'waiting').length;
    const doneCount = queue.filter(q => q.status === 'done').length;
    const generatingItem = queue.find(q => q.status === 'generating');
    const selectedItem = queue.find(q => q.id === selectedResult);

    return (
        <Container size="md" py="lg">
            <Stack gap="xl">

                {/* ──── 헤더 ──── */}
                <Box>
                    <Group gap="sm" mb={4}>
                        <Zap size={24} color="#8b5cf6" />
                        <Title order={2} className="text-foreground">스크립트 생성</Title>
                    </Group>
                    <Text size="sm" c="gray.6">
                        소재를 추가하고 한 번에 생성하세요
                    </Text>
                </Box>

                {/* ──── 니치 선택 ──── */}
                <Box>
                    <Text fw={600} size="sm" className="text-muted-foreground" mb="sm">채널 니치</Text>
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
                                        <Text fw={600} size="sm" className="text-foreground" style={{ opacity: opt.enabled ? 1 : 0.5 }}>
                                            {opt.label}
                                        </Text>
                                        <Text size="xs" c="gray.5" mt={2}>{opt.desc}</Text>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {/* ──── 소재 입력 ──── */}
                <Card padding="lg" radius="lg" withBorder>
                    <Stack gap="md">
                        <Text fw={600} size="sm" className="text-muted-foreground">소재 입력</Text>
                        <Textarea
                            placeholder="YouTube Shorts 소재를 입력하세요..."
                            minRows={3}
                            maxRows={6}
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
                            <Text size="xs" c="gray.5">
                                여러 소재를 큐에 넣을 수 있습니다
                            </Text>
                            <Button
                                leftSection={<Plus size={16} />}
                                variant="light"
                                color="violet"
                                radius="lg"
                                onClick={addToQueue}
                                disabled={!materialInput.trim()}
                            >
                                큐에 추가
                            </Button>
                        </Group>
                    </Stack>
                </Card>

                {/* ──── 생성 큐 (컴팩트) ──── */}
                {queue.length > 0 && (
                    <Card padding="lg" radius="lg" withBorder>
                        <Stack gap="md">
                            {/* 큐 헤더 */}
                            <Group justify="space-between">
                                <Group gap="sm">
                                    <ListOrdered size={18} color="#8b5cf6" />
                                    <Text fw={600} size="sm" className="text-foreground">생성 큐</Text>
                                    <Badge variant="light" color="violet" size="sm">{queue.length}건</Badge>
                                    {doneCount > 0 && (
                                        <Badge variant="light" color="green" size="sm">{doneCount} 완료</Badge>
                                    )}
                                </Group>
                                {!isRunning && waitingCount > 0 && (
                                    <Group gap="xs">
                                        <Text size="xs" c="gray.5" style={mono}>
                                            {waitingCount} × 10cr = {waitingCount * 10}cr
                                        </Text>
                                        <Button
                                            leftSection={<Play size={16} />}
                                            color="violet"
                                            radius="lg"
                                            size="sm"
                                            onClick={startGeneration}
                                        >
                                            생성 시작
                                        </Button>
                                    </Group>
                                )}
                                {isRunning && (
                                    <Badge variant="light" color="orange" size="md" leftSection={<Clock size={14} />}>
                                        {doneCount}/{queue.length} 진행 중
                                    </Badge>
                                )}
                            </Group>

                            {/* 진행률 */}
                            {isRunning && queue.length > 1 && (
                                <Progress
                                    value={(doneCount / queue.length) * 100}
                                    color="violet"
                                    radius="xl"
                                    size="sm"
                                    animated
                                />
                            )}

                            {/* 큐 아이템 목록 — 컴팩트 한줄 리스트 */}
                            <Stack gap={4}>
                                {queue.map((item, index) => {
                                    const isActive = selectedResult === item.id && item.status === 'done';
                                    return (
                                        <Paper
                                            key={item.id}
                                            p="xs"
                                            radius="md"
                                            onClick={() => item.status === 'done' && setSelectedResult(isActive ? null : item.id)}
                                            style={{
                                                cursor: item.status === 'done' ? 'pointer' : 'default',
                                                border: isActive
                                                    ? '1.5px solid #8b5cf6'
                                                    : item.status === 'generating'
                                                        ? '1.5px solid rgba(139, 92, 246, 0.3)'
                                                        : '1.5px solid transparent',
                                                background: isActive
                                                    ? 'rgba(139, 92, 246, 0.04)'
                                                    : item.status === 'generating'
                                                        ? 'rgba(139, 92, 246, 0.02)'
                                                        : 'transparent',
                                                transition: 'all 0.15s ease',
                                            }}
                                        >
                                            <Group justify="space-between" wrap="nowrap" gap="sm">
                                                <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                    {/* 번호 */}
                                                    <Text size="xs" c="gray.4" style={{ ...mono, flexShrink: 0, width: 20, textAlign: 'right' }}>
                                                        {String(index + 1).padStart(2, '0')}
                                                    </Text>

                                                    {/* 상태 아이콘 */}
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
                                                    {item.status === 'done' && (
                                                        <Box style={{
                                                            width: 18, height: 18, borderRadius: '50%',
                                                            background: '#22c55e', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        }}>
                                                            <Check size={10} color="#fff" strokeWidth={3} />
                                                        </Box>
                                                    )}
                                                    {item.status === 'error' && (
                                                        <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                                                    )}

                                                    {/* 소재 텍스트 */}
                                                    <Text size="sm" lineClamp={1} className="text-foreground" style={{ flex: 1, minWidth: 0 }}>
                                                        {item.material}
                                                    </Text>
                                                </Group>

                                                {/* 우측 액션 */}
                                                <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
                                                    {item.status === 'generating' && item.phase && (
                                                        <Text size="xs" c="violet" fw={500}>
                                                            {item.phase === 'analyzing' ? '분석 중' : item.phase === 'generating' ? '생성 중' : '검수 중'}
                                                        </Text>
                                                    )}
                                                    {item.status === 'done' && item.elapsed && (
                                                        <Text size="xs" c="gray.5" style={mono}>{item.elapsed}초</Text>
                                                    )}
                                                    {item.status === 'done' && (
                                                        <Text size="xs" c="violet" fw={500}>
                                                            {isActive ? '접기' : '보기'}
                                                        </Text>
                                                    )}
                                                    {item.status === 'waiting' && !isRunning && (
                                                        <ActionIcon variant="subtle" color="red" size="sm"
                                                            onClick={(e) => { e.stopPropagation(); removeFromQueue(item.id); }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </ActionIcon>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Card>
                )}

                {/* ──── 생성 중: 에이전트 진행 표시 ──── */}
                {generatingItem && generatingItem.phase && (
                    <AgentProgressMini phase={generatingItem.phase} />
                )}

                {/* ──── 결과 뷰어 (탭형) ──── */}
                {selectedItem && selectedItem.status === 'done' && (
                    <ScriptResultViewer item={selectedItem} />
                )}

                {/* ──── 전체 완료 배너 ──── */}
                {queue.length > 0 && !isRunning && waitingCount === 0 && doneCount > 0 && !selectedResult && (
                    <Card
                        padding="xl"
                        radius="lg"
                        style={{
                            background: 'rgba(34, 197, 94, 0.04)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                        }}
                    >
                        <Stack align="center" gap="md">
                            <Box style={{
                                width: 48, height: 48, borderRadius: '50%',
                                background: '#22c55e', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Check size={24} color="#fff" strokeWidth={3} />
                            </Box>
                            <Stack gap={4} align="center">
                                <Text fw={700} size="lg" className="text-foreground">
                                    {doneCount}건 생성 완료!
                                </Text>
                                <Text size="sm" c="gray.6">
                                    자동 저장되었습니다. 큐에서 결과를 확인하거나 보관함에서 볼 수 있습니다.
                                </Text>
                            </Stack>
                            <Group gap="sm">
                                <Button
                                    component={Link}
                                    href="/dashboard/archive"
                                    variant="light"
                                    color="violet"
                                    radius="lg"
                                    leftSection={<FolderOpen size={16} />}
                                >
                                    보관함에서 보기
                                </Button>
                                <Button
                                    variant="subtle"
                                    color="gray"
                                    radius="lg"
                                    onClick={() => {
                                        setQueue([]);
                                        setSelectedResult(null);
                                    }}
                                >
                                    새로 만들기
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                )}

                {/* ──── 빈 상태 ──── */}
                {queue.length === 0 && (
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack align="center" gap="md" py="xl">
                            <Box style={{
                                width: 64, height: 64, borderRadius: '50%',
                                background: 'rgba(139, 92, 246, 0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <ListOrdered size={28} color="#8b5cf6" />
                            </Box>
                            <Stack gap={4} align="center">
                                <Text fw={600} className="text-foreground">아직 큐가 비어있습니다</Text>
                                <Text size="sm" c="gray.5">
                                    위에서 소재를 입력하고 &quot;큐에 추가&quot; 버튼을 눌러주세요
                                </Text>
                            </Stack>
                        </Stack>
                    </Card>
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
