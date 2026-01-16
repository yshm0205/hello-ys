'use client';

/**
 * 보관함 페이지 콘텐츠
 * Streamlit 스타일: 내 스크립트 + 영상 연결 Tabs
 */

import { useState } from 'react';
import {
    Container,
    Title,
    Text,
    Card,
    Stack,
    Group,
    Badge,
    Button,
    Box,
    Table,
    ActionIcon,
    Tooltip,
    TextInput,
    Select,
    Tabs,
    Textarea,
    Alert,
} from '@mantine/core';
import {
    FolderOpen,
    Pencil,
    Trash2,
    Search,
    Filter,
    Plus,
    Link2,
    Youtube,
    Check,
    AlertCircle,
} from 'lucide-react';
import { Link } from '@/i18n/routing';

// 아키타입 한글 이름
const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '겉보기 vs 실제',
    'EXTREME_METRIC_VARIANT': '극단 수치형',
    'TOOL_FORCE': '도구 위력형',
    'PHENOMENON_SITE': '현상 현장형',
    'HIDDEN_SCENE_DAILY': '숨겨진 장면형',
};

// 목 데이터: 스크립트 히스토리
const mockScripts = [
    {
        id: '1',
        title: '일본 건설 현장의 비밀...',
        inputText: '일본에서는 공사 인부가 일을 끝내도 바로 돈을 못 받는다고 합니다...',
        createdAt: '2026-01-15 21:30',
        versions: 3,
        archetype: 'APPEARANCE_VS_REALITY',
    },
    {
        id: '2',
        title: '사막에서 차에 엔진 오일을...',
        inputText: '사막에선 사람들이 차에다 엔진 오일을 뿌리는 기괴한 모습을 볼 수 있습니다...',
        createdAt: '2026-01-14 15:22',
        versions: 3,
        archetype: 'PHENOMENON_SITE',
    },
    {
        id: '3',
        title: '소금 호수가 분홍색인 이유...',
        inputText: '세계에서 가장 짜게 느껴지는 곳은 의외로 호수입니다...',
        createdAt: '2026-01-13 10:15',
        versions: 3,
        archetype: 'EXTREME_METRIC_VARIANT',
    },
];

// 목 데이터: 연결된 영상
const mockLinkedVideos = [
    {
        id: '1',
        title: '일본 건설 현장에서 돈 받는 방법',
        youtubeUrl: 'https://youtube.com/watch?v=abc123',
        scriptId: '1',
        hookStyle: 'APPEARANCE_VS_REALITY',
        publishedAt: '2026-01-16',
    },
];

export function ArchiveContent() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterArchetype, setFilterArchetype] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string | null>('scripts');

    // 영상 연결 폼 상태
    const [videoTitle, setVideoTitle] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [selectedScript, setSelectedScript] = useState<string | null>(null);
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [linkSuccess, setLinkSuccess] = useState(false);

    const filteredScripts = mockScripts.filter((item) => {
        const matchesSearch =
            searchQuery === '' ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.inputText.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesArchetype =
            !filterArchetype || item.archetype === filterArchetype;

        return matchesSearch && matchesArchetype;
    });

    const handleDeleteScript = (id: string) => {
        alert(`삭제: ${id} (데모)`);
    };

    const handleDeleteVideo = (id: string) => {
        alert(`영상 연결 삭제: ${id} (데모)`);
    };

    const handleLinkVideo = () => {
        if (!videoTitle || !youtubeUrl) {
            alert('제목과 YouTube URL을 입력해주세요.');
            return;
        }
        setLinkSuccess(true);
        setTimeout(() => setLinkSuccess(false), 3000);
        // Reset form
        setVideoTitle('');
        setYoutubeUrl('');
        setSelectedScript(null);
        setSelectedStyle(null);
    };

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Box>
                        <Group gap="sm">
                            <FolderOpen size={28} color="#8b5cf6" />
                            <Title order={2} style={{ color: '#111827' }}>
                                보관함
                            </Title>
                        </Group>
                        <Text c="gray.6" mt={4}>
                            생성한 스크립트와 YouTube 영상을 관리하세요
                        </Text>
                    </Box>
                    <Button
                        component={Link}
                        href="/dashboard/scripts"
                        leftSection={<Plus size={18} />}
                        style={{
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                            border: 'none',
                        }}
                    >
                        ✨ 새 스크립트 만들기
                    </Button>
                </Group>

                {/* Tabs - Streamlit 스타일 */}
                <Tabs value={activeTab} onChange={setActiveTab} variant="pills" radius="lg">
                    <Tabs.List>
                        <Tabs.Tab value="scripts" leftSection={<FolderOpen size={18} />}>
                            📋 내 스크립트
                        </Tabs.Tab>
                        <Tabs.Tab value="videos" leftSection={<Youtube size={18} />}>
                            🔗 영상 연결
                        </Tabs.Tab>
                    </Tabs.List>

                    {/* Tab 1: 내 스크립트 */}
                    <Tabs.Panel value="scripts" pt="xl">
                        {/* 필터 */}
                        <Card padding="md" radius="lg" withBorder mb="lg">
                            <Group>
                                <TextInput
                                    placeholder="검색..."
                                    leftSection={<Search size={18} />}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.currentTarget.value)}
                                    style={{ flex: 1 }}
                                />
                                <Select
                                    placeholder="스타일 필터"
                                    leftSection={<Filter size={18} />}
                                    clearable
                                    value={filterArchetype}
                                    onChange={setFilterArchetype}
                                    data={Object.entries(ARCHETYPE_NAMES).map(([key, value]) => ({
                                        value: key,
                                        label: value,
                                    }))}
                                    style={{ width: 200 }}
                                />
                            </Group>
                        </Card>

                        {/* 스크립트 테이블 */}
                        <Card padding={0} radius="lg" withBorder>
                            {filteredScripts.length > 0 ? (
                                <Table highlightOnHover>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>제목</Table.Th>
                                            <Table.Th>원문 미리보기</Table.Th>
                                            <Table.Th>생성일</Table.Th>
                                            <Table.Th>스타일</Table.Th>
                                            <Table.Th style={{ width: 120 }}>액션</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {filteredScripts.map((item) => (
                                            <Table.Tr key={item.id}>
                                                <Table.Td>
                                                    <Text fw={500}>{item.title}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="gray.6" lineClamp={1} maw={200}>
                                                        {item.inputText}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="gray.6">{item.createdAt}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="outline" color="violet">
                                                        {ARCHETYPE_NAMES[item.archetype] || item.archetype}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <Tooltip label="열기">
                                                            <ActionIcon variant="light" color="blue">
                                                                <FolderOpen size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="수정">
                                                            <ActionIcon variant="subtle" color="gray">
                                                                <Pencil size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                        <Tooltip label="삭제">
                                                            <ActionIcon
                                                                variant="subtle"
                                                                color="red"
                                                                onClick={() => handleDeleteScript(item.id)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            ) : (
                                <Box p="xl" ta="center">
                                    <Text c="gray.5" size="lg">
                                        📭 검색 결과가 없습니다
                                    </Text>
                                </Box>
                            )}
                        </Card>

                        <Group justify="center" mt="lg">
                            <Badge variant="light" color="gray" size="lg">
                                총 {filteredScripts.length}개 프로젝트 | {filteredScripts.length * 3}개 스크립트
                            </Badge>
                        </Group>
                    </Tabs.Panel>

                    {/* Tab 2: 영상 연결 */}
                    <Tabs.Panel value="videos" pt="xl">
                        {/* 안내 */}
                        <Alert
                            icon={<AlertCircle size={18} />}
                            title="💡 Step 1. 영상 자산화"
                            color="blue"
                            variant="light"
                            radius="lg"
                            mb="lg"
                        >
                            생성한 스크립트로 영상을 제작하셨나요? 유튜브 영상 주소를 연결해주세요.
                            연결된 데이터가 있어야 성과 분석이 가능합니다.
                        </Alert>

                        {/* 영상 연결 폼 */}
                        <Card padding="xl" radius="xl" withBorder mb="lg">
                            <Stack gap="lg">
                                <Title order={4}>🔗 새 영상 연결</Title>

                                {linkSuccess && (
                                    <Alert icon={<Check size={18} />} color="green" radius="lg">
                                        영상이 성공적으로 연결되었습니다!
                                    </Alert>
                                )}

                                <TextInput
                                    label="영상 제목"
                                    placeholder="예: 일본 건설 현장의 비밀"
                                    value={videoTitle}
                                    onChange={(e) => setVideoTitle(e.currentTarget.value)}
                                />

                                <TextInput
                                    label="YouTube URL"
                                    placeholder="https://youtube.com/watch?v=..."
                                    leftSection={<Youtube size={18} />}
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.currentTarget.value)}
                                />

                                <Select
                                    label="연결할 스크립트 (선택)"
                                    placeholder="스크립트 선택..."
                                    clearable
                                    value={selectedScript}
                                    onChange={setSelectedScript}
                                    data={mockScripts.map((s) => ({
                                        value: s.id,
                                        label: s.title,
                                    }))}
                                />

                                <Select
                                    label="훅 스타일"
                                    placeholder="스타일 선택..."
                                    clearable
                                    value={selectedStyle}
                                    onChange={setSelectedStyle}
                                    data={Object.entries(ARCHETYPE_NAMES).map(([key, value]) => ({
                                        value: key,
                                        label: value,
                                    }))}
                                />

                                <Button
                                    onClick={handleLinkVideo}
                                    leftSection={<Link2 size={18} />}
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                        border: 'none',
                                    }}
                                >
                                    영상 연결하기
                                </Button>
                            </Stack>
                        </Card>

                        {/* 연결된 영상 목록 */}
                        <Card padding="lg" radius="xl" withBorder>
                            <Title order={4} mb="lg">📋 연결된 영상 목록</Title>

                            {mockLinkedVideos.length > 0 ? (
                                <Table>
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>제목</Table.Th>
                                            <Table.Th>스타일</Table.Th>
                                            <Table.Th>업로드일</Table.Th>
                                            <Table.Th>상태</Table.Th>
                                            <Table.Th style={{ width: 80 }}>액션</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {mockLinkedVideos.map((video) => (
                                            <Table.Tr key={video.id}>
                                                <Table.Td>
                                                    <Group gap="xs">
                                                        <Youtube size={16} color="#ff0000" />
                                                        <Text fw={500}>{video.title}</Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="outline" color="violet">
                                                        {ARCHETYPE_NAMES[video.hookStyle] || video.hookStyle}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="gray.6">{video.publishedAt}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge color="green" variant="light">
                                                        ✅ YouTube 연결됨
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Tooltip label="삭제">
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() => handleDeleteVideo(video.id)}
                                                        >
                                                            <Trash2 size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            ) : (
                                <Box p="xl" ta="center">
                                    <Text c="gray.5">
                                        아직 연결된 영상이 없습니다. 위에서 영상을 연결해주세요!
                                    </Text>
                                </Box>
                            )}
                        </Card>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
