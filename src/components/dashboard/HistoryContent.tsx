'use client';

/**
 * 히스토리 페이지 콘텐츠
 * Streamlit 스타일: 프로젝트 목록, 열기/삭제
 */

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
} from '@mantine/core';
import {
    FolderOpen,
    Pencil,
    Trash2,
    Search,
    Filter,
    Plus,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { useState } from 'react';

// 목 데이터: 전체 히스토리
const mockHistory = [
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
    {
        id: '4',
        title: '화물선 선원들의 극한 일상...',
        inputText: '전 세계 물류의 90%는 화물선으로 운반됩니다...',
        createdAt: '2026-01-12 18:45',
        versions: 3,
        archetype: 'HIDDEN_SCENE_DAILY',
    },
    {
        id: '5',
        title: '트랙터의 무시무시한 위력...',
        inputText: '트랙터는 생각보다 무시무시한 힘을 가지고 있습니다...',
        createdAt: '2026-01-11 09:30',
        versions: 3,
        archetype: 'TOOL_FORCE',
    },
];

const ARCHETYPE_NAMES: Record<string, string> = {
    'APPEARANCE_VS_REALITY': '겉보기 vs 실제',
    'EXTREME_METRIC_VARIANT': '극단 수치형',
    'TOOL_FORCE': '도구 위력형',
    'PHENOMENON_SITE': '현상 현장형',
    'HIDDEN_SCENE_DAILY': '숨겨진 장면형',
};

export function HistoryContent() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterArchetype, setFilterArchetype] = useState<string | null>(null);

    const filteredHistory = mockHistory.filter((item) => {
        const matchesSearch =
            searchQuery === '' ||
            item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.inputText.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesArchetype =
            !filterArchetype || item.archetype === filterArchetype;

        return matchesSearch && matchesArchetype;
    });

    const handleDelete = (id: string) => {
        alert(`삭제: ${id} (데모)`);
    };

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Group justify="space-between">
                    <Box>
                        <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                            📂 내 스크립트 보관함
                        </Title>
                        <Text c="gray.6" mt={4}>
                            생성한 스크립트들을 관리하세요
                        </Text>
                    </Box>
                    <Button
                        component={Link}
                        href="/dashboard/batch"
                        prefetch={false}
                        leftSection={<Plus size={18} />}
                        style={{
                            background: '#8b5cf6',
                            border: 'none',
                        }}
                    >
                        ✨ 새 프로젝트 만들기
                    </Button>
                </Group>

                {/* 필터 */}
                <Card padding="md" radius="lg" withBorder>
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

                {/* 히스토리 테이블 */}
                <Card padding={0} radius="lg" withBorder>
                    {filteredHistory.length > 0 ? (
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
                                {filteredHistory.map((item) => (
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
                                                    <ActionIcon
                                                        variant="light"
                                                        color="blue"
                                                    >
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
                                                        onClick={() => handleDelete(item.id)}
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
                            {searchQuery && (
                                <Button
                                    variant="subtle"
                                    mt="md"
                                    onClick={() => setSearchQuery('')}
                                >
                                    필터 초기화
                                </Button>
                            )}
                        </Box>
                    )}
                </Card>

                {/* 통계 */}
                <Group justify="center">
                    <Badge variant="light" color="gray" size="lg">
                        총 {filteredHistory.length}개 프로젝트 | {filteredHistory.length * 3}개 스크립트
                    </Badge>
                </Group>
            </Stack>
        </Container>
    );
}
