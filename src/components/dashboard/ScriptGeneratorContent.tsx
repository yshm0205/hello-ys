'use client';

/**
 * 스크립트 생성 콘텐츠 컴포넌트
 * 2단계 플로우: 훅 선택 → 풀스크립트 표시
 * 로봇 에이전트 진행 표시
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
} from 'lucide-react';

// 아키타입 한글 이름 매핑
const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '겉보기 vs 실제',
    'EXTREME_METRIC_VARIANT': '극단 수치형',
    'TOOL_FORCE': '도구 위력형',
    'PHENOMENON_SITE': '현상 현장형',
    'HIDDEN_SCENE_DAILY': '숨겨진 장면형',
    'UNKNOWN': '기타',
};

// 로봇 에이전트 데이터
const AGENT_TEAM = [
    {
        name: '패턴 분석가',
        role: 'Pattern Analyzer',
        image: '/images/robot-analyzer.png',
        color: '#8b5cf6',
        desc: '200개 바이럴 영상의 훅 패턴을 분석합니다',
        icon: Search,
        icon3D: '/images/icons/icon-search.png',
    },
    {
        name: '스크립트 작가',
        role: 'Script Writer',
        image: '/images/robot-hero.png',
        color: '#8b5cf6',
        desc: '분석된 패턴으로 3개의 훅을 생성합니다',
        icon: Pen,
        icon3D: '/images/icons/icon-pen.png',
    },
    {
        name: '품질 검수자',
        role: 'Quality Checker',
        image: '/images/robot-working.png',
        color: '#22c55e',
        desc: '알고리즘 최적화 및 품질을 검증합니다',
        icon: ShieldCheck,
        icon3D: '/images/icons/icon-shield.png',
    },
];

// 1단계: 훅 옵션
interface HookOption {
    index: number;
    hook_text: string;
    archetype: string;
    template_id: string;
}

// 1단계 API 응답
interface HooksResult {
    success: boolean;
    hooks: HookOption[];
    topic: string;
    key_facts: string[];
    error?: string;
}

// 2단계: 생성된 스크립트
interface GeneratedScript {
    hook_preview: string;
    full_script: string;
    archetype: string;
}

// 전체 결과 (호환용)
interface GenerationResult {
    success: boolean;
    scripts: GeneratedScript[];
    token_usage?: {
        total_input: number;
        total_output: number;
    };
    error?: string;
}

// 리서치 결과
interface ResearchResult {
    success: boolean;
    research_text: string;
    sources: string[];
    error?: string;
}

type GenerationPhase = 'idle' | 'researching' | 'research_ready' | 'analyzing' | 'generating' | 'reviewing' | 'hooks_ready' | 'generating_script' | 'script_ready';

// ============ 로봇 진행 표시 컴포넌트 ============
function AgentProgressIndicator({ phase }: { phase: GenerationPhase }) {
    const getAgentStatus = (index: number): 'waiting' | 'active' | 'done' => {
        if (phase === 'idle' || phase === 'hooks_ready' || phase === 'script_ready') {
            if (phase === 'hooks_ready' || phase === 'script_ready') return 'done';
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
                background: 'rgba(139, 92, 246, 0.05)',
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
                </Group>

                <Group justify="center" align="flex-start" gap="xl">
                    {AGENT_TEAM.map((agent, index) => {
                        const status = getAgentStatus(index);

                        return (
                            <Box key={agent.role} style={{ position: 'relative' }}>
                                <Stack align="center" gap="md" style={{ width: 160 }}>
                                    {/* 상태 표시 원 */}
                                    <Box
                                        style={{
                                            position: 'relative',
                                            width: 100,
                                            height: 100,
                                        }}
                                    >
                                        {/* 글로우/링 효과 */}
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
                                        {/* 로봇 이미지 */}
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
                                        {/* 완료 체크 */}
                                        {status === 'done' && (
                                            <Box
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    right: 0,
                                                    width: 28,
                                                    height: 28,
                                                    borderRadius: '50%',
                                                    background: '#22c55e',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)',
                                                }}
                                            >
                                                <Check size={16} color="#fff" strokeWidth={3} />
                                            </Box>
                                        )}
                                    </Box>

                                    {/* 에이전트 정보 */}
                                    <Stack align="center" gap={4}>
                                        <Group gap={6}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={agent.icon3D}
                                                alt=""
                                                width={20}
                                                height={20}
                                                style={{ objectFit: 'contain' }}
                                            />
                                            <Text
                                                fw={600}
                                                size="sm"
                                                style={{
                                                    color: status === 'active' ? agent.color : status === 'done' ? '#374151' : '#9ca3af',
                                                }}
                                            >
                                                {agent.name}
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" ta="center" style={{ lineHeight: 1.4 }}>
                                            {status === 'active' ? agent.desc : status === 'done' ? '완료!' : '대기 중'}
                                        </Text>
                                    </Stack>
                                </Stack>

                                {/* 연결 화살표 */}
                                {index < 2 && (
                                    <Box
                                        style={{
                                            position: 'absolute',
                                            top: 50,
                                            right: -32,
                                            transform: 'translateY(-50%)',
                                        }}
                                    >
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

                {/* 단계 설명 */}
                <Text ta="center" size="sm" c="gray.5">
                    {phase === 'analyzing' && '참고 스크립트에서 바이럴 패턴을 분석하는 중...'}
                    {phase === 'generating' && '훅 3개를 생성하는 중...'}
                    {phase === 'reviewing' && '품질 검증 및 최적화 중...'}
                    {(phase === 'hooks_ready' || phase === 'script_ready') && '완료! 아래에서 결과를 확인하세요'}
                </Text>
            </Stack>

            {/* 펄스 애니메이션 CSS */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            `}</style>
        </Box>
    );
}

// ============ 훅 선택 카드 컴포넌트 ============
function HookSelectionCards({
    scripts,
    selectedIndex,
    onSelect,
}: {
    scripts: GeneratedScript[];
    selectedIndex: number | null;
    onSelect: (index: number) => void;
}) {
    return (
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
                {scripts.map((script, index) => (
                    <Card
                        key={index}
                        padding="lg"
                        radius="lg"
                        onClick={() => onSelect(index)}
                        style={{
                            cursor: 'pointer',
                            border: selectedIndex === index
                                ? '2px solid #8b5cf6'
                                : '2px solid #e5e7eb',
                            background: selectedIndex === index
                                ? 'rgba(139, 92, 246, 0.05)'
                                : '#fff',
                            transition: 'all 0.2s ease',
                            boxShadow: selectedIndex === index
                                ? '0 8px 25px rgba(139, 92, 246, 0.2)'
                                : '0 2px 8px rgba(0,0,0,0.05)',
                        }}
                        onMouseEnter={(e) => {
                            if (selectedIndex !== index) {
                                e.currentTarget.style.borderColor = '#a78bfa';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedIndex !== index) {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <Stack gap="md">
                            <Group justify="space-between">
                                <Badge
                                    variant="light"
                                    color="violet"
                                    size="sm"
                                >
                                    옵션 {index + 1}
                                </Badge>
                                <Badge variant="outline" color="gray" size="sm">
                                    {ARCHETYPE_NAMES[script.archetype] || script.archetype}
                                </Badge>
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
                                "{script.hook_preview}"
                            </Text>

                            {selectedIndex === index && (
                                <Group gap={6} justify="center">
                                    <Check size={16} color="#8b5cf6" />
                                    <Text size="sm" fw={600} c="violet">
                                        선택됨
                                    </Text>
                                </Group>
                            )}
                        </Stack>
                    </Card>
                ))}
            </Group>

            {selectedIndex !== null && (
                <Text ta="center" size="sm" c="gray.5">
                    아래로 스크롤하여 전체 스크립트를 확인하세요 ⬇️
                </Text>
            )}
        </Stack>
    );
}

interface ScriptGeneratorContentProps {
    user?: { email?: string };
}

// ============ 메인 컴포넌트 ============
export function ScriptGeneratorContent({ user }: ScriptGeneratorContentProps) {
    const [inputScript, setInputScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isResearching, setIsResearching] = useState(false);  // 리서치 중
    const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);  // 리서치 결과
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [hooksResult, setHooksResult] = useState<HooksResult | null>(null);  // 1단계 결과
    const [error, setError] = useState<string | null>(null);
    const [phase, setPhase] = useState<GenerationPhase>('idle');
    const [selectedHookIndex, setSelectedHookIndex] = useState<number | null>(null);
    const [selectedHookText, setSelectedHookText] = useState<string>('');  // 원래 선택한 훅 텍스트 저장
    const [editedScript, setEditedScript] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<string | null>('default');

    // 자동 스크롤을 위한 ref
    const progressRef = useRef<HTMLDivElement>(null);
    const hookSelectionRef = useRef<HTMLDivElement>(null);
    const scriptResultRef = useRef<HTMLDivElement>(null);

    // 진행 단계 시뮬레이션
    useEffect(() => {
        if (!isGenerating) return;

        const timers: NodeJS.Timeout[] = [];

        // 분석 단계
        setPhase('analyzing');

        // 3초 후 생성 단계
        timers.push(setTimeout(() => setPhase('generating'), 3000));

        // 6초 후 검토 단계
        timers.push(setTimeout(() => setPhase('reviewing'), 6000));

        return () => timers.forEach(clearTimeout);
    }, [isGenerating]);

    // 자동 스크롤 효과
    useEffect(() => {
        if (isGenerating && progressRef.current) {
            progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [isGenerating]);

    useEffect(() => {
        if (phase === 'hooks_ready' && hookSelectionRef.current) {
            setTimeout(() => {
                hookSelectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [phase]);

    useEffect(() => {
        if (selectedHookIndex !== null && scriptResultRef.current) {
            setTimeout(() => {
                scriptResultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 500);
        }
    }, [selectedHookIndex]);


    const RENDER_API_URL = 'https://script-generator-api-civ5.onrender.com';

    // 인증 헬퍼
    const getAuthHeaders = async (): Promise<Record<string, string>> => {
        try {
            const { createClient } = await import('@/utils/supabase/client');
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                return {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                };
            }
        } catch { /* fallback */ }
        return { 'Content-Type': 'application/json' };
    };

    // 0단계: 리서치 수행
    const handleResearch = async () => {
        if (!inputScript.trim() || inputScript.length < 10) {
            setError('주제를 10자 이상 입력해주세요.');
            return;
        }

        setIsResearching(true);
        setError(null);
        setPhase('researching');
        setResearchResult(null);
        setHooksResult(null);
        setResult(null);
        setSelectedHookIndex(null);

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${RENDER_API_URL}/api/research`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    topic: inputScript,
                    user_id: user?.email || 'guest',
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '리서치에 실패했습니다.');
            }

            setResearchResult(data);
            setPhase('research_ready');
        } catch (err) {
            setError(err instanceof Error ? err.message : '리서치에 실패했습니다.');
            setPhase('idle');
        } finally {
            setIsResearching(false);
        }
    };

    // 1단계: 훅 3개 생성 (리서치 결과 포함)
    const handleGenerate = async () => {
        if (!inputScript.trim() || inputScript.length < 10) {
            setError('주제를 10자 이상 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setHooksResult(null);
        setSelectedHookIndex(null);
        setEditedScript('');

        try {
            const headers = await getAuthHeaders();
            const response = await fetch(`${RENDER_API_URL}/api/generate-hooks`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    reference_script: inputScript,
                    user_id: user?.email || 'guest',
                    research_result: researchResult?.research_text || null,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '훅 생성에 실패했습니다.');
            }

            setHooksResult(data);
            // 훅을 GeneratedScript 형식으로 변환 (full_script는 아직 없음)
            setResult({
                success: true,
                scripts: data.hooks.map((hook: HookOption) => ({
                    hook_preview: hook.hook_text.length > 100 ? hook.hook_text.slice(0, 97) + '...' : hook.hook_text,
                    full_script: '',  // 아직 생성 안됨
                    archetype: hook.archetype,
                })),
            });
            setPhase('hooks_ready');
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
            setPhase('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    // 2단계: 선택한 훅으로 전체 스크립트 생성
    const handleHookSelect = async (index: number) => {
        if (!hooksResult || !hooksResult.hooks[index]) return;

        setSelectedHookIndex(index);
        setPhase('generating_script');
        setError(null);

        try {
            const selectedHook = hooksResult.hooks[index];

            // 원래 선택한 훅 텍스트 저장 (나중에 화면에 표시용)
            setSelectedHookText(selectedHook.hook_text);

            const headers = await getAuthHeaders();
            const response = await fetch(`${RENDER_API_URL}/api/generate-full-script`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    selected_hook: selectedHook.hook_text,
                    topic: hooksResult.topic,
                    reference_script: inputScript,
                    archetype: selectedHook.archetype,
                    user_id: user?.email || 'guest',
                    research_result: researchResult?.research_text || null,  // 리서치 결과 추가
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '스크립트 생성에 실패했습니다.');
            }

            // 결과 업데이트
            if (data.script) {
                setEditedScript(data.script.full_script);
                // result 업데이트
                setResult(prev => {
                    if (!prev) return prev;
                    const newScripts = [...prev.scripts];
                    newScripts[index] = data.script;
                    return { ...prev, scripts: newScripts };
                });
            }
            setPhase('script_ready');
        } catch (err) {
            setError(err instanceof Error ? err.message : '스크립트 생성에 실패했습니다.');
            setPhase('hooks_ready');  // 훅 선택 화면으로 돌아가기
        }
    };

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleSave = async () => {
        if (!editedScript || !result?.scripts) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const selectedScript = selectedHookIndex !== null ? result.scripts[selectedHookIndex] : null;

            const response = await fetch('/api/scripts/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input_text: inputScript,
                    selected_script: selectedScript ? {
                        ...selectedScript,
                        full_script: editedScript,
                    } : null,
                    scripts: result.scripts,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || '저장에 실패했습니다.');
            }

            setSaveMessage({ type: 'success', text: '스크립트가 저장되었습니다!' });
        } catch (err) {
            setSaveMessage({
                type: 'error',
                text: err instanceof Error ? err.message : '저장에 실패했습니다.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setResearchResult(null);  // 리서치 결과도 초기화
        setHooksResult(null);
        setPhase('idle');
        setSelectedHookIndex(null);
        setEditedScript('');
    };

    const getArchetypeName = (archetype: string) => {
        return ARCHETYPE_NAMES[archetype] || archetype;
    };

    // 현재 스텝 계산
    const getCurrentStep = () => {
        if (phase === 'idle' || phase === 'researching' || phase === 'research_ready') return 1;
        if (phase === 'analyzing' || phase === 'generating' || phase === 'reviewing' || phase === 'hooks_ready') return 2;
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
                            <Brain size={24} color="#8b5cf6" />
                            <Title order={2} style={{ color: 'var(--mantine-color-text)', fontSize: '1.5rem' }}>
                                스크립트 에디터
                            </Title>
                        </Group>
                        <Text c="gray.6" size="sm">
                            AI 에이전트 팀이 바이럴 훅을 분석하고 최적화된 스크립트를 생성해요
                        </Text>
                    </Box>

                    {/* 스텝 인디케이터 */}
                    <Group gap="sm" justify="flex-start">
                        {/* Step 1 */}
                        <Badge
                            size="lg"
                            radius="xl"
                            variant={currentStep >= 1 ? 'filled' : 'outline'}
                            color={currentStep >= 1 ? 'violet' : 'gray'}
                            leftSection={<Check size={14} />}
                            style={{ 
                                padding: '8px 16px',
                                border: currentStep === 1 ? '2px solid #8b5cf6' : undefined,
                            }}
                        >
                            주제 입력
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 2 ? '#8b5cf6' : '#d1d5db'} />
                        
                        {/* Step 2 */}
                        <Badge
                            size="lg"
                            radius="xl"
                            variant={currentStep >= 2 ? 'filled' : 'outline'}
                            color={currentStep >= 2 ? 'violet' : 'gray'}
                            style={{ 
                                padding: '8px 16px',
                                border: currentStep === 2 ? '2px solid #8b5cf6' : undefined,
                            }}
                        >
                            2 훅 선택
                        </Badge>
                        <ArrowRight size={16} color={currentStep >= 3 ? '#8b5cf6' : '#d1d5db'} />
                        
                        {/* Step 3 */}
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
                            주제 또는 참고 스크립트 입력
                        </Title>

                        <Textarea
                            placeholder="예: 자율주행차가 출퇴근과 도시 계획을 어떻게 변화시킬지 이야기해 주세요. 더 많은 자유 시간이 우리를 어떻게 더 행복하게 만들지 다뤄주세요."
                            description="만들고 싶은 영상의 주제를 입력하세요 (최소 10자)"
                            minRows={4}
                            maxRows={8}
                            autosize
                            value={inputScript}
                            onChange={(e) => setInputScript(e.currentTarget.value)}
                            disabled={isResearching || isGenerating}
                            styles={{
                                input: {
                                    fontSize: '15px',
                                    lineHeight: 1.7,
                                },
                            }}
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
                        {researchResult && (
                            <Card
                                padding="md"
                                radius="md"
                                style={{
                                    background: 'rgba(34, 197, 94, 0.05)',
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
                                    {/* 출처 표시 - URL이 있으면 클릭 가능 배지, 없으면 웹 검색 안내 */}
                                    {researchResult.sources.length > 0 && (
                                        <Stack gap="xs" mt="sm">
                                            {researchResult.sources.some(s => s.includes('|')) ? (
                                                // URL이 있는 경우 - 클릭 가능한 출처 배지
                                                <>
                                                    <Text size="xs" c="gray.5" fw={500}>📚 출처:</Text>
                                                    <Group gap="xs" wrap="wrap">
                                                        {researchResult.sources.slice(0, 5).map((source, i) => {
                                                            const parts = source.split('|');
                                                            const title = parts[0];
                                                            const url = parts[1];
                                                            if (url) {
                                                                return (
                                                                    <Badge
                                                                        key={i}
                                                                        size="sm"
                                                                        variant="light"
                                                                        color="blue"
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={() => window.open(url, '_blank')}
                                                                    >
                                                                        🔗 {title}
                                                                    </Badge>
                                                                );
                                                            }
                                                            return null;
                                                        })}
                                                    </Group>
                                                </>
                                            ) : (
                                                // URL이 없는 경우 - 웹 검색 기반 안내
                                                <Text size="xs" c="gray.5" fw={500}>
                                                    🌐 웹 검색 기반 리서치
                                                </Text>
                                            )}
                                        </Stack>
                                    )}
                                </Stack>
                            </Card>
                        )}

                        {/* 리서치 로딩 */}
                        {isResearching && (
                            <Card padding="md" radius="md" style={{ border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                <Group gap="sm" justify="center">
                                    <Loader size="sm" color="violet" />
                                    <Text size="sm" c="gray.6">AI가 주제를 리서치하는 중...</Text>
                                </Group>
                            </Card>
                        )}

                        {/* 로봇 진행 표시 - 훅 생성 중 */}
                        {(isGenerating || phase === 'hooks_ready' || phase === 'script_ready') && (
                            <Transition mounted transition="fade" duration={400}>
                                {(styles) => (
                                    <div ref={progressRef} style={styles}>
                                        <AgentProgressIndicator phase={phase} />
                                    </div>
                                )}
                            </Transition>
                        )}

                        <Group justify="space-between" align="center">
                            <Group gap="md">
                                <Badge variant="light" color="gray">
                                    {inputScript.length}자
                                </Badge>
                                {inputScript.length >= 10 && (
                                    <Badge variant="light" color="green" leftSection={<Check size={12} />}>
                                        입력 완료
                                    </Badge>
                                )}
                                {researchResult && (
                                    <Badge variant="light" color="violet" leftSection={<Search size={12} />}>
                                        리서치 완료
                                    </Badge>
                                )}
                            </Group>

                            <Group gap="sm">
                                {/* 리서치 버튼 (첫 단계) */}
                                {!researchResult && (phase === 'idle' || phase === 'research_ready') && (
                                    <>
                                        <Button
                                            size="lg"
                                            radius="lg"
                                            onClick={handleResearch}
                                            disabled={isResearching || inputScript.length < 10}
                                            loading={isResearching}
                                            leftSection={isResearching ? undefined : <Search size={20} />}
                                            variant="filled"
                                            color="violet"
                                        >
                                            {isResearching ? '리서치 중...' : '리서치 시작'}
                                        </Button>
                                        <Button
                                            size="lg"
                                            radius="lg"
                                            onClick={handleGenerate}
                                            disabled={isGenerating || inputScript.length < 10}
                                            loading={isGenerating}
                                            leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                            variant="light"
                                            color="gray"
                                        >
                                            {isGenerating ? '훅 생성 중...' : '리서치 건너뛰기'}
                                        </Button>
                                    </>
                                )}

                                {/* 훅 생성 버튼 (리서치 후) */}
                                {researchResult && (
                                    <Button
                                        size="lg"
                                        radius="lg"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || inputScript.length < 10}
                                        loading={isGenerating}
                                        leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                        style={{
                                            background: isGenerating
                                                ? undefined
                                                : '#8b5cf6',
                                        }}
                                    >
                                        {isGenerating ? '훅 생성 중...' : '훅 생성'}
                                    </Button>
                                )}
                            </Group>
                        </Group>
                    </Stack>
                </Card>

                {/* 에러 표시 */}
                {error && (
                    <Alert
                        icon={<AlertCircle size={18} />}
                        title="오류"
                        color="red"
                        radius="lg"
                    >
                        {error}
                    </Alert>
                )}

                {/* 훅 선택 */}
                {(phase === 'hooks_ready' || phase === 'generating_script' || phase === 'script_ready') && result?.scripts && (
                    <Transition mounted transition="slide-up" duration={400}>
                        {(styles) => (
                            <div ref={hookSelectionRef} style={styles}>
                                <HookSelectionCards
                                    scripts={result.scripts}
                                    selectedIndex={selectedHookIndex}
                                    onSelect={handleHookSelect}
                                />
                            </div>
                        )}
                    </Transition>
                )}

                {/* 스크립트 생성 중 로딩 */}
                {phase === 'generating_script' && (
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack gap="lg" align="center">
                            <Group gap="sm">
                                <Loader size="sm" color="violet" />
                                <Text fw={600} style={{ color: '#374151' }}>
                                    스크립트 작가가 작업 중입니다...
                                </Text>
                            </Group>
                            <Text size="sm" c="gray.5" ta="center">
                                선택한 훅(방향)을 바탕으로 전체 스크립트를 생성하고 품질 검수를 진행합니다
                            </Text>
                            <Group justify="center" gap="xl" mt="md">
                                {AGENT_TEAM.slice(1).map((agent, index) => (
                                    <Stack key={agent.role} align="center" gap="xs">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={agent.image}
                                            alt={agent.name}
                                            width={60}
                                            height={60}
                                            style={{
                                                borderRadius: '50%',
                                                border: index === 0 ? `3px solid ${agent.color}` : '3px solid #e5e7eb',
                                                animation: index === 0 ? 'pulse 2s infinite' : 'none',
                                            }}
                                        />
                                        <Text size="xs" c={index === 0 ? 'violet' : 'gray.5'}>
                                            {agent.name}
                                        </Text>
                                    </Stack>
                                ))}
                            </Group>
                        </Stack>
                    </Card>
                )}

                {/* 선택된 스크립트 */}
                {phase === 'script_ready' && result?.scripts && selectedHookIndex !== null && (
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
                                                {getArchetypeName(result.scripts[selectedHookIndex].archetype)}
                                            </Badge>
                                        </Group>

                                        {/* 훅 강조 - 원래 선택한 훅 표시 */}
                                        <Alert
                                            icon={<Sparkles size={18} />}
                                            title="선택한 훅 (첫 문장)"
                                            color="violet"
                                            variant="light"
                                            radius="lg"
                                        >
                                            <Group justify="space-between" align="flex-start">
                                                <Text style={{ flex: 1 }}>
                                                    {selectedHookText || result.scripts[selectedHookIndex].hook_preview}
                                                </Text>
                                                <CopyButton value={selectedHookText || result.scripts[selectedHookIndex].hook_preview}>
                                                    {({ copied, copy }) => (
                                                        <Tooltip label={copied ? '복사됨!' : '복사'}>
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color={copied ? 'green' : 'gray'}
                                                                onClick={copy}
                                                            >
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
                                            styles={{
                                                input: {
                                                    lineHeight: 1.8,
                                                    fontSize: '15px',
                                                },
                                            }}
                                        />

                                        <Text size="sm" c="gray.5">
                                            📊 스크립트 길이: {editedScript.length}자
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

                                        {/* 액션 버튼들 */}
                                        <Group>
                                            <Button
                                                leftSection={isSaving ? undefined : <Save size={18} />}
                                                onClick={handleSave}
                                                loading={isSaving}
                                                disabled={isSaving}
                                                variant="filled"
                                                style={{
                                                    background: isSaving ? undefined : '#8b5cf6',
                                                }}
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
                                            <Button
                                                leftSection={<RefreshCw size={18} />}
                                                onClick={handleReset}
                                                variant="light"
                                                color="gray"
                                            >
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
                            <Box 
                                style={{ 
                                    padding: '32px 16px', 
                                    textAlign: 'center',
                                    color: '#9ca3af',
                                }}
                            >
                                <Text size="sm" c="gray.5">
                                    주제를 입력하고 훅을 생성해보세요
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
                                        <Badge 
                                            size="xs" 
                                            color="violet" 
                                            variant="light"
                                            radius="sm"
                                        >
                                            {getArchetypeName(script.archetype)}
                                        </Badge>
                                        <Text size="xs" c="gray.5">{index + 1}</Text>
                                    </Group>
                                    <Text 
                                        size="sm" 
                                        fw={500}
                                        style={{ 
                                            color: '#1f2937',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        "{script.hook_preview}"
                                    </Text>
                                    <Group gap="xs" mt="xs">
                                        <CopyButton value={script.hook_preview}>
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
                                            이 훅으로 생성
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
