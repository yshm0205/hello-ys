'use client';

/**
 * 크레딧 충전 페이지
 * - 현재 잔량 + 플랜 정보
 * - 추가팩 4종 구매
 * - 크레딧 소모 안내
 */

import { useState, useEffect } from 'react';
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
    SimpleGrid,
    Progress,
    Table,
} from '@mantine/core';
import {
    Zap,
    Coins,
    Crown,
    Search,
    Sparkles,
    RefreshCw,
    SkipForward,
} from 'lucide-react';

interface CreditInfo {
    credits: number;
    plan_type: string;
    expires_at: string | null;
}

export function CreditsContent() {
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/credits');
                if (res.ok) {
                    const data = await res.json();
                    setCreditInfo(data);
                }
            } catch {
                // ignore
            }
        }
        fetchCredits();
    }, []);

    const planType = creditInfo?.plan_type || 'free';
    const planLabel = planType === 'pro' ? 'Pro' : planType === 'allinone' ? '올인원 패스' : '무료 체험';
    const maxCredits = planType === 'pro' ? 500 : planType === 'allinone' ? 3000 : 30;
    const credits = creditInfo?.credits ?? 0;

    const packs = [
        { cr: 100, price: '₩14,900', per: '₩149', popular: false },
        { cr: 300, price: '₩34,900', per: '₩116', popular: false },
        { cr: 500, price: '₩54,900', per: '₩110', popular: true },
        { cr: 1000, price: '₩99,900', per: '₩100', popular: false },
    ];

    const usageGuide = [
        { action: '리서치', cost: 3, icon: <Search size={16} />, desc: '소재 기반 실시간 팩트 검색' },
        { action: '풀 생성', cost: 10, icon: <Sparkles size={16} />, desc: '리서치 + 스크립트 3개 생성' },
        { action: '스킵 생성', cost: 7, icon: <SkipForward size={16} />, desc: '리서치 없이 스크립트 3개 생성' },
        { action: '리라이트', cost: 2, icon: <RefreshCw size={16} />, desc: '기존 스크립트 말투 변경' },
    ];

    return (
        <Container size="lg" py="md">
            <Stack gap="xl">
                {/* 헤더 */}
                <Box>
                    <Group gap="sm" mb="xs">
                        <Coins size={28} color="#8b5cf6" />
                        <Title order={2} style={{ color: '#111827' }}>크레딧 충전</Title>
                    </Group>
                    <Text c="gray.6">크레딧을 충전하고 스크립트를 만들어보세요</Text>
                </Box>

                {/* 현재 상태 */}
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    {/* 잔여 크레딧 */}
                    <Card padding="xl" radius="xl" style={{ background: '#8b5cf6', border: 'none' }}>
                        <Stack gap="sm">
                            <Text size="sm" c="white" opacity={0.8}>잔여 크레딧</Text>
                            <Group gap="xs" align="baseline">
                                <Title order={1} c="white">{credits}</Title>
                                <Text size="sm" c="white" opacity={0.7}>크레딧</Text>
                            </Group>
                            <Progress
                                value={Math.min((credits / maxCredits) * 100, 100)}
                                color="white"
                                size="sm" radius="xl"
                                style={{ opacity: 0.5 }}
                            />
                        </Stack>
                    </Card>

                    {/* 현재 플랜 */}
                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">현재 플랜</Text>
                                <Crown size={20} color="#8b5cf6" />
                            </Group>
                            <Title order={2} style={{ color: '#111827' }}>{planLabel}</Title>
                            <Group gap="sm">
                                <Badge variant="light" color="violet">{planType === 'free' ? '무료' : '활성'}</Badge>
                                {creditInfo?.expires_at && (
                                    <Text size="xs" c="gray.5">
                                        만료: {new Date(creditInfo.expires_at).toLocaleDateString('ko-KR')}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                    </Card>
                </SimpleGrid>

                {/* 추가팩 */}
                <Box>
                    <Group gap="sm" mb="xs">
                        <Zap size={22} color="#8b5cf6" />
                        <Title order={3} style={{ color: '#111827' }}>추가 크레딧 팩</Title>
                    </Group>
                    <Text size="sm" c="gray.5" mb="lg">만료 없음 · 구매 즉시 충전 · 모든 사용자 이용 가능</Text>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {packs.map((pack) => (
                            <Card key={pack.cr} padding="lg" radius="xl"
                                style={pack.popular
                                    ? { border: '2px solid #8b5cf6', position: 'relative' as const, overflow: 'visible' as const }
                                    : { border: '1px solid #e5e7eb' }
                                }
                            >
                                {pack.popular && (
                                    <Badge
                                        size="sm" color="violet" variant="filled"
                                        style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)' }}
                                    >
                                        인기
                                    </Badge>
                                )}
                                <Group justify="space-between" align="center">
                                    <Box>
                                        <Group gap="xs">
                                            <Zap size={18} color="#8b5cf6" />
                                            <Text fw={700} size="lg" style={{ color: '#111827' }}>
                                                {pack.cr.toLocaleString()} 크레딧
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" mt={2}>cr당 {pack.per}</Text>
                                    </Box>
                                    <Box ta="right">
                                        <Text fw={800} size="xl" style={{ color: '#8b5cf6' }}>{pack.price}</Text>
                                        <Button
                                            size="xs" radius="lg" mt={4}
                                            variant={pack.popular ? 'filled' : 'light'} color="violet"
                                            style={pack.popular ? { background: '#8b5cf6' } : undefined}
                                            disabled
                                        >
                                            준비 중
                                        </Button>
                                    </Box>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Box>

                {/* 소모량 안내 */}
                <Card padding="xl" radius="xl" withBorder>
                    <Title order={4} mb="md" style={{ color: '#111827' }}>크레딧 사용 안내</Title>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>기능</Table.Th>
                                <Table.Th>소모량</Table.Th>
                                <Table.Th>설명</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {usageGuide.map((item) => (
                                <Table.Tr key={item.action}>
                                    <Table.Td>
                                        <Group gap={8}>
                                            {item.icon}
                                            <Text size="sm" fw={500}>{item.action}</Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge variant="light" color="violet" size="sm">{item.cost} cr</Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="sm" c="gray.6">{item.desc}</Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Card>
            </Stack>
        </Container>
    );
}
