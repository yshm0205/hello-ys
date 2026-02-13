'use client';

/**
 * 스크립트 V2 — 소재 입력 → 3스크립트 자동 생성 (원스텝)
 * Pipeline V3: 리서치 + 분석 + 훅 3개 + 바디+리라이팅 병렬
 */

import { useState, useEffect, useRef } from 'react';
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
    Alert,
    CopyButton,
    ActionIcon,
    Tooltip,
    Transition,
} from '@mantine/core';
import {
    Zap,
    Sparkles,
    Copy,
    Check,
    AlertCircle,
    RefreshCw,
    Save,
    Coins,
    Search,
    Pen,
    ShieldCheck,
    ArrowRight,
    Brain,
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

type Phase = 'idle' | 'generating' | 'done';

// ============ 로봇 에이전트 데이터 ============

const AGENT_STEPS = [
    {
        name: '리서치',
        icon: Search,
        image: '/images/robot-analyzer.png',
        icon3D: '/images/icons/icon-search.png',
        color: '#8b5cf6',
        desc: '웹에서 최신 정보를 수집합니다',
        atSecond: 0,
    },
    {
        name: '패턴 분석',
        icon: Brain,
        image: '/images/robot-analyzer.png',
        icon3D: '/images/icons/icon-search.png',
        color: '#3b82f6',
        desc: '소재에서 훅 코어를 추출합니다',
        atSecond: 15,
    },
    {
        name: '스크립트 작성',
        icon: Pen,
        image: '/images/robot-hero.png',
        icon3D: '/images/icons/icon-pen.png',
        color: '#ec4899',
        desc: '3개 스크립트를 병렬 생성합니다',
        atSecond: 40,
    },
    {
        name: '품질 검수',
        icon: ShieldCheck,
        image: '/images/robot-working.png',
        icon3D: '/images/icons/icon-shield.png',
        color: '#22c55e',
        desc: '말투와 흐름을 최적화합니다',
        atSecond: 70,
    },
];

// ============ 진행 표시 컴포넌트 ============

function ProgressIndicator({ elapsed }: { elapsed: number }) {
    const getStatus = (step: typeof AGENT_STEPS[0], idx: number): 'waiting' | 'active' | 'done' => {
        const nextStep = AGENT_STEPS[idx + 1];
        if (elapsed < step.atSecond) return 'waiting';
        if (nextStep && elapsed >= nextStep.atSecond) return 'done';
        return 'active';
    };

    return (
        <Box
            style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
                borderRadius: '20px',
                padding: '28px',
                border: '1px solid rgba(139, 92, 246, 0.15)',
            }}
        >
            <Stack gap="lg">
                <Group justify="center" gap="xs">
                    <Zap size={20} color="#8b5cf6" />
                    <Text fw={600} size="lg" style={{ color: '#374151' }}>
                        AI 파이프라인 작업 중
                    </Text>
                    <Badge variant="light" color="gray" size="sm">
                        {elapsed}초
                    </Badge>
                </Group>

                <Group justify="center" align="flex-start" gap="xl">
                    {AGENT_STEPS.map((step, index) => {
                        const status = getStatus(step, index);
                        return (
                            <Box key={step.name} style={{ position: 'relative' }}>
                                <Stack align="center" gap="md" style={{ width: 130 }}>
                                    <Box style={{ position: 'relative', width: 80, height: 80 }}>
                                        <Box
                                            style={{
                                                position: 'absolute',
                                                inset: -3,
                                                borderRadius: '50%',
                                                border: `3px solid ${status === 'active' ? step.color : status === 'done' ? '#22c55e' : '#e5e7eb'}`,
                                                animation: status === 'active' ? 'pulse 2s infinite' : 'none',
                                                boxShadow: status === 'active' ? `0 0 16px ${step.color}40` : 'none',
                                            }}
                                        />
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={step.image}
                                            alt={step.name}
                                            width={80}
                                            height={80}
                                            style={{
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                filter: status === 'waiting' ? 'grayscale(80%) opacity(0.4)' : 'none',
                                                transition: 'all 0.3s ease',
                                            }}
                                        />
                                        {status === 'done' && (
                                            <Box
                                                style={{
                                                    position: 'absolute', bottom: 0, right: 0,
                                                    width: 24, height: 24, borderRadius: '50%',
                                                    background: '#22c55e', display: 'flex',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 2px 8px rgba(34, 197, 94, 0.5)',
                                                }}
                                            >
                                                <Check size={14} color="#fff" strokeWidth={3} />
                                            </Box>
                                        )}
                                    </Box>
                                    <Stack align="center" gap={2}>
                                        <Group gap={4}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={step.icon3D} alt="" width={16} height={16} style={{ objectFit: 'contain' }} />
                                            <Text fw={600} size="sm" style={{
                                                color: status === 'active' ? step.color : status === 'done' ? '#374151' : '#9ca3af',
                                            }}>
                                                {step.name}
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" ta="center" style={{ lineHeight: 1.4 }}>
                                            {status === 'active' ? step.desc : status === 'done' ? '완료!' : '대기 중'}
                                        </Text>
                                    </Stack>
                                </Stack>
                                {index < AGENT_STEPS.length - 1 && (
                                    <Box style={{ position: 'absolute', top: 40, right: -24, transform: 'translateY(-50%)' }}>
                                        <ArrowRight
                                            size={20}
                                            color={status === 'done' ? '#22c55e' : '#e5e7eb'}
                                            style={{ transition: 'color 0.3s' }}
                                        />
                                    </Box>
                                )}
                            </Box>
                        );
                    })}
                </Group>
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
    const [phase, setPhase] = useState<Phase>('idle');
    const [result, setResult] = useState<V2Result | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [editedScript, setEditedScript] = useState('');
    const [elapsed, setElapsed] = useState(0);

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const progressRef = useRef<HTMLDivElement>(null);
    const scriptsRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
    const credits = isAdmin ? 9999 : 47;

    const RENDER_API_URL = 'https://script-generator-api-civ5.onrender.com';

    // 경과 타이머
    useEffect(() => {
        if (phase !== 'generating') return;
        setElapsed(0);
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);
        return () => clearInterval(timer);
    }, [phase]);

    // 자동 스크롤
    useEffect(() => {
        if (phase === 'generating' && progressRef.current) {
            progressRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [phase]);

    useEffect(() => {
        if (phase === 'done' && scriptsRef.current) {
            setTimeout(() => scriptsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
        }
    }, [phase]);

    useEffect(() => {
        if (selectedIdx !== null && editorRef.current) {
            setTimeout(() => editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 400);
        }
    }, [selectedIdx]);

    // 생성
    const handleGenerate = async () => {
        if (!material.trim() || material.length < 10) {
            setError('소재를 10자 이상 입력해주세요.');
            return;
        }

        setPhase('generating');
        setError(null);
        setResult(null);
        setSelectedIdx(null);
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
        }
    };

    // 스크립트 선택
    const handleSelect = (idx: number) => {
        setSelectedIdx(idx);
        if (result?.scripts[idx]) {
            setEditedScript(result.scripts[idx].final);
        }
        setSaveMessage(null);
    };

    // 저장
    const handleSave = async () => {
        if (!editedScript || !result) return;

        setIsSaving(true);
        setSaveMessage(null);

        try {
            const selected = selectedIdx !== null ? result.scripts[selectedIdx] : null;
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
        setSelectedIdx(null);
        setEditedScript('');
        setError(null);
        setSaveMessage(null);
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        <Group gap="sm" mb="xs">
                            <Zap size={28} color="#8b5cf6" />
                            <Title order={2} style={{ color: '#111827' }}>
                                스크립트 V2
                            </Title>
                            <Badge variant="light" color="violet" size="sm">NEW</Badge>
                        </Group>
                        <Text c="gray.6">
                            소재를 입력하면 리서치 + 분석 + 스크립트 3개를 자동으로 생성합니다
                        </Text>
                    </Box>
                    <Card padding="sm" radius="lg" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}>
                        <Group gap="xs">
                            <Text size="sm" c="white">잔액:</Text>
                            <Text fw={700} c="white">{credits}</Text>
                            <Coins size={18} color="#fbbf24" />
                        </Group>
                    </Card>
                </Group>

                {/* 입력 */}
                <Card padding="xl" radius="lg" withBorder>
                    <Stack gap="lg">
                        <Title order={4} style={{ color: '#374151' }}>
                            소재 입력
                        </Title>
                        <Textarea
                            placeholder="예: 시카고 강에 '마운틴 듀'라는 음료수를 붓으면 안 되는 이유가 있다고 합니다..."
                            description="만들고 싶은 영상의 소재를 입력하세요 (최소 10자)"
                            minRows={4}
                            maxRows={8}
                            autosize
                            value={material}
                            onChange={(e) => setMaterial(e.currentTarget.value)}
                            disabled={phase === 'generating'}
                            styles={{ input: { fontSize: '15px', lineHeight: 1.7 } }}
                        />

                        {/* 진행 표시 */}
                        {phase === 'generating' && (
                            <Transition mounted transition="fade" duration={400}>
                                {(styles) => (
                                    <div ref={progressRef} style={styles}>
                                        <ProgressIndicator elapsed={elapsed} />
                                    </div>
                                )}
                            </Transition>
                        )}

                        <Group justify="space-between" align="center">
                            <Group gap="md">
                                <Badge variant="light" color="gray">{material.length}자</Badge>
                                {material.length >= 10 && (
                                    <Badge variant="light" color="green" leftSection={<Check size={12} />}>
                                        입력 완료
                                    </Badge>
                                )}
                            </Group>
                            <Button
                                size="lg"
                                radius="lg"
                                onClick={handleGenerate}
                                disabled={phase === 'generating' || material.length < 10 || credits <= 0}
                                loading={phase === 'generating'}
                                leftSection={phase === 'generating' ? undefined : <Sparkles size={20} />}
                                style={{
                                    background: phase === 'generating' ? undefined : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                }}
                            >
                                {phase === 'generating' ? `생성 중... (${elapsed}초)` : '스크립트 생성 (1코인)'}
                            </Button>
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

                {/* 3개 스크립트 카드 */}
                {phase === 'done' && result?.scripts && (
                    <Transition mounted transition="slide-up" duration={400}>
                        {(styles) => (
                            <div ref={scriptsRef} style={styles}>
                                <Stack gap="lg">
                                    <Group justify="space-between" align="center">
                                        <Title order={4} style={{ color: '#374151' }}>
                                            생성된 스크립트 ({result.scripts.length}개)
                                        </Title>
                                        <Text size="sm" c="gray.5">
                                            마음에 드는 스크립트를 선택하세요
                                        </Text>
                                    </Group>

                                    {result.scripts.map((script, idx) => {
                                        const isSelected = selectedIdx === idx;
                                        // 첫 문장(훅) 분리
                                        const text = script.final;
                                        const splitMatch = text.match(/^(.+?[.?!])\s*/);
                                        const hookPart = splitMatch ? splitMatch[1] : script.hook;
                                        const bodyPart = splitMatch ? text.slice(splitMatch[0].length) : '';

                                        return (
                                            <Card
                                                key={idx}
                                                padding="lg"
                                                radius="lg"
                                                onClick={() => handleSelect(idx)}
                                                style={{
                                                    cursor: 'pointer',
                                                    border: isSelected ? '2px solid #8b5cf6' : '2px solid #e5e7eb',
                                                    background: isSelected ? 'rgba(139, 92, 246, 0.03)' : '#fff',
                                                    transition: 'all 0.2s ease',
                                                    boxShadow: isSelected ? '0 8px 25px rgba(139, 92, 246, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#a78bfa';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (!isSelected) {
                                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }
                                                }}
                                            >
                                                <Stack gap="sm">
                                                    <Group justify="space-between">
                                                        <Group gap="sm">
                                                            <Badge variant="light" color="violet" size="sm">
                                                                Script {idx + 1}
                                                            </Badge>
                                                            {script.template_id && (
                                                                <Badge variant="outline" color="gray" size="sm">
                                                                    {script.template_id}
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Group gap="sm">
                                                            <Text size="xs" c="gray.5">{text.length}자</Text>
                                                            {isSelected && (
                                                                <Group gap={4}>
                                                                    <Check size={14} color="#8b5cf6" />
                                                                    <Text size="xs" fw={600} c="violet">선택됨</Text>
                                                                </Group>
                                                            )}
                                                        </Group>
                                                    </Group>

                                                    {/* 훅 강조 */}
                                                    <Text fw={600} size="md" style={{ color: '#8b5cf6', lineHeight: 1.6 }}>
                                                        {hookPart}
                                                    </Text>

                                                    {/* 바디 미리보기 */}
                                                    <Text size="sm" style={{ color: '#4b5563', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                                                        {bodyPart}
                                                    </Text>
                                                </Stack>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            </div>
                        )}
                    </Transition>
                )}

                {/* 선택된 스크립트 에디터 */}
                {selectedIdx !== null && result?.scripts[selectedIdx] && (
                    <Transition mounted transition="slide-up" duration={400}>
                        {(styles) => (
                            <div ref={editorRef} style={styles}>
                                <Card padding="xl" radius="lg" withBorder>
                                    <Stack gap="lg">
                                        <Group justify="space-between">
                                            <Title order={4} style={{ color: '#374151' }}>
                                                스크립트 편집
                                            </Title>
                                            <Badge variant="light" color="violet">
                                                Script {selectedIdx + 1}
                                            </Badge>
                                        </Group>

                                        {/* 훅 표시 */}
                                        <Alert icon={<Sparkles size={18} />} title="훅 (첫 문장)" color="violet" variant="light" radius="lg">
                                            <Group justify="space-between" align="flex-start">
                                                <Text style={{ flex: 1 }}>{result.scripts[selectedIdx].hook}</Text>
                                                <CopyButton value={result.scripts[selectedIdx].hook}>
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

                                        <Textarea
                                            label="전체 스크립트 (수정 가능)"
                                            value={editedScript}
                                            onChange={(e) => setEditedScript(e.currentTarget.value)}
                                            minRows={10}
                                            maxRows={20}
                                            autosize
                                            styles={{ input: { lineHeight: 1.8, fontSize: '15px' } }}
                                        />

                                        <Text size="sm" c="gray.5">{editedScript.length}자</Text>

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
            </Stack>
        </Container>
    );
}
