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
    Paperclip,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import type { LectureCatalogChapter } from '@/lib/lectures/types';
import { ReviewEventBanner } from './ReviewEventBanner';

// ─── 강의 데이터 ───────────────────────────────────────────
interface Vod {
    id: string;
    title: string;
    duration: number; // 분
    isPlayable?: boolean;
    hasMaterials?: boolean;
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
            { id: 'vod_01', title: '소개', duration: 8 },
        ],
    },
    {
        id: 'ch1',
        title: 'Part 1. 채널 기획',
        vods: [
            { id: 'vod_02', title: '주제보다 먼저 정해야 할 한 가지', duration: 12, isPlayable: true },
            { id: 'vod_03', title: '양산형 vs 직접 촬영, 어떻게 만들 것인가?', duration: 15, isPlayable: true },
            { id: 'vod_04', title: '레드오션도 블루오션으로 바꾸는 채널 조합법', duration: 12, isPlayable: true },
            { id: 'vod_05', title: '내 취향은 빼고, 벤치마크 채널 찾는 법', duration: 18, isPlayable: true },
        ],
    },
    {
        id: 'ch2',
        title: 'Part 2. 영상 주제 선정 & 분석',
        vods: [
            { id: 'vod_06', title: '영상 주제 선정 기준 2가지', duration: 15 },
            { id: 'vod_07', title: '남들은 모르는 떡상하는 주제 찾는 방법', duration: 12 },
            { id: 'vod_08', title: '영상 주제 찾기 실전 예시 (쇼핑 채널)', duration: 18 },
            { id: 'vod_09', title: '영상 주제 찾기 실전 예시 (잡학 지식 / 공부 입시 채널)', duration: 14 },
            { id: 'vod_10', title: '영상 주제 찾기 실전 예시 (해외반응/덕질/취미 채널)', duration: 12 },
            { id: 'vod_11', title: '주제 찾는 시간을 줄여주는 실전 툴 활용법', duration: 20 },
        ],
    },
    {
        id: 'ch3',
        title: 'Part 3. 후킹 & 대본 작성',
        hasPracticeCta: true,
        vods: [
            { id: 'vod_12', title: '초반 3초를 사로잡는 후킹의 6가지 조각', duration: 15 },
            { id: 'vod_13', title: '후킹이 무너지는 4가지 패턴', duration: 18 },
            { id: 'vod_14', title: '대본 작성시 지켜야할 필수 원칙', duration: 16 },
            { id: 'vod_15', title: '영상을 끝까지 보게 만드는 본문 작성 4가지 공식', duration: 18 },
            { id: 'vod_16', title: '터진 영상을 내 것으로 만드는 방법', duration: 14 },
            { id: 'vod_17', title: '프로그램 사용법', duration: 20 },
        ],
    },
    {
        id: 'ch4',
        title: 'Part 4. 영상 소스 & AI 비주얼',
        vods: [
            { id: 'vod_18', title: '빈 화면 채우기 전에 알아야 할 소스 배치 기준', duration: 10 },
            { id: 'vod_19', title: '유튜브 쇼츠 소스 확보 전략 3가지', duration: 15 },
            { id: 'vod_20', title: '공정 사용 소스를 찾는 4가지 방법', duration: 12 },
            { id: 'vod_21', title: 'AI로 일관성 있게 사진을 뽑는 비결', duration: 18 },
            { id: 'vod_22', title: 'AI 실전 : 한 장씩 뽑기', duration: 20 },
            { id: 'vod_23', title: 'AI 실전 : 9장 한 번에 뽑기', duration: 20 },
            { id: 'vod_24', title: 'AI로 멈춰 있는 사진 소스를 움직이는 영상 소스로 만드는 방법', duration: 22 },
            { id: 'vod_25', title: 'AI 실전 : 내가 원하는 영상 소스를 만드는 실전 워크 플로우', duration: 25 },
        ],
    },
    {
        id: 'ch5',
        title: 'Part 5. 편집 실전',
        vods: [
            { id: 'vod_26', title: '영상 시청 지속 시간을 올려주는 편집 방법', duration: 15 },
            { id: 'vod_27', title: '편집 시간을 반으로 줄이는 편집 워크 플로우', duration: 20 },
            { id: 'vod_28', title: '실전 편집 A to Z : 잡학 지식형 (1)', duration: 18 },
            { id: 'vod_29', title: '실전 편집 A to Z : 잡학 지식형 (2)', duration: 15 },
            { id: 'vod_30', title: '실전 편집 A to Z : 커뮤니티형', duration: 16 },
            { id: 'vod_31', title: '실전 편집 A to Z : 썰형', duration: 25 },
        ],
    },
    {
        id: 'ch6',
        title: 'Part 6. 수익화',
        vods: [
            { id: 'vod_32', title: '쇼츠로 돈 버는 3가지 방법', duration: 15 },
            { id: 'vod_33', title: '쇼핑 채널 운영 방법 : 내 채널은 뭘 팔아야 할까?', duration: 18 },
            { id: 'vod_34', title: '쇼핑 채널 운영 방법 : 쇼핑 태그를 넘어서 나만의 제품으로', duration: 20 },
        ],
    },
    {
        id: 'ch7',
        title: 'Part 7. 자동화',
        vods: [
            { id: 'vod_35', title: '남들보다 빠르게 수익화를 달성하는 방법', duration: 15 },
            { id: 'vod_36', title: '부업을 넘어 사업으로', duration: 18 },
        ],
    },
    {
        id: 'appendix',
        title: '부록',
        vods: [
            { id: 'vod_37', title: '편집자 협업 노션 템플릿 활용 방법', duration: 12 },
            { id: 'vod_38', title: '이 달의 채널 추천 리스트 활용 방법', duration: 10 },
        ],
    },
];

// 전체 VOD 수 (상수)
const TOTAL_VODS = CHAPTERS.reduce((sum, ch) => sum + ch.vods.length, 0);

// ─── 컴포넌트 ───────────────────────────────────────────
interface LecturesContentProps {
    chapters?: LectureCatalogChapter[];
}

export function LecturesContent({ chapters }: LecturesContentProps) {
    const lectureChapters = chapters?.length ? chapters : CHAPTERS;
    const [completedVods, setCompletedVods] = useState<string[]>([]);
    const [openChapters, setOpenChapters] = useState<Record<string, boolean>>({
        [lectureChapters[0]?.id || 'ch0']: true,
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
    const totalVods = lectureChapters.reduce((sum, ch) => sum + ch.vods.length, 0);
    const progressPercent = totalVods > 0 ? Math.round((completedCount / totalVods) * 100) : 0;

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
                                <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
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
                            {completedCount}/{totalVods}강 완료
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
                <ReviewEventBanner />

                <Stack gap="md">
                    {lectureChapters.map((chapter) => {
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
                                                <Text fw={600} size="md" style={{ color: 'var(--mantine-color-text)' }}>
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
                                            {chapter.vods.map((vod) => {
                                                const isDone = completedVods.includes(vod.id);
                                                const isReady = !!vod.isPlayable;
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
                                                            {vod.hasMaterials && (
                                                                <Paperclip
                                                                    size={13}
                                                                    color="#8b5cf6"
                                                                    aria-label="수업 자료 있음"
                                                                />
                                                            )}
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
                                                        prefetch={false}
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
                                        href="/dashboard/batch"
                                        prefetch={false}
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
