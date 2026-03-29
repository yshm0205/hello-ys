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
    vdoCipherId?: string;
}

interface Chapter {
    id: string;
    title: string;
    hasPracticeCta?: boolean;
    vods: Vod[];
}

const CHAPTERS: Chapter[] = [
    {
        id: 'ch0',
        title: 'Part 0. 소개',
        vods: [
            { id: 'vod_01', title: '강의 소개', duration: 8 },
        ],
    },
    {
        id: 'ch1',
        title: 'Part 1. 채널 기획',
        vods: [
            { id: 'vod_02', title: '유튜브 쇼츠의 이해', duration: 12, vdoCipherId: 'c478d967ac36483ead7203ea414468dc' },
            { id: 'vod_03', title: '채널 기획의 기본', duration: 15, vdoCipherId: '21e19db2a4494c2a90010683607bfc39' },
            { id: 'vod_04', title: '니치 선택하기', duration: 12, vdoCipherId: 'd8f85c93013949bb888ff8cc3a9ec32b' },
            { id: 'vod_05', title: '경쟁 채널 분석', duration: 18, vdoCipherId: 'a91251514a354df3a74e1bfcb738f048' },
        ],
    },
    {
        id: 'ch2',
        title: 'Part 2. 영상 주제 선정 & 분석',
        vods: [
            { id: 'vod_06', title: '주제 선정의 원칙', duration: 15 },
            { id: 'vod_07', title: '레퍼런스 찾기', duration: 12 },
            { id: 'vod_08', title: '조회수 분석법', duration: 18 },
            { id: 'vod_09', title: '트렌드 활용하기', duration: 14 },
            { id: 'vod_10', title: '소재 수집 루틴', duration: 12 },
            { id: 'vod_11', title: '주제 선정 실습', duration: 20 },
        ],
    },
    {
        id: 'ch3',
        title: 'Part 3. 후킹 & 대본 작성',
        hasPracticeCta: true,
        vods: [
            { id: 'vod_12', title: '후킹의 기본 원리', duration: 15 },
            { id: 'vod_13', title: '6 Power Words', duration: 18 },
            { id: 'vod_14', title: 'Contrast & Gap', duration: 16 },
            { id: 'vod_15', title: '대본 구조 설계', duration: 18 },
            { id: 'vod_16', title: '톤 & 말투 설정', duration: 14 },
            { id: 'vod_17', title: '리라이팅 & 점검', duration: 20 },
        ],
    },
    {
        id: 'ch4',
        title: 'Part 4. 영상 소스 & AI 비주얼',
        vods: [
            { id: 'vod_18', title: '소스의 역할', duration: 10 },
            { id: 'vod_19', title: '소스 검색 전략', duration: 15 },
            { id: 'vod_20', title: '소스 검색 프롬프트', duration: 12 },
            { id: 'vod_21', title: 'AI 사진 생성', duration: 18 },
            { id: 'vod_22', title: 'AI 영상 생성', duration: 20 },
            { id: 'vod_23', title: 'AI 비주얼 심화', duration: 22 },
            { id: 'vod_24', title: 'AI 영상 감독 실습', duration: 25 },
        ],
    },
    {
        id: 'ch5',
        title: 'Part 5. 편집 실전',
        vods: [
            { id: 'vod_25', title: '편집 기본 원칙', duration: 15 },
            { id: 'vod_26', title: '편집 워크플로우', duration: 20 },
            { id: 'vod_27', title: '자막 작업', duration: 18 },
            { id: 'vod_28', title: '효과음 & BGM', duration: 15 },
            { id: 'vod_29', title: '후킹 이미지 & 템플릿', duration: 16 },
            { id: 'vod_30', title: 'VREW 에이전트 편집', duration: 25 },
        ],
    },
];

// 전체 VOD 수 (상수)
const TOTAL_VODS = CHAPTERS.reduce((sum, ch) => sum + ch.vods.length, 0);

// ─── 컴포넌트 ───────────────────────────────────────────
export function LecturesContent() {
    const [completedVods, setCompletedVods] = useState<string[]>([]);
    const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
        ch0: true,
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
                                                const isReady = !!vod.vdoCipherId;
                                                const rowContent = (
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
                                                                    color={isReady ? '#d1d5db' : '#e5e7eb'}
                                                                />
                                                            )}
                                                            <Text
                                                                size="sm"
                                                                c={isDone ? 'gray.6' : isReady ? 'gray.8' : 'gray.4'}
                                                                fw={isDone ? 400 : 500}
                                                            >
                                                                {vod.title}
                                                            </Text>
                                                        </Group>
                                                        <Group gap="xs">
                                                            {!isReady ? (
                                                                <Badge variant="light" color="gray" size="xs">
                                                                    준비 중
                                                                </Badge>
                                                            ) : (
                                                                <>
                                                                    <Clock size={14} color="#9ca3af" />
                                                                    <Text size="xs" c="gray.5">
                                                                        {vod.duration}분
                                                                    </Text>
                                                                </>
                                                            )}
                                                        </Group>
                                                    </Group>
                                                );
                                                return isReady ? (
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
                                                        {rowContent}
                                                    </UnstyledButton>
                                                ) : (
                                                    <Box
                                                        key={vod.id}
                                                        p="sm"
                                                        pl="xl"
                                                        style={{
                                                            borderTop: '1px solid #f3f4f6',
                                                            opacity: 0.45,
                                                            cursor: 'default',
                                                        }}
                                                    >
                                                        {rowContent}
                                                    </Box>
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
