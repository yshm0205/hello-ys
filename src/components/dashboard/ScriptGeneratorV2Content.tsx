'use client';

/**
 * 스크립트 V2 — 멀티스텝 플로우
 * Step 1: 소재 + 니치 → 리서치
 * Step 2: 리서치 확인 + 말투 선택 → 스크립트 생성
 * Step 3: 훅 선택 → 스크립트 편집
 */

import { useState, useEffect, useRef } from 'react';
import {
    Title,
    Text,
    Button,
    Stack,
    Card,
    Textarea,
    Group,
    Badge,
    Box,
    Alert,
    CopyButton,
    ActionIcon,
    Tooltip,
    Transition,
    Loader,
} from '@mantine/core';
import {
    Brain,
    Sparkles,
    Copy,
    Check,
    AlertCircle,
    RefreshCw,
    ArrowRight,
    Search,
    Zap,
    Clock,
} from 'lucide-react';

// ============ 타입 ============

interface ScriptItem {
    hook: string;
    template_id: string;
    draft: string;
    final: string;
}

interface HookCore {
    summary: string;
    surprise_level: number;
    gap_type: string;
}

interface V2Result {
    success: boolean;
    research_text: string;
    analysis: {
        topic: string;
        subject?: { subject_type?: string; simple_name?: string };
        hook_cores?: HookCore[];
    };
    hooks: string[];
    scripts: ScriptItem[];
    token_usage: { total_input: number; total_output: number; calls: number };
    timings: { research: number; analysis: number; hooks: number; scripts: number; total: number };
    error?: string;
}

interface ResearchResult {
    success: boolean;
    research_text: string;
    sources: string[];
    error?: string;
}

type WizardStep = 1 | 2 | 3;
type GenerationPhase = 'idle' | 'analyzing' | 'generating' | 'reviewing' | 'done';

// ============ 니치 & 말투 옵션 ============

const NICHE_OPTIONS = [
    { value: 'knowledge', label: '잡학지식', desc: '놀라운 사실, 과학 원리', image: '/images/niches/knowledge.png', enabled: true },
    { value: 'animal', label: '동물/자연', desc: '신기한 동물, 자연 현상', image: null, enabled: false },
    { value: 'history', label: '역사/문화', desc: '역사 속 놀라운 이야기', image: null, enabled: false },
];

const TONE_OPTIONS = [
    { value: 'default', emoji: '🎙️', label: '다큐 나레이션', desc: '차분한 존댓말' },
    { value: 'casual', emoji: '💬', label: '친근한 반말', desc: '~해, ~야 편한 말투' },
    { value: 'humorous', emoji: '😄', label: '유머러스', desc: '재치있는 비유와 위트' },
    { value: 'emotional', emoji: '💜', label: '감성 스토리', desc: '잔잔하고 여운 남는 톤' },
];

// ============ 로봇 에이전트 ============

const AGENT_TEAM = [
    {
        name: '리서치 분석가',
        role: 'Researcher',
        image: '/images/robot-analyzer.png',
        color: '#8b5cf6',
        desc: '패턴을 분석하고 훅을 설계합니다',
        icon3D: '/images/icons/icon-search.png',
    },
    {
        name: '스크립트 작가',
        role: 'Script Writer',
        image: '/images/robot-hero.png',
        color: '#ec4899',
        desc: '3개의 스크립트를 병렬 생성합니다',
        icon3D: '/images/icons/icon-pen.png',
    },
    {
        name: '품질 검수자',
        role: 'Quality Checker',
        image: '/images/robot-working.png',
        color: '#22c55e',
        desc: '말투와 흐름을 최적화합니다',
        icon3D: '/images/icons/icon-shield.png',
    },
];

// ============ 로봇 진행 표시 ============
function AgentProgressIndicator({ phase, elapsed }: { phase: GenerationPhase; elapsed: number }) {
    const getAgentStatus = (index: number): 'waiting' | 'active' | 'done' => {
        if (phase === 'idle' || phase === 'done') {
            return phase === 'done' ? 'done' : 'waiting';
        }
        if (phase === 'analyzing') {
            return index === 0 ? 'active' : 'waiting';
        }
        if (phase === 'generating') {
            if (index === 0) return 'done';
            return index === 1 ? 'active' : 'waiting';
        }
        if (phase === 'reviewing') {
            if (index <= 1) return 'done';
            return index === 2 ? 'active' : 'waiting';
        }
        return 'waiting';
    };

    return (
        <Box
            style={{
                background: 'rgba(139, 92, 246, 0.03)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(139, 92, 246, 0.12)',
            }}
        >
            <Stack gap="lg">
                <Group justify="center" gap="xs">
                    <Brain size={20} color="#8b5cf6" />
                    <Text fw={600} size="lg" style={{ color: '#374151' }}>
                        AI 에이전트 팀이 작업 중입니다
                    </Text>
                    <Badge variant="light" color="gray" size="sm">{elapsed}초</Badge>
                </Group>

                <Group justify="center" align="flex-start" gap="xl">
                    {AGENT_TEAM.map((agent, index) => {
                        const status = getAgentStatus(index);
                        return (
                            <Box key={agent.role} style={{ position: 'relative' }}>
                                <Stack align="center" gap="md" style={{ width: 160 }}>
                                    <Box style={{ position: 'relative', width: 100, height: 100 }}>
                                        <Box
                                            style={{
                                                position: 'absolute', inset: -4, borderRadius: '50%',
                                                border: `3px solid ${status === 'active' ? agent.color : status === 'done' ? '#22c55e' : '#e5e7eb'}`,
                                                animation: status === 'active' ? 'pulse 2s infinite' : 'none',
                                                boxShadow: status === 'active' ? `0 0 20px ${agent.color}50` : 'none',
                                            }}
                                        />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={agent.image} alt={agent.name} width={100} height={100}
                                            style={{
                                                borderRadius: '50%', objectFit: 'cover',
                                                filter: status === 'waiting' ? 'grayscale(80%) opacity(0.5)' : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                        {status === 'done' && (
                                            <Box style={{
                                                position: 'absolute', bottom: 0, right: 0,
                                                width: 28, height: 28, borderRadius: '50%',
                                                background: '#22c55e', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)',
                                            }}>
                                                <Check size={16} color="#fff" strokeWidth={3} />
                                            </Box>
                                        )}
                                    </Box>
                                    <Stack align="center" gap={4}>
                                        <Group gap={6}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={agent.icon3D} alt="" width={20} height={20} style={{ objectFit: 'contain' }} />
                                            <Text fw={600} size="sm" style={{
                                                color: status === 'active' ? agent.color : status === 'done' ? '#374151' : '#9ca3af',
                                            }}>{agent.name}</Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" ta="center" style={{ lineHeight: 1.4 }}>
                                            {status === 'active' ? agent.desc : status === 'done' ? '완료!' : '대기 중'}
                                        </Text>
                                    </Stack>
                                </Stack>
                                {index < 2 && (
                                    <Box style={{ position: 'absolute', top: 50, right: -32, transform: 'translateY(-50%)' }}>
                                        <ArrowRight size={24} color={getAgentStatus(index) === 'done' ? '#22c55e' : '#e5e7eb'} style={{ transition: 'color 0.3s' }} />
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Group>

                <Text ta="center" size="sm" c="gray.5">
                    {phase === 'analyzing' && '소재 패턴을 분석하고 훅을 설계하는 중...'}
                    {phase === 'generating' && '3개 스크립트를 병렬 생성하는 중...'}
                    {phase === 'reviewing' && '품질 검증 및 말투 최적화 중...'}
                    {phase === 'done' && '완료! 아래에서 결과를 확인하세요'}
                </Text>
            </Stack>
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            `}</style>
        </Box>
    );
}

// ============ 관리자 ============
const ADMIN_EMAILS = ['hmys0205hmys@gmail.com', 'admin@flowspot.kr'];

interface Props {
    user?: { email?: string };
}

// ============ 메인 컴포넌트 ============
export function ScriptGeneratorV2Content({ user }: Props) {
    // Step 1 state
    const [material, setMaterial] = useState('');
    const [selectedNiche, setSelectedNiche] = useState<string | null>('knowledge');

    // Step 2 state (리서치)
    const [isResearching, setIsResearching] = useState(false);
    const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
    const [selectedTone, setSelectedTone] = useState<string | null>('default');

    // Step 3 state (생성)
    const [isGenerating, setIsGenerating] = useState(false);
    const [genPhase, setGenPhase] = useState<GenerationPhase>('idle');
    const [result, setResult] = useState<V2Result | null>(null);
    const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);

    // 공통
    const [error, setError] = useState<string | null>(null);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const progressRef = useRef<HTMLDivElement>(null);
    const hookSelectionRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    const credits = isAdmin ? 9999 : 47;

    const RENDER_API_URL = 'https://script-generator-api-civ5.onrender.com';

    // 현재 위저드 스텝
    const currentStep: WizardStep = result ? 3 : (researchResult || isGenerating) ? 2 : 1;

    // 경과 타이머
    useEffect(() => {
        if (!isGenerating) return;
        setElapsed(0);
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [isGenerating]);

    // 생성 단계 시뮬레이션
    useEffect(() => {
        if (!isGenerating) return;
        const timers: NodeJS.Timeout[] = [];
        setGenPhase('analyzing');
        timers.push(setTimeout(() => setGenPhase('generating'), 15000));
        timers.push(setTimeout(() => setGenPhase('reviewing'), 50000));
        return () => timers.forEach(clearTimeout);
    }, [isGenerating]);

    // 자동 스크롤
    useEffect(() => {
        if (isGenerating && progressRef.current) {
            progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isGenerating]);

    useEffect(() => {
        if (genPhase === 'done' && hookSelectionRef.current) {
            setTimeout(() => hookSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
        }
    }, [genPhase]);


    // ====== Step 1 → 리서치 ======
    const handleResearch = async () => {
        if (!material.trim() || material.length < 10) {
            setError('소재를 10자 이상 입력해주세요.');
            return;
        }

        setIsResearching(true);
        setError(null);
        setResearchResult(null);
        setResult(null);
        setSelectedHookIndex(null);

        try {
            const response = await fetch(`${RENDER_API_URL}/api/research`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: material,
                    user_id: user?.email || 'guest',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '리서치에 실패했습니다.');
            }

            setResearchResult(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '리서치에 실패했습니다.');
        } finally {
            setIsResearching(false);
        }
    };

    // ====== Step 2 → 스크립트 생성 ======
    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        setResult(null);
        setSelectedHookIndex(null);
        setSaveMessage(null);

        try {
            const tone = selectedTone === 'default' ? '' : (selectedTone || '');

            const response = await fetch(`${RENDER_API_URL}/api/v2/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material,
                    user_id: user?.email || 'guest',
                    research_text: researchResult?.research_text || '',
                    niche: selectedNiche || '',
                    tone,
                }),
            });

            const data: V2Result = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '스크립트 생성에 실패했습니다.');
            }

            setResult(data);
            setGenPhase('done');
            // 자동 저장
            autoSave(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            setGenPhase('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    // ====== Step 1 → 리서치 건너뛰고 말투 선택으로 이동 ======
    const handleSkipResearch = () => {
        setResearchResult({
            success: true,
            research_text: '',
            sources: [],
        });
        setError(null);
    };

    // 훅 선택 (개별 스크립트 펼치기)
    const handleHookSelect = (index: number) => {
        if (!result?.scripts[index]) return;
        setSelectedHookIndex(selectedHookIndex === index ? null : index);
        setSaveMessage(null);
    };

    // 자동 저장 (생성 완료 시 호출) — resultData를 직접 받아 처리
    const autoSave = async (resultData: V2Result) => {
        try {
            const response = await fetch('/api/scripts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input_text: material,
                    niche: selectedNiche || '',
                    tone: selectedTone || '',
                    scripts: resultData.scripts.map(s => ({
                        hook_preview: s.hook,
                        full_script: s.final,
                        archetype: 'V2_PIPELINE',
                    })),
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || '저장 실패');
            setSaveMessage({ type: 'success', text: '보관함에 자동 저장되었습니다!' });
        } catch (err) {
            setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : '자동 저장 실패' });
        }
    };

    const handleReset = () => {
        setResult(null);
        setResearchResult(null);
        setGenPhase('idle');
        setSelectedHookIndex(null);
        setError(null);
        setSaveMessage(null);
    };

    return (
        <Box style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
            {/* 메인 영역 */}
            <Box style={{ flex: 1, minWidth: 0 }}>
                <Stack gap="xl">
                    {/* 헤더 */}
                    <Box>
                        <Group gap="sm" mb="xs">
                            <Zap size={24} color="#8b5cf6" />
                            <Title order={2} style={{ color: '#111827', fontSize: '1.5rem' }}>
                                스크립트 V2
                            </Title>
                            <Badge variant="light" color="violet" size="sm">NEW</Badge>
                        </Group>
                        <Text c="gray.6" size="sm">
                            소재 + 니치 → 리서치 → 말투 선택 → 스크립트 3개 자동 생성
                        </Text>
                    </Box>

                    {/* 스텝 인디케이터 */}
                    <Group gap="sm" justify="flex-start">
                        <Badge
                            size="lg" radius="xl"
                            variant={currentStep >= 1 ? 'filled' : 'outline'}
                            color={currentStep >= 1 ? 'violet' : 'gray'}
                            leftSection={currentStep > 1 ? <Check size={14} /> : undefined}
                            style={{ padding: '8px 16px', border: currentStep === 1 ? '2px solid #8b5cf6' : undefined }}
                        >
                            소재 + 니치
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 2 ? '#8b5cf6' : '#d1d5db'} />

                        <Badge
                            size="lg" radius="xl"
                            variant={currentStep >= 2 ? 'filled' : 'outline'}
                            color={currentStep >= 2 ? 'violet' : 'gray'}
                            leftSection={currentStep > 2 ? <Check size={14} /> : undefined}
                            style={{ padding: '8px 16px', border: currentStep === 2 ? '2px solid #8b5cf6' : undefined }}
                        >
                            2 리서치 + 말투
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 3 ? '#8b5cf6' : '#d1d5db'} />

                        <Badge
                            size="lg" radius="xl"
                            variant={currentStep >= 3 ? 'filled' : 'outline'}
                            color={currentStep >= 3 ? 'violet' : 'gray'}
                            style={{ padding: '8px 16px' }}
                        >
                            3 스크립트 완성
                        </Badge>
                    </Group>

                    {/* ====== Step 1: 소재 + 니치 ====== */}
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack gap="lg">
                            <Title order={4} style={{ color: '#374151' }}>
                                소재 또는 참고 스크립트 입력
                            </Title>

                            <Textarea
                                placeholder="예: 시카고 강에 '마운틴 듀'라는 음료수를 붓으면 안 되는 이유가 있다고 합니다..."
                                description="만들고 싶은 영상의 소재를 입력하세요 (최소 10자)"
                                minRows={4}
                                maxRows={8}
                                autosize
                                value={material}
                                onChange={(e) => setMaterial(e.currentTarget.value)}
                                disabled={isResearching || isGenerating}
                                styles={{ input: { fontSize: '15px', lineHeight: 1.7 } }}
                            />

                            {/* 니치 선택 - 이미지 카드 (3열, 9:13 비율) */}
                            <Box>
                                <Text fw={500} size="sm" mb="xs">채널 니치</Text>
                                <Box style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '16px',
                                }}>
                                    {NICHE_OPTIONS.map((niche) => {
                                        const isSelected = selectedNiche === niche.value;
                                        const isDisabled = !niche.enabled || isResearching || isGenerating;
                                        return (
                                            <Box
                                                key={niche.value}
                                                onClick={() => !isDisabled && setSelectedNiche(niche.value)}
                                                style={{
                                                    borderRadius: '12px',
                                                    border: isSelected ? '2px solid #8b5cf6' : niche.enabled ? '2px solid #e5e7eb' : '2px dashed #e5e7eb',
                                                    background: isSelected ? '#faf5ff' : '#fff',
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                    opacity: !niche.enabled ? 0.5 : (isResearching || isGenerating) ? 0.5 : 1,
                                                    transition: 'all 0.15s ease',
                                                    overflow: 'hidden',
                                                    boxShadow: isSelected ? '0 0 0 2px #8b5cf6' : 'none',
                                                    position: 'relative',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected && niche.enabled && !(isResearching || isGenerating)) {
                                                        e.currentTarget.style.borderColor = '#8b5cf6';
                                                        e.currentTarget.style.boxShadow = '0 0 0 1px #8b5cf6';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.boxShadow = 'none';
                                                    }
                                                }}
                                            >
                                                {/* Soon 뱃지 */}
                                                {!niche.enabled && (
                                                    <Box style={{
                                                        position: 'absolute', top: 8, right: 8, zIndex: 10,
                                                        padding: '2px 8px', borderRadius: '99px',
                                                        background: '#9ca3af', color: '#fff',
                                                        fontSize: '10px', fontWeight: 700,
                                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                                    }}>
                                                        Soon
                                                    </Box>
                                                )}
                                                {/* 선택 체크 */}
                                                {isSelected && (
                                                    <Box style={{
                                                        position: 'absolute', top: 8, right: 8, zIndex: 10,
                                                        width: 24, height: 24, borderRadius: '50%',
                                                        background: '#8b5cf6', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Check size={14} color="#fff" strokeWidth={3} />
                                                    </Box>
                                                )}
                                                {/* 이미지 영역 (9:13 비율) */}
                                                <Box style={{ aspectRatio: '9/13', width: '100%', overflow: 'hidden', background: '#f3f4f6' }}>
                                                    {niche.image ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img
                                                            src={niche.image}
                                                            alt={niche.label}
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
                                                {/* 텍스트 영역 */}
                                                <Box style={{ padding: '12px', textAlign: 'center' }}>
                                                    <Text fw={600} size="sm" style={{ color: niche.enabled ? '#1f2937' : '#9ca3af' }}>
                                                        {niche.label}
                                                    </Text>
                                                    <Text size="xs" style={{ color: niche.enabled ? '#6b7280' : '#d1d5db', marginTop: 2 }}>
                                                        {niche.enabled ? niche.desc : '준비 중'}
                                                    </Text>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            {/* 리서치 로딩 */}
                            {isResearching && (
                                <Card padding="md" radius="md" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                    <Group gap="sm" justify="center">
                                        <Loader size="sm" color="violet" />
                                        <Text size="sm" c="gray.6">AI가 주제를 리서치하는 중...</Text>
                                    </Group>
                                </Card>
                            )}

                            {/* 리서치 결과 (Step 2로 넘어갈 때 표시) */}
                            {researchResult && researchResult.research_text && (
                                <Card
                                    padding="md"
                                    radius="md"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                                        border: '1px solid rgba(34, 197, 94, 0.2)',
                                    }}
                                >
                                    <Stack gap="sm">
                                        <Group gap="xs">
                                            <Check size={18} color="#22c55e" />
                                            <Text fw={600} size="sm" style={{ color: '#22c55e' }}>
                                                리서치 완료
                                            </Text>
                                        </Group>
                                        <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                            {researchResult.research_text}
                                        </Text>
                                        {researchResult.sources.length > 0 && (
                                            <Stack gap="xs" mt="sm">
                                                {researchResult.sources.some(s => s.includes('|')) ? (
                                                    <>
                                                        <Text size="xs" c="gray.5" fw={500}>출처:</Text>
                                                        <Group gap="xs" wrap="wrap">
                                                            {researchResult.sources.slice(0, 5).map((source, i) => {
                                                                const parts = source.split('|');
                                                                const title = parts[0];
                                                                const url = parts[1];
                                                                if (url) {
                                                                    return (
                                                                        <Badge
                                                                            key={i} size="sm" variant="light" color="blue"
                                                                            style={{ cursor: 'pointer' }}
                                                                            onClick={() => window.open(url, '_blank')}
                                                                        >
                                                                            {title}
                                                                        </Badge>
                                                                    );
                                                                }
                                                                return null;
                                                            })}
                                                        </Group>
                                                    </>
                                                ) : (
                                                    <Text size="xs" c="gray.5" fw={500}>
                                                        웹 검색 기반 리서치
                                                    </Text>
                                                )}
                                            </Stack>
                                        )}
                                    </Stack>
                                </Card>
                            )}

                            {/* 말투 선택 - 카드 (리서치 완료 후 노출) */}
                            {researchResult && !result && (
                                <Box>
                                    <Text fw={500} size="sm" mb="xs">말투 설정</Text>
                                    <Box style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '10px',
                                    }}>
                                        {TONE_OPTIONS.map((tone) => {
                                            const isSelected = selectedTone === tone.value;
                                            return (
                                                <Box
                                                    key={tone.value}
                                                    onClick={() => !isGenerating && setSelectedTone(tone.value)}
                                                    style={{
                                                        padding: '16px 12px',
                                                        borderRadius: '14px',
                                                        border: isSelected ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                                        background: isSelected ? 'rgba(139, 92, 246, 0.04)' : '#fff',
                                                        cursor: isGenerating ? 'not-allowed' : 'pointer',
                                                        opacity: isGenerating ? 0.5 : 1,
                                                        transition: 'all 0.15s ease',
                                                        textAlign: 'center',
                                                        boxShadow: isSelected ? '0 0 0 1px #8b5cf6' : 'none',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (!isSelected && !isGenerating) {
                                                            e.currentTarget.style.borderColor = '#8b5cf6';
                                                            e.currentTarget.style.boxShadow = '0 0 0 1px #8b5cf6';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (!isSelected) {
                                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                                            e.currentTarget.style.boxShadow = 'none';
                                                        }
                                                    }}
                                                >
                                                    <Text size="xl" mb={4}>{tone.emoji}</Text>
                                                    <Text fw={600} size="sm" style={{ color: isSelected ? '#8b5cf6' : '#374151' }}>
                                                        {tone.label}
                                                    </Text>
                                                    <Text size="xs" c="gray.5" mt={2}>{tone.desc}</Text>
                                                </Box>
                                            );
                                        })}
                                    </Box>
                                </Box>
                            )}

                            {/* 로봇 진행 표시 (스크립트 생성 중) */}
                            {(isGenerating || genPhase === 'done') && (
                                <Transition mounted transition="fade" duration={400}>
                                    {(styles) => (
                                        <div ref={progressRef} style={styles}>
                                            <AgentProgressIndicator phase={genPhase} elapsed={elapsed} />
                                        </div>
                                    )}
                                </Transition>
                            )}

                            {/* 하단 액션 */}
                            <Group justify="space-between" align="center">
                                <Group gap="md">
                                    <Badge variant="light" color="gray">{material.length}자</Badge>
                                    {material.length >= 10 && (
                                        <Badge variant="light" color="green" leftSection={<Check size={12} />}>입력 완료</Badge>
                                    )}
                                    {researchResult && (
                                        <Badge variant="light" color="violet" leftSection={<Search size={12} />}>리서치 완료</Badge>
                                    )}
                                </Group>

                                <Group gap="sm">
                                    {/* Step 1: 리서치 시작 / 리서치 건너뛰기 */}
                                    {!researchResult && !result && (
                                        <>
                                            <Button
                                                size="lg" radius="lg"
                                                onClick={handleResearch}
                                                disabled={isResearching || isGenerating || material.length < 10}
                                                loading={isResearching}
                                                leftSection={isResearching ? undefined : <Search size={20} />}
                                                color="violet"
                                            >
                                                {isResearching ? '리서치 중...' : '리서치 시작'}
                                            </Button>
                                            <Button
                                                size="lg" radius="lg"
                                                onClick={handleSkipResearch}
                                                disabled={isGenerating || material.length < 10 || credits <= 0}
                                                loading={isGenerating}
                                                leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                                variant="light" color="gray"
                                            >
                                                {isGenerating ? `생성 중... (${elapsed}초)` : '리서치 건너뛰기'}
                                            </Button>
                                        </>
                                    )}

                                    {/* Step 2: 스크립트 생성 (리서치 완료 후) */}
                                    {researchResult && !result && (
                                        <Button
                                            size="lg" radius="lg"
                                            onClick={handleGenerate}
                                            disabled={isGenerating || credits <= 0}
                                            loading={isGenerating}
                                            leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                            color="violet"
                                        >
                                            {isGenerating ? `생성 중... (${elapsed}초)` : '스크립트 생성 (1코인)'}
                                        </Button>
                                    )}
                                </Group>
                            </Group>
                        </Stack>
                    </Card>

                    {/* 에러 */}
                    {error && (
                        <Alert icon={<AlertCircle size={18} />} title="오류" color="red" radius="lg">
                            {error}
                        </Alert>
                    )}

                    {/* 분석 결과 + 타이밍 */}
                    {result && (
                        <Card padding="md" radius="lg" style={{ border: '1px solid #e5e7eb' }}>
                            <Group justify="space-between" wrap="wrap">
                                <Group gap="lg">
                                    <Group gap="xs">
                                        <Text size="sm" c="gray.5">주제</Text>
                                        <Text size="sm" fw={600}>{result.analysis.topic}</Text>
                                    </Group>
                                    {result.analysis.subject?.subject_type && (
                                        <Badge variant="light" color="violet" size="sm">
                                            {result.analysis.subject.subject_type}
                                        </Badge>
                                    )}
                                    <Badge variant="light" color="green" size="sm" leftSection={<Zap size={10} />}>
                                        {result.token_usage.calls}회 LLM
                                    </Badge>
                                </Group>
                                <Badge variant="outline" color="gray" size="sm" leftSection={<Clock size={10} />}>
                                    총 {result.timings.total}초
                                </Badge>
                            </Group>
                        </Card>
                    )}

                    {/* ====== Step 3: 스크립트 결과 (3개 모두 표시) ====== */}
                    {genPhase === 'done' && result?.scripts && (
                        <Transition mounted transition="slide-up" duration={400}>
                            {(styles) => (
                                <div ref={hookSelectionRef} style={styles}>
                                    <Stack gap="lg">
                                        <Group justify="space-between" align="center">
                                            <Title order={4} style={{ color: '#374151' }}>생성된 스크립트</Title>
                                            <Group gap="sm">
                                                {saveMessage && (
                                                    <Badge
                                                        variant="light"
                                                        color={saveMessage.type === 'success' ? 'green' : 'red'}
                                                        size="lg"
                                                    >
                                                        {saveMessage.text}
                                                    </Badge>
                                                )}
                                                <Button leftSection={<RefreshCw size={16} />} onClick={handleReset} variant="light" color="gray" size="sm">
                                                    다시 시작
                                                </Button>
                                            </Group>
                                        </Group>

                                        {result.scripts.map((script, index) => (
                                            <Card
                                                key={index} padding="lg" radius="lg" withBorder
                                                style={{
                                                    border: selectedHookIndex === index ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                                                    transition: 'all 0.2s ease',
                                                }}
                                            >
                                                <Stack gap="md">
                                                    {/* 훅 헤더 */}
                                                    <Group justify="space-between" align="flex-start">
                                                        <Group gap="sm" style={{ flex: 1 }}>
                                                            <Badge variant="light" color="violet" size="sm">옵션 {index + 1}</Badge>
                                                            {script.template_id && (
                                                                <Badge variant="outline" color="gray" size="sm">{script.template_id}</Badge>
                                                            )}
                                                        </Group>
                                                        <Group gap="xs">
                                                            <CopyButton value={script.final}>
                                                                {({ copied, copy }) => (
                                                                    <Button
                                                                        size="xs" variant="light"
                                                                        color={copied ? 'green' : 'violet'}
                                                                        leftSection={copied ? <Check size={14} /> : <Copy size={14} />}
                                                                        onClick={copy}
                                                                    >
                                                                        {copied ? '복사됨!' : '전체 복사'}
                                                                    </Button>
                                                                )}
                                                            </CopyButton>
                                                            <Button
                                                                size="xs" variant="subtle" color="gray"
                                                                onClick={() => handleHookSelect(index)}
                                                            >
                                                                {selectedHookIndex === index ? '접기' : '펼치기'}
                                                            </Button>
                                                        </Group>
                                                    </Group>

                                                    {/* 훅 텍스트 */}
                                                    <Text size="md" fw={500} style={{ color: '#1f2937', lineHeight: 1.6 }}>
                                                        &ldquo;{script.hook}&rdquo;
                                                    </Text>

                                                    {/* 펼쳤을 때: 전체 스크립트 */}
                                                    {selectedHookIndex === index && (
                                                        <Box
                                                            style={{
                                                                background: '#f8f9fa',
                                                                borderRadius: '12px',
                                                                padding: '16px',
                                                                maxHeight: '400px',
                                                                overflowY: 'auto',
                                                            }}
                                                        >
                                                            <Text size="sm" style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                                                {script.final}
                                                            </Text>
                                                        </Box>
                                                    )}
                                                </Stack>
                                            </Card>
                                        ))}
                                    </Stack>
                                </div>
                            )}
                        </Transition>
                    )}

                    {/* 토큰 사용량 */}
                    {result?.token_usage && (
                        <Group justify="center">
                            <Badge variant="light" color="gray">
                                토큰 사용: {result.token_usage.total_input + result.token_usage.total_output} tokens
                            </Badge>
                        </Group>
                    )}
                </Stack>
            </Box>

            {/* 우측 훅 패널 */}
            <Box
                style={{
                    width: '320px', flexShrink: 0,
                    position: 'sticky', top: '24px', alignSelf: 'flex-start',
                    maxHeight: 'calc(100vh - 140px)', overflowY: 'auto',
                }}
            >
                <Card padding="lg" radius="lg" withBorder style={{ background: '#fefefe', border: '1px solid #e5e7eb' }}>
                    <Stack gap="md">
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Sparkles size={18} color="#8b5cf6" />
                                <Text fw={600} size="sm">생성된 훅</Text>
                            </Group>
                            {result?.scripts && (
                                <Badge size="sm" color="violet" variant="light">{result.scripts.length}</Badge>
                            )}
                        </Group>

                        {!result?.scripts && (
                            <Box style={{ padding: '32px 16px', textAlign: 'center' }}>
                                <Text size="sm" c="gray.5">소재를 입력하고 스크립트를 생성해보세요</Text>
                            </Box>
                        )}

                        {result?.scripts && result.scripts.map((script, index) => (
                            <Card
                                key={index} padding="md" radius="md"
                                onClick={() => handleHookSelect(index)}
                                style={{
                                    cursor: 'pointer',
                                    border: selectedHookIndex === index ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                                    background: selectedHookIndex === index ? 'rgba(139, 92, 246, 0.05)' : '#fff',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Badge size="xs" color="violet" variant="light" radius="sm">옵션 {index + 1}</Badge>
                                        {script.template_id && <Text size="xs" c="gray.5">{script.template_id}</Text>}
                                    </Group>
                                    <Text size="sm" fw={500} style={{ color: '#1f2937', lineHeight: 1.5 }}>
                                        &ldquo;{script.hook}&rdquo;
                                    </Text>
                                    <Group gap="xs" mt="xs">
                                        <CopyButton value={script.final}>
                                            {({ copied, copy }) => (
                                                <Button size="xs" variant="light" color={copied ? 'green' : 'gray'}
                                                    onClick={(e) => { e.stopPropagation(); copy(); }}
                                                    leftSection={copied ? <Check size={12} /> : <Copy size={12} />}
                                                >{copied ? '복사됨' : '전체 복사'}</Button>
                                            )}
                                        </CopyButton>
                                        <Button size="xs" variant={selectedHookIndex === index ? 'filled' : 'light'} color="violet"
                                            onClick={() => handleHookSelect(index)}
                                        >{selectedHookIndex === index ? '접기' : '보기'}</Button>
                                    </Group>
                                </Stack>
                            </Card>
                        ))}
                    </Stack>
                </Card>
            </Box>
        </Box>
    );
}
