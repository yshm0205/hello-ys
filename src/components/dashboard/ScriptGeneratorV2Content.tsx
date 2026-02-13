'use client';

/**
 * 스크립트 V2 — 소재 입력 → 3스크립트 자동 생성 (원스텝)
 * Pipeline V3: 리서치 + 분석 + 훅 3개 + 바디+리라이팅 병렬
 * V1 레이아웃 기반 (좌+우 패널)
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
    Select,
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
    Save,
    ArrowRight,
    Search,
    Pen,
    ShieldCheck,
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

type GenerationPhase = 'idle' | 'analyzing' | 'generating' | 'reviewing' | 'done';

// ============ 로봇 에이전트 데이터 ============

const AGENT_TEAM = [
    {
        name: '리서치 분석가',
        role: 'Researcher',
        image: '/images/robot-analyzer.png',
        color: '#8b5cf6',
        desc: '웹에서 최신 정보를 검색하고 분석합니다',
        icon: Search,
        icon3D: '/images/icons/icon-search.png',
    },
    {
        name: '스크립트 작가',
        role: 'Script Writer',
        image: '/images/robot-hero.png',
        color: '#ec4899',
        desc: '3개의 훅과 스크립트를 병렬 생성합니다',
        icon: Pen,
        icon3D: '/images/icons/icon-pen.png',
    },
    {
        name: '품질 검수자',
        role: 'Quality Checker',
        image: '/images/robot-working.png',
        color: '#22c55e',
        desc: '말투와 흐름을 최적화합니다',
        icon: ShieldCheck,
        icon3D: '/images/icons/icon-shield.png',
    },
];

// ============ 로봇 진행 표시 컴포넌트 ============
function AgentProgressIndicator({ phase, elapsed }: { phase: GenerationPhase; elapsed: number }) {
    const getAgentStatus = (index: number): 'waiting' | 'active' | 'done' => {
        if (phase === 'idle' || phase === 'done') {
            if (phase === 'done') return 'done';
            return 'waiting';
        }
        if (phase === 'analyzing') {
            if (index === 0) return 'active';
            return 'waiting';
        }
        if (phase === 'generating') {
            if (index === 0) return 'done';
            if (index === 1) return 'active';
            return 'waiting';
        }
        if (phase === 'reviewing') {
            if (index === 0 || index === 1) return 'done';
            if (index === 2) return 'active';
            return 'waiting';
        }
        return 'waiting';
    };

    return (
        <Box
            style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
                borderRadius: '20px',
                padding: '32px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
            }}
        >
            <Stack gap="lg">
                <Group justify="center" gap="xs">
                    <Brain size={20} color="#8b5cf6" />
                    <Text fw={600} size="lg" style={{ color: '#374151' }}>
                        AI 에이전트 팀이 작업 중입니다
                    </Text>
                    <Badge variant="light" color="gray" size="sm">
                        {elapsed}초
                    </Badge>
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
                                                position: 'absolute',
                                                inset: -4,
                                                borderRadius: '50%',
                                                border: `3px solid ${status === 'active' ? agent.color : status === 'done' ? '#22c55e' : '#e5e7eb'}`,
                                                animation: status === 'active' ? 'pulse 2s infinite' : 'none',
                                                boxShadow: status === 'active' ? `0 0 20px ${agent.color}50` : 'none',
                                            }}
                                        />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={agent.image}
                                            alt={agent.name}
                                            width={100}
                                            height={100}
                                            style={{
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                filter: status === 'waiting' ? 'grayscale(80%) opacity(0.5)' : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                        {status === 'done' && (
                                            <Box
                                                style={{
                                                    position: 'absolute', bottom: 0, right: 0,
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: '#22c55e', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)',
                                                }}
                                            >
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
                                            }}>
                                                {agent.name}
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" ta="center" style={{ lineHeight: 1.4 }}>
                                            {status === 'active' ? agent.desc : status === 'done' ? '완료!' : '대기 중'}
                                        </Text>
                                    </Stack>
                                </Stack>

                                {index < 2 && (
                                    <Box style={{ position: 'absolute', top: 50, right: -32, transform: 'translateY(-50%)' }}>
                                        <ArrowRight
                                            size={24}
                                            color={getAgentStatus(index) === 'done' ? '#22c55e' : '#e5e7eb'}
                                            style={{ transition: 'color 0.3s' }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Group>

                <Text ta="center" size="sm" c="gray.5">
                    {phase === 'analyzing' && '웹 리서치 + 소재 패턴을 분석하는 중...'}
                    {phase === 'generating' && '훅 3개 + 스크립트를 병렬 생성하는 중...'}
                    {phase === 'reviewing' && '품질 검증 및 최적화 중...'}
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

// ============ 관리자 이메일 ============
const ADMIN_EMAILS = [
    'hmys0205hmys@gmail.com',
    'admin@flowspot.kr',
];

interface Props {
    user?: { email?: string };
}

// ============ 메인 컴포넌트 ============
export function ScriptGeneratorV2Content({ user }: Props) {
    const [material, setMaterial] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<V2Result | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<GenerationPhase>('idle');
    const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
    const [editedScript, setEditedScript] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<string | null>('default');
    const [elapsed, setElapsed] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const progressRef = useRef<HTMLDivElement>(null);
    const hookSelectionRef = useRef<HTMLDivElement>(null);
    const scriptResultRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    const credits = isAdmin ? 9999 : 47;

    const RENDER_API_URL = 'https://script-generator-api-civ5.onrender.com';

    // 경과 타이머
    useEffect(() => {
        if (!isGenerating) return;
        setElapsed(0);
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [isGenerating]);

    // 진행 단계 시뮬레이션 (실제 API는 원스텝이지만 UI에서 단계 표시)
    useEffect(() => {
        if (!isGenerating) return;
        const timers: NodeJS.Timeout[] = [];
        setPhase('analyzing');
        timers.push(setTimeout(() => setPhase('generating'), 20000));
        timers.push(setTimeout(() => setPhase('reviewing'), 60000));
        return () => timers.forEach(clearTimeout);
    }, [isGenerating]);

    // 자동 스크롤
    useEffect(() => {
        if (isGenerating && progressRef.current) {
            progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isGenerating]);

    useEffect(() => {
        if (phase === 'done' && hookSelectionRef.current) {
            setTimeout(() => hookSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 500);
        }
    }, [phase]);

    useEffect(() => {
        if (selectedHookIndex !== null && scriptResultRef.current) {
            setTimeout(() => scriptResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
        }
    }, [selectedHookIndex]);

    // 생성
    const handleGenerate = async () => {
        if (!material.trim() || material.length < 10) {
            setError('소재를 10자 이상 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setSelectedHookIndex(null);
        setEditedScript('');
        setSaveMessage(null);

        try {
            const response = await fetch(`${RENDER_API_URL}/api/v2/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    material,
                    user_id: user?.email || 'guest',
                }),
            });

            const data: V2Result = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '스크립트 생성에 실패했습니다.');
            }

            setResult(data);
            setPhase('done');
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            setPhase('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    // 훅 선택 → 스크립트 표시
    const handleHookSelect = (index: number) => {
        if (!result?.scripts[index]) return;
        setSelectedHookIndex(index);
        setEditedScript(result.scripts[index].final);
        setSaveMessage(null);
    };

    // 저장
    const handleSave = async () => {
        if (!editedScript || !result) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const selected = selectedHookIndex !== null ? result.scripts[selectedHookIndex] : null;
            const response = await fetch('/api/scripts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input_text: material,
                    selected_script: selected ? {
                        hook_preview: selected.hook,
                        full_script: editedScript,
                        archetype: 'V2_PIPELINE',
                    } : null,
                    scripts: result.scripts.map(s => ({
                        hook_preview: s.hook,
                        full_script: s.final,
                        archetype: 'V2_PIPELINE',
                    })),
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data.error || '저장에 실패했습니다.');
            }
            setSaveMessage({ type: 'success', text: '스크립트가 저장되었습니다!' });
        } catch (err) {
            setSaveMessage({ type: 'error', text: err instanceof Error ? err.message : '저장에 실패했습니다.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setPhase('idle');
        setSelectedHookIndex(null);
        setEditedScript('');
        setError(null);
        setSaveMessage(null);
    };

    // 현재 스텝
    const getCurrentStep = () => {
        if (phase === 'idle' || phase === 'analyzing' || phase === 'generating' || phase === 'reviewing') return 1;
        if (phase === 'done' && selectedHookIndex === null) return 2;
        return 3;
    };
    const currentStep = getCurrentStep();

    return (
        <Box style={{ display: 'flex', gap: '24px', minHeight: 'calc(100vh - 120px)' }}>
            {/* 메인 컨텐츠 영역 */}
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
                            소재를 입력하면 리서치 + 분석 + 스크립트 3개를 자동으로 생성합니다
                        </Text>
                    </Box>

                    {/* 스텝 인디케이터 */}
                    <Group gap="sm" justify="flex-start">
                        <Badge
                            size="lg"
                            radius="xl"
                            variant={currentStep >= 1 ? 'filled' : 'outline'}
                            color={currentStep >= 1 ? 'violet' : 'gray'}
                            leftSection={currentStep > 1 ? <Check size={14} /> : undefined}
                            style={{
                                padding: '8px 16px',
                                border: currentStep === 1 ? '2px solid #8b5cf6' : undefined,
                            }}
                        >
                            소재 입력
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 2 ? '#8b5cf6' : '#d1d5db'} />

                        <Badge
                            size="lg"
                            radius="xl"
                            variant={currentStep >= 2 ? 'filled' : 'outline'}
                            color={currentStep >= 2 ? 'violet' : 'gray'}
                            leftSection={currentStep > 2 ? <Check size={14} /> : undefined}
                            style={{
                                padding: '8px 16px',
                                border: currentStep === 2 ? '2px solid #8b5cf6' : undefined,
                            }}
                        >
                            2 훅 선택
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 3 ? '#8b5cf6' : '#d1d5db'} />

                        <Badge
                            size="lg"
                            radius="xl"
                            variant={currentStep >= 3 ? 'filled' : 'outline'}
                            color={currentStep >= 3 ? 'violet' : 'gray'}
                            style={{ padding: '8px 16px' }}
                        >
                            3 스크립트 완성
                        </Badge>
                    </Group>

                    {/* 입력 섹션 */}
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
                                disabled={isGenerating}
                                styles={{ input: { fontSize: '15px', lineHeight: 1.7 } }}
                            />

                            {/* 스타일 선택 */}
                            <Select
                                label="스타일 설정"
                                placeholder="스타일 선택"
                                value={selectedStyle}
                                onChange={setSelectedStyle}
                                data={[
                                    { value: 'default', label: '기본 (지식 다큐)' },
                                    { value: 'emotional', label: '감성 스토리' },
                                    { value: 'tutorial', label: '튜토리얼형' },
                                ]}
                            />

                            {/* 리서치 결과 표시 */}
                            {result?.research_text && (
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
                                            {result.timings?.research && (
                                                <Badge variant="light" color="gray" size="xs">
                                                    {result.timings.research}초
                                                </Badge>
                                            )}
                                        </Group>
                                        <Text size="sm" c="gray.7" style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                                            {result.research_text}
                                        </Text>
                                        <Text size="xs" c="gray.5" fw={500}>
                                            웹 검색 기반 리서치 (Google Search Grounding)
                                        </Text>
                                    </Stack>
                                </Card>
                            )}

                            {/* 로봇 진행 표시 */}
                            {(isGenerating || phase === 'done') && (
                                <Transition mounted transition="fade" duration={400}>
                                    {(styles) => (
                                        <div ref={progressRef} style={styles}>
                                            <AgentProgressIndicator phase={phase} elapsed={elapsed} />
                                        </div>
                                    )}
                                </Transition>
                            )}

                            <Group justify="space-between" align="center">
                                <Group gap="md">
                                    <Badge variant="light" color="gray">
                                        {material.length}자
                                    </Badge>
                                    {material.length >= 10 && (
                                        <Badge variant="light" color="green" leftSection={<Check size={12} />}>
                                            입력 완료
                                        </Badge>
                                    )}
                                    {result?.research_text && (
                                        <Badge variant="light" color="violet" leftSection={<Search size={12} />}>
                                            리서치 완료
                                        </Badge>
                                    )}
                                </Group>

                                <Group gap="sm">
                                    <Button
                                        size="lg"
                                        radius="lg"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || material.length < 10 || credits <= 0}
                                        loading={isGenerating}
                                        leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                        style={{
                                            background: isGenerating
                                                ? undefined
                                                : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                        }}
                                    >
                                        {isGenerating ? `생성 중... (${elapsed}초)` : '스크립트 생성 (1코인)'}
                                    </Button>
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
                                <Group gap="xs">
                                    <Badge variant="outline" color="gray" size="sm" leftSection={<Clock size={10} />}>
                                        총 {result.timings.total}초
                                    </Badge>
                                </Group>
                            </Group>
                        </Card>
                    )}

                    {/* 훅 선택 카드 */}
                    {phase === 'done' && result?.scripts && (
                        <Transition mounted transition="slide-up" duration={400}>
                            {(styles) => (
                                <div ref={hookSelectionRef} style={styles}>
                                    <Stack gap="lg">
                                        <Group justify="space-between" align="center">
                                            <Title order={4} style={{ color: '#374151' }}>
                                                훅 선택하기
                                            </Title>
                                            <Text size="sm" c="gray.5">
                                                마음에 드는 훅을 선택하면 전체 스크립트를 확인할 수 있어요
                                            </Text>
                                        </Group>

                                        <Group grow align="stretch">
                                            {result.scripts.map((script, index) => (
                                                <Card
                                                    key={index}
                                                    padding="lg"
                                                    radius="lg"
                                                    onClick={() => handleHookSelect(index)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        border: selectedHookIndex === index
                                                            ? '2px solid #8b5cf6'
                                                            : '2px solid #e5e7eb',
                                                        background: selectedHookIndex === index
                                                            ? 'rgba(139, 92, 246, 0.05)'
                                                            : '#fff',
                                                        transition: 'all 0.2s ease',
                                                        boxShadow: selectedHookIndex === index
                                                            ? '0 8px 25px rgba(139, 92, 246, 0.2)'
                                                            : '0 2px 8px rgba(0,0,0,0.05)',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (selectedHookIndex !== index) {
                                                            e.currentTarget.style.borderColor = '#a78bfa';
                                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (selectedHookIndex !== index) {
                                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                                            e.currentTarget.style.transform = 'translateY(0)';
                                                        }
                                                    }}
                                                >
                                                    <Stack gap="md">
                                                        <Group justify="space-between">
                                                            <Badge variant="light" color="violet" size="sm">
                                                                옵션 {index + 1}
                                                            </Badge>
                                                            {script.template_id && (
                                                                <Badge variant="outline" color="gray" size="sm">
                                                                    {script.template_id}
                                                                </Badge>
                                                            )}
                                                        </Group>

                                                        <Text
                                                            size="md"
                                                            fw={500}
                                                            style={{
                                                                color: '#1f2937',
                                                                lineHeight: 1.6,
                                                                minHeight: 80,
                                                            }}
                                                        >
                                                            &ldquo;{script.hook}&rdquo;
                                                        </Text>

                                                        {selectedHookIndex === index && (
                                                            <Group gap={6} justify="center">
                                                                <Check size={16} color="#8b5cf6" />
                                                                <Text size="sm" fw={600} c="violet">선택됨</Text>
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                </Card>
                                            ))}
                                        </Group>

                                        {selectedHookIndex === null && (
                                            <Text ta="center" size="sm" c="gray.5">
                                                위 훅 중 하나를 선택하세요
                                            </Text>
                                        )}
                                    </Stack>
                                </div>
                            )}
                        </Transition>
                    )}

                    {/* 선택된 스크립트 */}
                    {phase === 'done' && result?.scripts && selectedHookIndex !== null && (
                        <Transition mounted transition="slide-up" duration={400}>
                            {(styles) => (
                                <div ref={scriptResultRef} style={styles}>
                                    <Card padding="xl" radius="lg" withBorder>
                                        <Stack gap="lg">
                                            <Group justify="space-between">
                                                <Title order={4} style={{ color: '#374151' }}>
                                                    전체 스크립트
                                                </Title>
                                                <Badge variant="light" color="violet">
                                                    옵션 {selectedHookIndex + 1}
                                                </Badge>
                                            </Group>

                                            {/* 훅 강조 */}
                                            <Alert
                                                icon={<Sparkles size={18} />}
                                                title="선택한 훅 (첫 문장)"
                                                color="violet"
                                                variant="light"
                                                radius="lg"
                                            >
                                                <Group justify="space-between" align="flex-start">
                                                    <Text style={{ flex: 1 }}>
                                                        {result.scripts[selectedHookIndex].hook}
                                                    </Text>
                                                    <CopyButton value={result.scripts[selectedHookIndex].hook}>
                                                        {({ copied, copy }) => (
                                                            <Tooltip label={copied ? '복사됨!' : '복사'}>
                                                                <ActionIcon variant="subtle" color={copied ? 'green' : 'gray'} onClick={copy}>
                                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        )}
                                                    </CopyButton>
                                                </Group>
                                            </Alert>

                                            {/* 전체 스크립트 */}
                                            <Textarea
                                                label="전체 스크립트 (수정 가능)"
                                                value={editedScript}
                                                onChange={(e) => setEditedScript(e.currentTarget.value)}
                                                minRows={12}
                                                maxRows={20}
                                                autosize
                                                styles={{ input: { lineHeight: 1.8, fontSize: '15px' } }}
                                            />

                                            <Text size="sm" c="gray.5">
                                                스크립트 길이: {editedScript.length}자
                                            </Text>

                                            {/* 저장 메시지 */}
                                            {saveMessage && (
                                                <Alert
                                                    color={saveMessage.type === 'success' ? 'green' : 'red'}
                                                    radius="md"
                                                    withCloseButton
                                                    onClose={() => setSaveMessage(null)}
                                                >
                                                    {saveMessage.text}
                                                </Alert>
                                            )}

                                            {/* 액션 버튼 */}
                                            <Group>
                                                <Button
                                                    leftSection={isSaving ? undefined : <Save size={18} />}
                                                    onClick={handleSave}
                                                    loading={isSaving}
                                                    disabled={isSaving}
                                                    variant="filled"
                                                    style={{ background: isSaving ? undefined : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
                                                >
                                                    {isSaving ? '저장 중...' : '저장하기'}
                                                </Button>
                                                <CopyButton value={editedScript}>
                                                    {({ copied, copy }) => (
                                                        <Button
                                                            leftSection={copied ? <Check size={18} /> : <Copy size={18} />}
                                                            onClick={copy}
                                                            variant="light"
                                                            color={copied ? 'green' : 'gray'}
                                                        >
                                                            {copied ? '복사됨!' : '전체 복사'}
                                                        </Button>
                                                    )}
                                                </CopyButton>
                                                <Button leftSection={<RefreshCw size={18} />} onClick={handleReset} variant="light" color="gray">
                                                    다시 시작
                                                </Button>
                                            </Group>
                                        </Stack>
                                    </Card>
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
                    width: '320px',
                    flexShrink: 0,
                    position: 'sticky',
                    top: '24px',
                    alignSelf: 'flex-start',
                    maxHeight: 'calc(100vh - 140px)',
                    overflowY: 'auto',
                }}
            >
                <Card
                    padding="lg"
                    radius="lg"
                    withBorder
                    style={{
                        background: '#fefefe',
                        border: '1px solid #e5e7eb',
                    }}
                >
                    <Stack gap="md">
                        {/* 헤더 */}
                        <Group justify="space-between" align="center">
                            <Group gap="xs">
                                <Sparkles size={18} color="#8b5cf6" />
                                <Text fw={600} size="sm">생성된 훅</Text>
                            </Group>
                            {result?.scripts && (
                                <Badge size="sm" color="violet" variant="light">
                                    {result.scripts.length}
                                </Badge>
                            )}
                        </Group>

                        {/* 훅이 없을 때 */}
                        {!result?.scripts && (
                            <Box style={{ padding: '32px 16px', textAlign: 'center', color: '#9ca3af' }}>
                                <Text size="sm" c="gray.5">
                                    소재를 입력하고 스크립트를 생성해보세요
                                </Text>
                            </Box>
                        )}

                        {/* 훅 카드들 */}
                        {result?.scripts && result.scripts.map((script, index) => (
                            <Card
                                key={index}
                                padding="md"
                                radius="md"
                                onClick={() => handleHookSelect(index)}
                                style={{
                                    cursor: 'pointer',
                                    border: selectedHookIndex === index
                                        ? '2px solid #8b5cf6'
                                        : '1px solid #e5e7eb',
                                    background: selectedHookIndex === index
                                        ? 'rgba(139, 92, 246, 0.05)'
                                        : '#fff',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <Stack gap="xs">
                                    <Group justify="space-between">
                                        <Badge size="xs" color="violet" variant="light" radius="sm">
                                            옵션 {index + 1}
                                        </Badge>
                                        {script.template_id && (
                                            <Text size="xs" c="gray.5">{script.template_id}</Text>
                                        )}
                                    </Group>
                                    <Text
                                        size="sm"
                                        fw={500}
                                        style={{ color: '#1f2937', lineHeight: 1.5 }}
                                    >
                                        &ldquo;{script.hook}&rdquo;
                                    </Text>
                                    <Group gap="xs" mt="xs">
                                        <CopyButton value={script.hook}>
                                            {({ copied, copy }) => (
                                                <Button
                                                    size="xs"
                                                    variant="light"
                                                    color="gray"
                                                    onClick={(e) => { e.stopPropagation(); copy(); }}
                                                    leftSection={copied ? <Check size={12} /> : <Copy size={12} />}
                                                >
                                                    복사
                                                </Button>
                                            )}
                                        </CopyButton>
                                        <Button
                                            size="xs"
                                            variant={selectedHookIndex === index ? 'filled' : 'light'}
                                            color="violet"
                                            onClick={() => handleHookSelect(index)}
                                        >
                                            선택
                                        </Button>
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
