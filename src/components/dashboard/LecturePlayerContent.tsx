'use client';

/**
 * 강의 시청 페이지 컴포넌트
 * 왼쪽: Vimeo 플레이어 + 수강 완료 + 이전/다음
 * 오른쪽: 챕터별 강의 목록 사이드 패널
 */

import { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Title,
    Text,
    Card,
    Stack,
    Group,
    Box,
    Button,
    Badge,
    Collapse,
    UnstyledButton,
    ScrollArea,
} from '@mantine/core';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Circle,
    Clock,
    BookOpen,
    ChevronDown,
    ChevronRight,
    List,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { CHAPTERS } from './LecturesContent';

interface LecturePlayerContentProps {
    vodId: string;
}

// 모든 VOD를 순서대로 펼친 배열 생성
function getAllVods() {
    const allVods: { id: string; title: string; duration: number; chapterTitle: string; chapterId: string }[] = [];
    for (const ch of CHAPTERS) {
        for (const vod of ch.vods) {
            allVods.push({
                ...vod,
                chapterTitle: ch.title,
                chapterId: ch.id,
            });
        }
    }
    return allVods;
}

export function LecturePlayerContent({ vodId }: LecturePlayerContentProps) {
    const [completedVods, setCompletedVods] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarking, setIsMarking] = useState(false);
    const [showList, setShowList] = useState(true);

    const allVods = useMemo(() => getAllVods(), []);
    const currentIndex = allVods.findIndex((v) => v.id === vodId);
    const currentVod = currentIndex >= 0 ? allVods[currentIndex] : null;
    const prevVod = currentIndex > 0 ? allVods[currentIndex - 1] : null;
    const nextVod = currentIndex < allVods.length - 1 ? allVods[currentIndex + 1] : null;

    const isCompleted = completedVods.includes(vodId);

    // 현재 VOD가 속한 챕터는 기본 열림
    const [openChapters, setOpenChapters] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        if (currentVod) init[currentVod.chapterId] = true;
        return init;
    });

    // vodId 변경 시 해당 챕터 열기
    useEffect(() => {
        if (currentVod) {
            setOpenChapters((prev) => ({ ...prev, [currentVod.chapterId]: true }));
        }
    }, [vodId, currentVod]);

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

    // 수강 완료 처리
    const handleMarkComplete = async () => {
        if (isMarking || isCompleted) return;
        setIsMarking(true);
        try {
            const res = await fetch('/api/lectures/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vod_id: vodId }),
            });
            const data = await res.json();
            if (data.success) {
                setCompletedVods((prev) => [...prev, vodId]);
            }
        } catch {
            // 에러 무시
        } finally {
            setIsMarking(false);
        }
    };

    const toggleChapter = (chId: string) => {
        setOpenChapters((prev) => ({ ...prev, [chId]: !prev[chId] }));
    };

    // 현재 챕터에서 실습 CTA가 있는지 확인
    const currentChapter = CHAPTERS.find((ch) => ch.id === currentVod?.chapterId);
    const hasPracticeCta = currentChapter?.hasPracticeCta || false;

    if (!currentVod) {
        return (
            <Container size="md" py="xl">
                <Stack align="center" gap="md" py="xl">
                    <Text c="gray.6" size="lg">
                        강의를 찾을 수 없습니다.
                    </Text>
                    <Button
                        component={Link}
                        href="/dashboard/lectures"
                        variant="light"
                        color="violet"
                        leftSection={<ArrowLeft size={16} />}
                    >
                        강의 목록으로 돌아가기
                    </Button>
                </Stack>
            </Container>
        );
    }

    return (
        <Container size="xl" py="md">
            {/* 상단 네비 */}
            <Group justify="space-between" mb="lg">
                <Button
                    component={Link}
                    href="/dashboard/lectures"
                    variant="subtle"
                    color="gray"
                    size="sm"
                    leftSection={<ArrowLeft size={16} />}
                >
                    목록으로
                </Button>
                <Button
                    variant="subtle"
                    color="gray"
                    size="sm"
                    leftSection={<List size={16} />}
                    onClick={() => setShowList((v) => !v)}
                    hiddenFrom="md"
                >
                    {showList ? '목록 닫기' : '강의 목록'}
                </Button>
            </Group>

            {/* 2열 레이아웃 */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                {/* 왼쪽: 메인 콘텐츠 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Stack gap="lg">
                        {/* 강의 제목 */}
                        <Box>
                            <Badge variant="light" color="violet" size="sm" mb={8}>
                                {currentVod.chapterTitle}
                            </Badge>
                            <Title order={3} style={{ color: '#111827' }}>
                                {currentVod.title}
                            </Title>
                            <Group gap="sm" mt={4}>
                                <Clock size={14} color="#9ca3af" />
                                <Text size="sm" c="gray.5">
                                    {currentVod.duration}분
                                </Text>
                                {isCompleted && (
                                    <Badge variant="light" color="green" size="sm">
                                        수강 완료
                                    </Badge>
                                )}
                            </Group>
                        </Box>

                        {/* 영상 영역 (Vimeo placeholder) */}
                        <Card padding={0} radius="lg" withBorder style={{ overflow: 'hidden' }}>
                            <div
                                style={{
                                    position: 'relative',
                                    paddingBottom: '56.25%',
                                    background: '#f3f4f6',
                                }}
                            >
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 0, left: 0, right: 0, bottom: 0,
                                        display: 'flex', flexDirection: 'column',
                                        alignItems: 'center', justifyContent: 'center',
                                        gap: 8,
                                    }}
                                >
                                    <BookOpen size={48} color="#d1d5db" />
                                    <Text c="gray.4" size="lg" fw={500}>영상 준비 중</Text>
                                    <Text c="gray.4" size="sm">Vimeo 영상이 곧 업로드됩니다</Text>
                                </div>
                            </div>
                        </Card>

                        {/* 수강 완료 버튼 */}
                        <Card padding="lg" radius="lg" withBorder>
                            <Group justify="space-between" align="center">
                                <Group gap="sm">
                                    {isCompleted ? (
                                        <CheckCircle2 size={22} color="#8b5cf6" fill="#8b5cf6" strokeWidth={0} />
                                    ) : (
                                        <Circle size={22} color="#d1d5db" />
                                    )}
                                    <Text fw={500} c={isCompleted ? 'gray.6' : 'gray.8'}>
                                        {isCompleted ? '이 강의를 수강 완료했습니다' : '강의를 다 들으셨나요?'}
                                    </Text>
                                </Group>
                                {!isCompleted && (
                                    <Button
                                        color="violet"
                                        radius="lg"
                                        onClick={handleMarkComplete}
                                        loading={isMarking}
                                        leftSection={<CheckCircle2 size={16} />}
                                    >
                                        수강 완료
                                    </Button>
                                )}
                            </Group>
                        </Card>

                        {/* 실습 CTA */}
                        {hasPracticeCta && (
                            <Card padding="lg" radius="lg" style={{ background: '#8b5cf6' }}>
                                <Group justify="space-between" align="center">
                                    <Box>
                                        <Text c="white" fw={600} size="md">실습 과제</Text>
                                        <Text c="white" size="sm" opacity={0.85} mt={2}>
                                            배운 내용을 FlowSpot V2에서 직접 적용해보세요
                                        </Text>
                                    </Box>
                                    <Button
                                        component={Link}
                                        href="/dashboard/scripts-v2"
                                        variant="white"
                                        color="violet"
                                        radius="lg"
                                        rightSection={<ArrowRight size={16} />}
                                    >
                                        실습하기
                                    </Button>
                                </Group>
                            </Card>
                        )}

                        {/* 이전/다음 네비게이션 */}
                        <Group justify="space-between" mt="md">
                            {prevVod ? (
                                <Button
                                    component={Link}
                                    href={`/dashboard/lectures/${prevVod.id}`}
                                    variant="light" color="gray" radius="lg"
                                    leftSection={<ArrowLeft size={16} />}
                                >
                                    <Box>
                                        <Text size="xs" c="gray.5">이전 강의</Text>
                                        <Text size="sm" fw={500}>{prevVod.title}</Text>
                                    </Box>
                                </Button>
                            ) : <div />}
                            {nextVod ? (
                                <Button
                                    component={Link}
                                    href={`/dashboard/lectures/${nextVod.id}`}
                                    variant="light" color="violet" radius="lg"
                                    rightSection={<ArrowRight size={16} />}
                                >
                                    <Box>
                                        <Text size="xs" c="gray.5" ta="right">다음 강의</Text>
                                        <Text size="sm" fw={500}>{nextVod.title}</Text>
                                    </Box>
                                </Button>
                            ) : <div />}
                        </Group>
                    </Stack>
                </div>

                {/* 오른쪽: 강의 목록 사이드 패널 (데스크톱 항상 표시, 모바일 토글) */}
                <Box
                    style={{
                        width: 320,
                        flexShrink: 0,
                    }}
                    visibleFrom={showList ? undefined : 'md'}
                >
                    <Card
                        padding={0}
                        radius="lg"
                        withBorder
                        style={{ position: 'sticky', top: 80 }}
                    >
                        {/* 패널 헤더 */}
                        <Box p="md" style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <Group justify="space-between">
                                <Text fw={600} size="sm" style={{ color: '#111827' }}>
                                    강의 목록
                                </Text>
                                <Badge variant="light" color="violet" size="sm">
                                    {completedVods.length}/{allVods.length}
                                </Badge>
                            </Group>
                        </Box>

                        <ScrollArea h={520} type="auto">
                            <Stack gap={0}>
                                {CHAPTERS.map((chapter) => {
                                    const chapterCompleted = chapter.vods.filter((v) =>
                                        completedVods.includes(v.id)
                                    ).length;
                                    const isOpen = openChapters[chapter.id] || false;

                                    return (
                                        <Box key={chapter.id}>
                                            {/* 챕터 헤더 */}
                                            <UnstyledButton
                                                onClick={() => toggleChapter(chapter.id)}
                                                style={{
                                                    width: '100%',
                                                    borderBottom: '1px solid #f3f4f6',
                                                }}
                                                p="sm"
                                                px="md"
                                            >
                                                <Group justify="space-between">
                                                    <Group gap={6}>
                                                        {isOpen ? (
                                                            <ChevronDown size={14} color="#6b7280" />
                                                        ) : (
                                                            <ChevronRight size={14} color="#6b7280" />
                                                        )}
                                                        <Text fw={600} size="xs" style={{ color: '#374151' }}>
                                                            {chapter.title}
                                                        </Text>
                                                    </Group>
                                                    <Text size="xs" c="gray.4">
                                                        {chapterCompleted}/{chapter.vods.length}
                                                    </Text>
                                                </Group>
                                            </UnstyledButton>

                                            {/* VOD 목록 */}
                                            <Collapse in={isOpen}>
                                                <Stack gap={0}>
                                                    {chapter.vods.map((vod) => {
                                                        const isDone = completedVods.includes(vod.id);
                                                        const isCurrent = vod.id === vodId;

                                                        return (
                                                            <UnstyledButton
                                                                key={vod.id}
                                                                component={Link}
                                                                href={`/dashboard/lectures/${vod.id}`}
                                                                style={{
                                                                    display: 'block',
                                                                    width: '100%',
                                                                    background: isCurrent
                                                                        ? 'rgba(139, 92, 246, 0.08)'
                                                                        : 'transparent',
                                                                    borderLeft: isCurrent
                                                                        ? '3px solid #8b5cf6'
                                                                        : '3px solid transparent',
                                                                }}
                                                                py={8}
                                                                px="md"
                                                            >
                                                                <Group gap={8} wrap="nowrap">
                                                                    {isDone ? (
                                                                        <CheckCircle2
                                                                            size={14}
                                                                            color="#8b5cf6"
                                                                            fill="#8b5cf6"
                                                                            strokeWidth={0}
                                                                            style={{ flexShrink: 0 }}
                                                                        />
                                                                    ) : (
                                                                        <Circle
                                                                            size={14}
                                                                            color="#d1d5db"
                                                                            style={{ flexShrink: 0 }}
                                                                        />
                                                                    )}
                                                                    <Text
                                                                        size="xs"
                                                                        fw={isCurrent ? 600 : 400}
                                                                        c={isCurrent ? 'violet.7' : isDone ? 'gray.5' : 'gray.7'}
                                                                        style={{
                                                                            whiteSpace: 'nowrap',
                                                                            overflow: 'hidden',
                                                                            textOverflow: 'ellipsis',
                                                                        }}
                                                                    >
                                                                        {vod.title}
                                                                    </Text>
                                                                    <Text size="xs" c="gray.4" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                                                                        {vod.duration}분
                                                                    </Text>
                                                                </Group>
                                                            </UnstyledButton>
                                                        );
                                                    })}
                                                </Stack>
                                            </Collapse>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        </ScrollArea>
                    </Card>
                </Box>
            </div>
        </Container>
    );
}
