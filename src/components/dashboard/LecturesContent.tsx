'use client';

/**
 * 강의실 목록 페이지 컴포넌트
 * 챕터별 아코디언 + VOD 목록 + 수강 진도
 */

import { useState, useEffect } from 'react';
import {
    Container,
    Title,
    Text,
    Card,
    Stack,
    Group,
    Box,
    Progress,
    UnstyledButton,
    Collapse,
    Loader,
    Badge,
} from '@mantine/core';
import {
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    ArrowRight,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// ─── 강의 데이터 ───────────────────────────────────────────
interface Vod {
    id: string;
    title: string;
    duration: number; // 분
}

interface Chapter {
    id: string;
    title: string;
    hasPracticeCta?: boolean;
    vods: Vod[];
}

const CHAPTERS: Chapter[] = [
    {
        id: 'ch1',
        title: 'Ch 1. 채널 기획',
        vods: [
            { id: 'vod_04', title: '채널 기획의 기본', duration: 15 },
            { id: 'vod_05', title: '니치 선택하기', duration: 12 },
            { id: 'vod_06', title: '경쟁 분석', duration: 18 },
            { id: 'vod_07', title: '실수 피하기', duration: 10 },
        ],
    },
    {
        id: 'ch2',
        title: 'Ch 2. 훅 프레임워크',
        hasPracticeCta: true,
        vods: [
            { id: 'vod_08', title: '6 Power Words', duration: 20 },
            { id: 'vod_09', title: 'Contrast의 원리', duration: 15 },
            { id: 'vod_10', title: '호기심 Gap 만들기', duration: 18 },
            { id: 'vod_11', title: '훅 공식 A', duration: 12 },
            { id: 'vod_12', title: '훅 공식 B', duration: 14 },
            { id: 'vod_13', title: '아웃라이어 분석', duration: 22 },
            { id: 'vod_14', title: 'Copy Work 실전', duration: 25 },
            { id: 'vod_15', title: '훅 실습', duration: 20 },
        ],
    },
    {
        id: 'ch3',
        title: 'Ch 3. 스크립트 작성',
        hasPracticeCta: true,
        vods: [
            { id: 'vod_16', title: '스크립트 구조 이해', duration: 15 },
            { id: 'vod_17', title: '바디 블록 설계', duration: 18 },
            { id: 'vod_18', title: '전환 기법', duration: 12 },
            { id: 'vod_19', title: '리훅 전략', duration: 14 },
            { id: 'vod_20', title: '클로징 작성법', duration: 10 },
            { id: 'vod_21', title: '톤 & 말투 설정', duration: 16 },
            { id: 'vod_22', title: '리라이팅 기법', duration: 20 },
            { id: 'vod_23', title: '실전 스크립트 A', duration: 25 },
            { id: 'vod_24', title: '실전 스크립트 B', duration: 22 },
            { id: 'vod_25', title: '스크립트 점검 체크리스트', duration: 15 },
        ],
    },
    {
        id: 'ch4',
        title: 'Ch 4. 소스 확보',
        vods: [
            { id: 'vod_26', title: '소스의 역할', duration: 10 },
            { id: 'vod_27', title: '소스 배치 원칙', duration: 15 },
            { id: 'vod_28', title: '소스 확보 전략', duration: 18 },
            { id: 'vod_30', title: '무료 소스 활용', duration: 20 },
            { id: 'vod_31', title: 'AI 이미지 생성', duration: 22 },
        ],
    },
    {
        id: 'ch5',
        title: 'Ch 5. 편집',
        vods: [
            { id: 'vod_33', title: '편집 기본 원칙', duration: 15 },
            { id: 'vod_34', title: '편집 워크플로우', duration: 25 },
            { id: 'vod_35', title: '자막 & 효과', duration: 18 },
            { id: 'vod_36', title: '최종 점검', duration: 12 },
            { id: 'vod_42', title: '편집 시연', duration: 30 },
        ],
    },
];

// 전체 VOD 수 (상수)
const TOTAL_VODS = CHAPTERS.reduce((sum, ch) => sum + ch.vods.length, 0);

// ─── 컴포넌트 ───────────────────────────────────────────
export function LecturesContent() {
    const [completedVods, setCompletedVods] = useState<string[]>([]);
    const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
        ch1: true,
    });
    const [isLoading, setIsLoading] = useState(true);

    // 수강 진도 불러오기
    useEffect(() => {
        async function fetchProgress() {
            try {
                const res = await fetch('/api/lectures/progress');
                const data = await res.json();
                if (data.success) {
                    setCompletedVods(data.completedVods || []);
                }
            } catch {
                // 에러 시 빈 배열 유지
            } finally {
                setIsLoading(false);
            }
        }
        fetchProgress();
    }, []);

    const toggleChapter = (chId: string) => {
        setOpenChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
    };

    const completedCount = completedVods.length;
    const progressPercent = TOTAL_VODS > 0 ? Math.round((completedCount / TOTAL_VODS) * 100) : 0;

    if (isLoading) {
        return (
            <Container size="md" py="xl">
                <Group justify="center" py="xl">
                    <Loader size="md" color="violet" />
                    <Text c="gray.6">강의 목록을 불러오는 중...</Text>
                </Group>
            </Container>
        );
    }

    return (
        <Container size="md" py="md">
            <Stack gap="xl">
                {/* 상단: 제목 + 진도 요약 */}
                <Box>
                    <Group justify="space-between" align="flex-end" mb="md">
                        <Box>
                            <Group gap="sm" mb={4}>
                                <BookOpen size={24} color="#8b5cf6" />
                                <Title order={2} style={{ color: '#111827' }}>
                                    강의실
                                </Title>
                            </Group>
                            <Text c="gray.6" size="sm">
                                단계별로 학습하고 FlowSpot으로 실습하세요
                            </Text>
                        </Box>
                        <Badge
                            size="lg"
                            radius="lg"
                            variant="light"
                            color="violet"
                            style={{ padding: '8px 16px' }}
                        >
                            {completedCount}/{TOTAL_VODS}강 완료
                        </Badge>
                    </Group>

                    {/* 프로그레스 바 */}
                    <Card padding="lg" radius="lg" withBorder>
                        <Group justify="space-between" mb="xs">
                            <Text size="sm" fw={500} c="gray.7">
                                전체 수강 진도
                            </Text>
                            <Text size="sm" fw={600} c="violet.6">
                                {progressPercent}%
                            </Text>
                        </Group>
                        <Progress
                            value={progressPercent}
                            color="violet"
                            size="lg"
                            radius="xl"
                        />
                    </Card>
                </Box>

                {/* 챕터별 아코디언 */}
                <Stack gap="md">
                    {CHAPTERS.map((chapter) => {
                        const chapterCompleted = chapter.vods.filter((v) =>
                            completedVods.includes(v.id)
                        ).length;
                        const isOpen = openChapters[chapter.id] || false;

                        return (
                            <Box key={chapter.id}>
                                <Card padding={0} radius="lg" withBorder>
                                    {/* 챕터 헤더 */}
                                    <UnstyledButton
                                        onClick={() => toggleChapter(chapter.id)}
                                        style={{ width: '100%' }}
                                        p="md"
                                    >
                                        <Group justify="space-between">
                                            <Group gap="sm">
                                                {isOpen ? (
                                                    <ChevronDown size={20} color="#6b7280" />
                                                ) : (
                                                    <ChevronRight size={20} color="#6b7280" />
                                                )}
                                                <Text fw={600} size="md" style={{ color: '#111827' }}>
                                                    {chapter.title}
                                                </Text>
                                                <Badge
                                                    variant="light"
                                                    color={
                                                        chapterCompleted === chapter.vods.length
                                                            ? 'green'
                                                            : 'gray'
                                                    }
                                                    size="sm"
                                                >
                                                    {chapterCompleted}/{chapter.vods.length}
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="gray.5">
                                                {chapter.vods.reduce((s, v) => s + v.duration, 0)}분
                                            </Text>
                                        </Group>
                                    </UnstyledButton>

                                    {/* VOD 목록 */}
                                    <Collapse in={isOpen}>
                                        <Stack gap={0}>
                                            {chapter.vods.map((vod, idx) => {
                                                const isDone = completedVods.includes(vod.id);
                                                return (
                                                    <UnstyledButton
                                                        key={vod.id}
                                                        component={Link}
                                                        href={`/dashboard/lectures/${vod.id}`}
                                                        style={{
                                                            display: 'block',
                                                            width: '100%',
                                                            borderTop: '1px solid #f3f4f6',
                                                            transition: 'background 0.15s',
                                                        }}
                                                        p="sm"
                                                        pl="xl"
                                                        styles={{
                                                            root: {
                                                                '&:hover': {
                                                                    background: '#faf5ff',
                                                                },
                                                            },
                                                        }}
                                                    >
                                                        <Group justify="space-between">
                                                            <Group gap="sm">
                                                                {isDone ? (
                                                                    <CheckCircle2
                                                                        size={18}
                                                                        color="#8b5cf6"
                                                                        fill="#8b5cf6"
                                                                        strokeWidth={0}
                                                                    />
                                                                ) : (
                                                                    <Circle
                                                                        size={18}
                                                                        color="#d1d5db"
                                                                    />
                                                                )}
                                                                <Text
                                                                    size="sm"
                                                                    c={isDone ? 'gray.6' : 'gray.8'}
                                                                    fw={isDone ? 400 : 500}
                                                                    td={isDone ? 'line-through' : undefined}
                                                                >
                                                                    {vod.title}
                                                                </Text>
                                                            </Group>
                                                            <Group gap="xs">
                                                                <Clock size={14} color="#9ca3af" />
                                                                <Text size="xs" c="gray.5">
                                                                    {vod.duration}분
                                                                </Text>
                                                            </Group>
                                                        </Group>
                                                    </UnstyledButton>
                                                );
                                            })}
                                        </Stack>
                                    </Collapse>
                                </Card>

                                {/* 실습 CTA 배너 */}
                                {chapter.hasPracticeCta && (
                                    <UnstyledButton
                                        component={Link}
                                        href="/dashboard/scripts-v2"
                                        style={{
                                            display: 'block',
                                            width: '100%',
                                            marginTop: 8,
                                        }}
                                    >
                                        <Card
                                            padding="md"
                                            radius="lg"
                                            style={{
                                                background: '#8b5cf6',
                                                cursor: 'pointer',
                                                transition: 'opacity 0.15s',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '0.9';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                            }}
                                        >
                                            <Group justify="space-between">
                                                <Group gap="sm">
                                                    <Text c="white" fw={600} size="sm">
                                                        FlowSpot V2로 직접 실습해보세요
                                                    </Text>
                                                </Group>
                                                <ArrowRight size={18} color="white" />
                                            </Group>
                                        </Card>
                                    </UnstyledButton>
                                )}
                            </Box>
                        );
                    })}
                </Stack>
            </Stack>
        </Container>
    );
}

// 챕터 데이터를 외부에서 사용할 수 있도록 export
export { CHAPTERS, TOTAL_VODS };
export type { Vod, Chapter };
