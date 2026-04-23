'use client';

/**
 * 강의 시청 페이지 컴포넌트
 * 왼쪽: VdoCipher 플레이어 + 수강 완료 + 이전/다음
 * 오른쪽: 챕터별 강의 목록 사이드 패널
 *
 * VdoCipher api.js 연동:
 * - 이어서 듣기 (last_position 저장/복원)
 * - 자동 진도 체크 (90%+ 시청 시 자동 완료)
 * - 자동 다음 강의 (ended → 5초 카운트다운)
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
    Loader,
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
    X,
    Paperclip,
    FileText,
    Music,
    ImageIcon,
    FolderOpen,
    ExternalLink,
} from 'lucide-react';
import { Link, useRouter } from '@/i18n/routing';
import { VideoWatermark } from './VideoWatermark';
import type { LectureCatalogChapter } from '@/lib/lectures/types';
import { ReviewEventBanner } from './ReviewEventBanner';

interface LecturePlayerContentProps {
    vodId: string;
    userEmail?: string;
    chapters?: LectureCatalogChapter[];
}

// 모든 VOD를 순서대로 펼친 배열 생성
function getAllVods(chapters: LectureCatalogChapter[]) {
    const allVods: { id: string; title: string; duration: number; chapterTitle: string; chapterId: string; isPlayable?: boolean }[] = [];
    for (const ch of chapters) {
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

// VdoPlayer 타입 (api.js 글로벌)
declare global {
    interface Window {
        VdoPlayer?: {
            getInstance: (iframe: HTMLIFrameElement) => {
                video: {
                    currentTime: number;
                    duration: number;
                    addEventListener: (event: string, handler: () => void) => void;
                    removeEventListener: (event: string, handler: () => void) => void;
                    play: () => void;
                };
                api: {
                    getTotalCovered: () => Promise<number>;
                };
            };
        };
    }
}

export function LecturePlayerContent({ vodId, userEmail, chapters }: LecturePlayerContentProps) {
    const lectureChapters = useMemo(() => chapters?.length ? chapters : [], [chapters]);
    const router = useRouter();
    const [completedVods, setCompletedVods] = useState<string[]>([]);
    const [positions, setPositions] = useState<Record<string, number>>({});
    const [isMarking, setIsMarking] = useState(false);
    const [showList, setShowList] = useState(true);
    const [videoOtp, setVideoOtp] = useState<string | null>(null);
    const [playbackInfo, setPlaybackInfo] = useState<string | null>(null);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    // 수업 자료
    const [materials, setMaterials] = useState<
        { id: string; title: string; type: string; url: string; file_size: string | null }[]
    >([]);

    // 자동 다음 강의 카운트다운
    const [countdown, setCountdown] = useState<number | null>(null);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const lastSaveRef = useRef<number>(0);
    const autoCompletedRef = useRef(false);
    const currentPositionRef = useRef(0);
    const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const allVods = useMemo(() => getAllVods(lectureChapters), [lectureChapters]);
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

    // vodId 변경 시 해당 챕터 열기 + 카운트다운/자동완료 초기화
    useEffect(() => {
        if (currentVod) {
            setOpenChapters((prev) => ({ ...prev, [currentVod.chapterId]: true }));
        }
        autoCompletedRef.current = false;
        setCountdown(null);
        if (countdownTimerRef.current) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
    }, [vodId, currentVod]);

    // 수업 자료 fetch
    useEffect(() => {
        setMaterials([]);
        fetch(`/api/lectures/materials?vodId=${vodId}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.materials) setMaterials(data.materials);
            })
            .catch(() => { /* 무시 */ });
    }, [vodId]);

    // VdoCipher api.js 로드 (한번만)
    useEffect(() => {
        if (document.querySelector('script[src*="vdocipher.com/v2/api.js"]')) return;
        const script = document.createElement('script');
        script.src = 'https://player.vdocipher.com/v2/api.js';
        script.async = true;
        document.head.appendChild(script);
    }, []);

    // VdoCipher OTP 발급
    useEffect(() => {
        setVideoOtp(null);
        setPlaybackInfo(null);
        setVideoError(null);

        if (!currentVod?.isPlayable) return;

        setIsVideoLoading(true);
        fetch('/api/lectures/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vodId }),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.otp && data.playbackInfo) {
                    setVideoOtp(data.otp);
                    setPlaybackInfo(data.playbackInfo);
                } else {
                    setVideoError('영상을 불러올 수 없습니다');
                }
            })
            .catch(() => {
                setVideoError('영상을 불러올 수 없습니다');
            })
            .finally(() => {
                setIsVideoLoading(false);
            });
    }, [vodId, currentVod?.isPlayable]);

    // 수강 진도 불러오기 (completedVods + positions)
    useEffect(() => {
        async function fetchProgress() {
            try {
                const res = await fetch('/api/lectures/progress');
                const data = await res.json();
                if (data.success) {
                    setCompletedVods(data.completedVods || []);
                    setPositions(data.positions || {});
                }
            } catch {
                // 에러 시 빈 배열 유지
            }
        }
        fetchProgress();
    }, []);

    // 진도 저장 함수
    const savePosition = useCallback((position: number) => {
        currentPositionRef.current = position;
        fetch('/api/lectures/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vod_id: vodId, last_position: position }),
        }).catch(() => { /* 무시 */ });
    }, [vodId]);

    // 완료 처리 함수
    const markComplete = useCallback((position?: number) => {
        const body: Record<string, unknown> = { vod_id: vodId, completed: true };
        if (typeof position === 'number') body.last_position = position;
        fetch('/api/lectures/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.completed) {
                    setCompletedVods((prev) =>
                        prev.includes(vodId) ? prev : [...prev, vodId]
                    );
                }
            })
            .catch(() => { /* 무시 */ });
    }, [vodId]);

    // VdoPlayer 인스턴스 + 이벤트 바인딩
    useEffect(() => {
        if (!videoOtp || !iframeRef.current) return;

        const iframe = iframeRef.current;
        let cleanedUp = false;

        // api.js 로드 대기 후 플레이어 초기화
        const waitForApi = setInterval(() => {
            if (cleanedUp) { clearInterval(waitForApi); return; }
            if (!window.VdoPlayer) return;
            clearInterval(waitForApi);

            try {
                const player = window.VdoPlayer.getInstance(iframe);

                // 이어서 듣기: loadedmetadata 후 저장된 위치로 seek
                const savedPos = positions[vodId] || 0;
                player.video.addEventListener('loadedmetadata', () => {
                    if (savedPos > 5) {
                        // 끝에서 5초 이내면 처음부터
                        const dur = player.video.duration;
                        if (dur > 0 && savedPos < dur - 5) {
                            player.video.currentTime = savedPos;
                        }
                    }
                });

                // 15초마다 진도 저장 + 90% 자동 완료 체크
                player.video.addEventListener('timeupdate', () => {
                    const current = player.video.currentTime;
                    const duration = player.video.duration;
                    currentPositionRef.current = current;

                    // 15초마다 위치 저장
                    const now = Date.now();
                    if (now - lastSaveRef.current >= 15000) {
                        lastSaveRef.current = now;
                        savePosition(current);
                    }

                    // 90% 자동 완료 (한번만)
                    if (!autoCompletedRef.current && duration > 0 && current / duration >= 0.9) {
                        autoCompletedRef.current = true;
                        markComplete(current);
                    }
                });

                // 영상 끝: 완료 처리 + 다음 강의 카운트다운
                player.video.addEventListener('ended', () => {
                    // 완료 처리
                    if (!autoCompletedRef.current) {
                        autoCompletedRef.current = true;
                        markComplete(player.video.duration || player.video.currentTime);
                    }

                    // 다음 강의 카운트다운 시작
                    if (nextVod) {
                        setCountdown(5);
                    }
                });
            } catch {
                // VdoPlayer 초기화 실패 — 무시 (DRM 미지원 브라우저 등)
            }
        }, 300);

        return () => {
            cleanedUp = true;
            clearInterval(waitForApi);
        };
    // positions는 초기 로드 후 변하지 않으므로 deps에서 제외 (stale closure 의도)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoOtp, vodId, savePosition, markComplete, nextVod]);

    // 카운트다운 타이머
    useEffect(() => {
        if (countdown === null) return;
        if (countdown <= 0 && nextVod) {
            router.push(`/dashboard/lectures/${nextVod.id}`);
            return;
        }
        const timer = setTimeout(() => {
            setCountdown((c) => (c !== null ? c - 1 : null));
        }, 1000);
        return () => clearTimeout(timer);
    }, [countdown, nextVod, router]);

    // 카운트다운 취소
    const cancelCountdown = () => {
        setCountdown(null);
    };

    // 수강 완료 처리 (수동 버튼)
    const handleMarkComplete = async () => {
        if (isMarking || isCompleted) return;
        setIsMarking(true);
        try {
            const position = currentPositionRef.current || positions[vodId] || 0;
            const res = await fetch('/api/lectures/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vod_id: vodId, completed: true, last_position: position }),
            });
            const data = await res.json();
            if (data.success && data.completed) {
                setCompletedVods((prev) => (prev.includes(vodId) ? prev : [...prev, vodId]));
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
    const currentChapter = lectureChapters.find((ch) => ch.id === currentVod?.chapterId);
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
                        prefetch={false}
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
                    prefetch={false}
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
                            <Title order={3} style={{ color: 'var(--mantine-color-text)' }}>
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

                        {/* 영상 영역 + 워터마크 */}
                        <Card padding={0} radius="lg" withBorder style={{ overflow: 'hidden' }}>
                            <div
                                style={{
                                    position: 'relative',
                                    paddingBottom: '56.25%',
                                    background: '#000',
                                }}
                            >
                                {currentVod.isPlayable ? (
                                    isVideoLoading ? (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: '#000',
                                            }}
                                        >
                                            <Loader size="lg" color="violet" />
                                        </div>
                                    ) : videoError ? (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                display: 'flex', flexDirection: 'column',
                                                alignItems: 'center', justifyContent: 'center',
                                                gap: 8, background: '#f3f4f6',
                                            }}
                                        >
                                            <Text c="gray.5" size="sm">{videoError}</Text>
                                        </div>
                                    ) : videoOtp && playbackInfo ? (
                                        <iframe
                                            ref={iframeRef}
                                            src={`https://player.vdocipher.com/v2/?otp=${videoOtp}&playbackInfo=${playbackInfo}&primaryColor=8B5CF6`}
                                            style={{
                                                position: 'absolute',
                                                top: 0, left: 0,
                                                width: '100%', height: '100%',
                                                border: 0,
                                            }}
                                            allow="encrypted-media"
                                            allowFullScreen
                                        />
                                    ) : null
                                ) : (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: 8, background: '#f3f4f6',
                                        }}
                                    >
                                        <BookOpen size={48} color="#d1d5db" />
                                        <Text c="gray.4" size="lg" fw={500}>영상 준비 중</Text>
                                        <Text c="gray.4" size="sm">곧 업로드됩니다</Text>
                                    </div>
                                )}

                                {/* 다음 강의 카운트다운 오버레이 */}
                                {countdown !== null && nextVod && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            display: 'flex', flexDirection: 'column',
                                            alignItems: 'center', justifyContent: 'center',
                                            gap: 12,
                                            background: 'rgba(0, 0, 0, 0.85)',
                                            zIndex: 10,
                                        }}
                                    >
                                        <Text c="white" size="sm" opacity={0.7}>
                                            다음 강의
                                        </Text>
                                        <Text c="white" size="lg" fw={600}>
                                            {nextVod.title}
                                        </Text>
                                        <Text c="white" size="xl" fw={700} mt={4}>
                                            {countdown}초
                                        </Text>
                                        <Button
                                            variant="subtle"
                                            color="gray"
                                            size="sm"
                                            mt={8}
                                            leftSection={<X size={14} />}
                                            onClick={cancelCountdown}
                                            styles={{ root: { color: 'white', '&:hover': { background: 'rgba(255,255,255,0.1)' } } }}
                                        >
                                            취소
                                        </Button>
                                    </div>
                                )}

                                {/* 동적 워터마크 오버레이 */}
                                {userEmail && <VideoWatermark email={userEmail} />}
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

                        {/* 수업 자료 */}
                        <ReviewEventBanner />

                        {materials.length > 0 && (
                            <Card padding="lg" radius="lg" withBorder>
                                <Group gap={8} mb="sm">
                                    <Paperclip size={18} color="#8b5cf6" />
                                    <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>
                                        수업 자료
                                    </Text>
                                    <Badge variant="light" color="violet" size="xs">
                                        {materials.length}
                                    </Badge>
                                </Group>
                                <Stack gap={6}>
                                    {materials.map((m) => {
                                        const icon =
                                            m.type === 'docs' ? <FileText size={16} color="#6b7280" /> :
                                            m.type === 'audio' ? <Music size={16} color="#6b7280" /> :
                                            m.type === 'image' ? <ImageIcon size={16} color="#6b7280" /> :
                                            <FolderOpen size={16} color="#6b7280" />;
                                        return (
                                            <Box
                                                key={m.id}
                                                component="a"
                                                href={m.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 10,
                                                    padding: '8px 12px',
                                                    borderRadius: 8,
                                                    textDecoration: 'none',
                                                    color: 'var(--mantine-color-text)',
                                                    background: '#f9fafb',
                                                    border: '1px solid #f3f4f6',
                                                    transition: 'background 0.15s',
                                                }}
                                                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                                    e.currentTarget.style.background = '#f3f0ff';
                                                    e.currentTarget.style.borderColor = '#e9e5ff';
                                                }}
                                                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                                                    e.currentTarget.style.background = '#f9fafb';
                                                    e.currentTarget.style.borderColor = '#f3f4f6';
                                                }}
                                            >
                                                {icon}
                                                <Text size="sm" fw={500} style={{ flex: 1 }}>
                                                    {m.title}
                                                </Text>
                                                {m.file_size && (
                                                    <Text size="xs" c="gray.4">
                                                        {m.file_size}
                                                    </Text>
                                                )}
                                                <ExternalLink size={14} color="#9ca3af" />
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Card>
                        )}

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
                                        href="/dashboard/batch"
                                        prefetch={false}
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
                                    prefetch={false}
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
                                    prefetch={false}
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
                                <Text fw={600} size="sm" style={{ color: 'var(--mantine-color-text)' }}>
                                    강의 목록
                                </Text>
                                <Badge variant="light" color="violet" size="sm">
                                    {completedVods.length}/{allVods.length}
                                </Badge>
                            </Group>
                        </Box>

                        <ScrollArea h={520} type="auto">
                            <Stack gap={0}>
                                {lectureChapters.map((chapter) => {
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
                                                        <Text fw={600} size="xs" style={{ color: 'var(--mantine-color-text)' }}>
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
                                                        const isReady = !!vod.isPlayable;

                                                        const rowInner = (
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
                                                                        color={isReady ? '#d1d5db' : '#e5e7eb'}
                                                                        style={{ flexShrink: 0 }}
                                                                    />
                                                                )}
                                                                <Text
                                                                    size="xs"
                                                                    fw={isCurrent ? 600 : 400}
                                                                    c={isCurrent ? 'violet.7' : isDone ? 'gray.5' : isReady ? 'gray.7' : 'gray.4'}
                                                                    style={{
                                                                        whiteSpace: 'nowrap',
                                                                        overflow: 'hidden',
                                                                        textOverflow: 'ellipsis',
                                                                    }}
                                                                >
                                                                    {vod.title}
                                                                </Text>
                                                                <Text size="xs" c="gray.4" style={{ flexShrink: 0, marginLeft: 'auto' }}>
                                                                    {isReady ? `${vod.duration}분` : '준비 중'}
                                                                </Text>
                                                            </Group>
                                                        );

                                                        if (!isReady) {
                                                            return (
                                                                <Box
                                                                    key={vod.id}
                                                                    py={8}
                                                                    px="md"
                                                                    style={{
                                                                        opacity: 0.45,
                                                                        cursor: 'default',
                                                                        borderLeft: '3px solid transparent',
                                                                    }}
                                                                >
                                                                    {rowInner}
                                                                </Box>
                                                            );
                                                        }

                                                        return (
                                                            <UnstyledButton
                                                                key={vod.id}
                                                                component={Link}
                                                                href={`/dashboard/lectures/${vod.id}`}
                                                                prefetch={false}
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
                                                                {rowInner}
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
