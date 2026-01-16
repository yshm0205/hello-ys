'use client';

/**
 * 스크립트 생성 콘텐츠 컴포넌트
 * Streamlit 기능 반영: 아키타입 한글 이름, 수정 가능, 저장 버튼
 */

import { useState } from 'react';
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
    Tabs,
    Box,
    Alert,
    CopyButton,
    ActionIcon,
    Tooltip,
    Progress,
    Select,
} from '@mantine/core';
import {
    Brain,
    Sparkles,
    Copy,
    Check,
    AlertCircle,
    Zap,
    RefreshCw,
    Save,
    Coins,
} from 'lucide-react';

// 아키타입 한글 이름 매핑 (Streamlit에서 가져옴)
const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '겉보기 vs 실제',
    'EXTREME_METRIC_VARIANT': '극단 수치형',
    'TOOL_FORCE': '도구 위력형',
    'PHENOMENON_SITE': '현상 현장형',
    'HIDDEN_SCENE_DAILY': '숨겨진 장면형',
    'UNKNOWN': '기타',
};

interface GeneratedScript {
    hook: string;
    script: string;
    archetype: string;
}

interface GenerationResult {
    success: boolean;
    scripts: GeneratedScript[];
    token_usage?: {
        total_input: number;
        total_output: number;
    };
    error?: string;
}

export function ScriptGeneratorContent() {
    const [inputScript, setInputScript] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [editedScripts, setEditedScripts] = useState<Record<number, string>>({});
    const [selectedStyle, setSelectedStyle] = useState<string | null>('default');

    // 크레딧 (목 데이터)
    const credits = 47;

    const handleGenerate = async () => {
        if (!inputScript.trim() || inputScript.length < 50) {
            setError('참고 스크립트를 50자 이상 입력해주세요.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        setResult(null);
        setProgress(0);
        setEditedScripts({});

        // 진행 상태 시뮬레이션
        const progressInterval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 90) return prev;
                return prev + Math.random() * 15;
            });
        }, 2000);

        try {
            const response = await fetch('/api/scripts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference_script: inputScript,
                    num_scripts: 3,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '스크립트 생성에 실패했습니다.');
            }

            setProgress(100);
            setResult(data);

            // 초기 편집 상태 설정
            if (data.scripts) {
                const initial: Record<number, string> = {};
                data.scripts.forEach((s: GeneratedScript, i: number) => {
                    initial[i] = s.script;
                });
                setEditedScripts(initial);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
        } finally {
            clearInterval(progressInterval);
            setIsGenerating(false);
        }
    };

    const handleSave = (index: number) => {
        // TODO: DB에 저장
        alert(`옵션 ${index + 1} 저장 완료! (데모)`);
    };

    const getArchetypeName = (archetype: string) => {
        return ARCHETYPE_NAMES[archetype] || archetype;
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        <Group gap="sm" mb="xs">
                            <Brain size={28} color="#8b5cf6" />
                            <Title order={2} style={{ color: '#111827' }}>
                                🎬 스크립트 에디터
                            </Title>
                        </Group>
                        <Text c="gray.6">
                            영상 내용을 입력하면 AI가 3가지 버전의 스크립트를 생성해요
                        </Text>
                    </Box>

                    {/* 크레딧 표시 */}
                    <Card
                        padding="sm"
                        radius="lg"
                        style={{
                            background: '#1e293b',
                            border: '1px solid #3b82f6',
                        }}
                    >
                        <Group gap="xs">
                            <Text size="sm" c="gray.5">잔액:</Text>
                            <Text fw={700} c="blue.4">{credits}</Text>
                            <Coins size={18} color="#fbbf24" />
                        </Group>
                    </Card>
                </Group>

                {/* 2단 레이아웃 (Streamlit 스타일) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    {/* 왼쪽: 입력 */}
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack gap="lg">
                            <Title order={4}>1️⃣ 입력 (Source)</Title>

                            <Textarea
                                label="영상 내용을 입력하세요"
                                description="잘 된 영상의 스크립트나 원하는 주제 (최소 50자)"
                                placeholder="예: 일본에서는 공사 인부가 일을 끝내도 바로 돈을 못 받는다고 합니다. 작업이 제대로 됐는지 검사에서 통과해야만 돈을 받을 수 있다고 하는데요..."
                                minRows={10}
                                maxRows={15}
                                autosize
                                value={inputScript}
                                onChange={(e) => setInputScript(e.currentTarget.value)}
                                disabled={isGenerating}
                                styles={{
                                    input: {
                                        fontSize: '15px',
                                        lineHeight: 1.7,
                                    },
                                }}
                            />

                            {/* 스타일 선택 */}
                            <Select
                                label="🎨 스타일 설정"
                                placeholder="스타일 선택"
                                value={selectedStyle}
                                onChange={setSelectedStyle}
                                data={[
                                    { value: 'default', label: '기본 (지식 다큐)' },
                                    { value: 'emotional', label: '감성 스토리' },
                                    { value: 'tutorial', label: '튜토리얼형' },
                                ]}
                            />

                            <Group justify="space-between" align="center">
                                <Group gap="md">
                                    <Badge variant="light" color="gray">
                                        {inputScript.length}자
                                    </Badge>
                                    {inputScript.length >= 50 && (
                                        <Badge variant="light" color="green" leftSection={<Check size={12} />}>
                                            입력 완료
                                        </Badge>
                                    )}
                                </Group>

                                <Button
                                    size="lg"
                                    radius="lg"
                                    onClick={handleGenerate}
                                    disabled={isGenerating || inputScript.length < 50 || credits <= 0}
                                    loading={isGenerating}
                                    leftSection={isGenerating ? undefined : <Sparkles size={20} />}
                                    style={{
                                        background: isGenerating
                                            ? undefined
                                            : 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                    }}
                                >
                                    {isGenerating ? '생성 중...' : '✨ 스크립트 생성 (1코인)'}
                                </Button>
                            </Group>

                            {/* 진행 상태 */}
                            {isGenerating && (
                                <Box>
                                    <Group justify="space-between" mb="xs">
                                        <Text size="sm" c="gray.6">🧠 AI가 스크립트를 작성 중입니다...</Text>
                                        <Text size="sm" c="gray.6">{Math.round(progress)}%</Text>
                                    </Group>
                                    <Progress
                                        value={progress}
                                        size="sm"
                                        radius="xl"
                                        color="violet"
                                        animated
                                    />
                                </Box>
                            )}
                        </Stack>
                    </Card>

                    {/* 오른쪽: 결과 */}
                    <Card padding="xl" radius="lg" withBorder>
                        <Stack gap="lg">
                            <Title order={4}>2️⃣ 결과 (Output)</Title>

                            {/* 에러 */}
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

                            {/* 결과 없음 */}
                            {!result && !isGenerating && !error && (
                                <Box
                                    style={{
                                        padding: 40,
                                        textAlign: 'center',
                                        background: '#f1f5f9',
                                        borderRadius: 12,
                                    }}
                                >
                                    <Text c="gray.5">
                                        왼쪽에 내용을 입력하고 생성 버튼을 눌러주세요
                                    </Text>
                                </Box>
                            )}

                            {/* 결과 탭 */}
                            {result && result.success && result.scripts && (
                                <>
                                    <Group justify="space-between">
                                        <Group gap="sm">
                                            <Zap size={20} color="#22c55e" />
                                            <Text fw={600}>📜 생성된 스크립트 (3개)</Text>
                                        </Group>
                                        <Badge variant="light" color="green">
                                            ✅ 생성 완료! (1코인 사용됨)
                                        </Badge>
                                    </Group>

                                    <Tabs defaultValue="0" variant="pills" radius="lg">
                                        <Tabs.List mb="lg">
                                            {result.scripts.map((script, index) => (
                                                <Tabs.Tab key={index} value={String(index)}>
                                                    옵션 {index + 1}: {getArchetypeName(script.archetype)}
                                                </Tabs.Tab>
                                            ))}
                                        </Tabs.List>

                                        {result.scripts.map((script, index) => (
                                            <Tabs.Panel key={index} value={String(index)}>
                                                <Stack gap="md">
                                                    {/* 스크립트 정보 */}
                                                    <Group justify="space-between">
                                                        <Text size="sm" c="gray.6">
                                                            📊 스크립트 길이: {(editedScripts[index] || script.script).length}자
                                                        </Text>
                                                        <Badge variant="outline" color="gray">
                                                            🏷️ 스타일: {getArchetypeName(script.archetype)}
                                                        </Badge>
                                                    </Group>

                                                    {/* 훅 강조 */}
                                                    <Alert
                                                        icon={<Sparkles size={18} />}
                                                        title="🎯 훅 (첫 문장)"
                                                        color="violet"
                                                        variant="light"
                                                        radius="lg"
                                                    >
                                                        <Group justify="space-between" align="flex-start">
                                                            <Text style={{ flex: 1 }}>{script.hook}</Text>
                                                            <CopyButton value={script.hook}>
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

                                                    {/* 전체 스크립트 (수정 가능) */}
                                                    <Textarea
                                                        label="전체 스크립트 (수정 후 아래 '저장' 버튼을 누르세요)"
                                                        value={editedScripts[index] || script.script}
                                                        onChange={(e) =>
                                                            setEditedScripts((prev) => ({
                                                                ...prev,
                                                                [index]: e.currentTarget.value,
                                                            }))
                                                        }
                                                        minRows={12}
                                                        maxRows={20}
                                                        autosize
                                                        styles={{
                                                            input: {
                                                                lineHeight: 1.8,
                                                            },
                                                        }}
                                                    />

                                                    {/* 저장 & 복사 버튼 */}
                                                    <Group>
                                                        <Button
                                                            leftSection={<Save size={18} />}
                                                            onClick={() => handleSave(index)}
                                                            variant="filled"
                                                            color="blue"
                                                        >
                                                            💾 수정 내용 저장 (옵션 {index + 1})
                                                        </Button>
                                                        <CopyButton value={editedScripts[index] || script.script}>
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
                                                    </Group>
                                                </Stack>
                                            </Tabs.Panel>
                                        ))}
                                    </Tabs>

                                    {/* 다시 생성 */}
                                    <Group justify="center" mt="md">
                                        <Button
                                            variant="light"
                                            leftSection={<RefreshCw size={18} />}
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                        >
                                            다시 생성하기
                                        </Button>
                                    </Group>
                                </>
                            )}
                        </Stack>
                    </Card>
                </div>

                {/* 토큰 사용량 */}
                {result?.token_usage && (
                    <Group justify="center">
                        <Badge variant="light" color="gray">
                            토큰 사용: {result.token_usage.total_input + result.token_usage.total_output} tokens
                        </Badge>
                    </Group>
                )}
            </Stack>
        </Container>
    );
}
