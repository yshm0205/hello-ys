'use client';

import { useEffect, useState } from 'react';
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    Progress,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import {
    Coins,
    Crown,
    FlaskConical,
    RefreshCw,
    Search,
    SkipForward,
    Sparkles,
    Zap,
} from 'lucide-react';

import { useTossPay } from '@/hooks/useTossPay';
import { useTossPayment } from '@/hooks/useTossPayment';

interface CreditInfo {
    credits: number;
    plan_type: string;
    expires_at: string | null;
}

interface CreditsContentProps {
    userId?: string;
    isAdmin?: boolean;
}

const packs = [
    { cr: 100, price: '₩14,900', per: '₩149', popular: false },
    { cr: 300, price: '₩34,900', per: '₩116', popular: false },
    { cr: 500, price: '₩54,900', per: '₩110', popular: true },
    { cr: 1000, price: '₩99,900', per: '₩100', popular: false },
];

const usageGuide = [
    { action: '리서치', cost: 3, icon: <Search size={16} />, desc: '소재 기반 리서치와 구조 분석' },
    { action: '전체 생성', cost: 10, icon: <Sparkles size={16} />, desc: '리서치 포함 스크립트 3개 생성' },
    { action: '스킵 생성', cost: 7, icon: <SkipForward size={16} />, desc: '리서치 없이 스크립트 3개 생성' },
    { action: '리라이트', cost: 2, icon: <RefreshCw size={16} />, desc: '기존 스크립트 말투와 표현 수정' },
];

export function CreditsContent({ userId, isAdmin = false }: CreditsContentProps) {
    const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
    const { requestPayment, loading: paymentLoading } = useTossPayment(userId);
    const {
        requestPayment: requestTossPay,
        loading: tossPayLoading,
        error: tossPayError,
    } = useTossPay();

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/credits');
                if (!res.ok) return;
                const data = await res.json();
                setCreditInfo(data);
            } catch {
                // ignore
            }
        }

        fetchCredits();
    }, []);

    const planType = creditInfo?.plan_type || 'free';
    const planLabel =
        planType === 'pro' ? 'Pro' : planType === 'allinone' ? '올인원 패스' : '무료 체험';
    const maxCredits = planType === 'pro' ? 500 : planType === 'allinone' ? 3000 : 30;
    const credits = creditInfo?.credits ?? 0;

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Box>
                    <Group gap="sm" mb="xs">
                        <Coins size={28} color="#8b5cf6" />
                        <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                            크레딧 충전
                        </Title>
                    </Group>
                    <Text c="dimmed">남은 크레딧을 확인하고 필요한 만큼 바로 충전할 수 있습니다.</Text>
                </Box>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                    <Card padding="xl" radius="xl" style={{ background: '#8b5cf6', border: 'none' }}>
                        <Stack gap="sm">
                            <Text size="sm" c="white" opacity={0.8}>보유 크레딧</Text>
                            <Group gap="xs" align="baseline">
                                <Title order={1} c="white">{credits}</Title>
                                <Text size="sm" c="white" opacity={0.7}>cr</Text>
                            </Group>
                            <Progress
                                value={Math.min((credits / maxCredits) * 100, 100)}
                                color="white"
                                size="sm"
                                radius="xl"
                                style={{ opacity: 0.5 }}
                            />
                        </Stack>
                    </Card>

                    <Card padding="xl" radius="xl" withBorder>
                        <Stack gap="sm">
                            <Group justify="space-between">
                                <Text size="sm" c="gray.6">현재 플랜</Text>
                                <Crown size={20} color="#8b5cf6" />
                            </Group>
                            <Title order={2} style={{ color: 'var(--mantine-color-text)' }}>
                                {planLabel}
                            </Title>
                            <Group gap="sm">
                                <Badge variant="light" color="violet">
                                    {planType === 'free' ? '무료' : '활성'}
                                </Badge>
                                {creditInfo?.expires_at && (
                                    <Text size="xs" c="gray.5">
                                        만료: {new Date(creditInfo.expires_at).toLocaleDateString('ko-KR')}
                                    </Text>
                                )}
                            </Group>
                        </Stack>
                    </Card>
                </SimpleGrid>

                <Box>
                    <Group gap="sm" mb="xs">
                        <Zap size={22} color="#8b5cf6" />
                        <Title order={3} style={{ color: 'var(--mantine-color-text)' }}>
                            추가 크레딧 구매
                        </Title>
                    </Group>
                    <Text size="sm" c="gray.5" mb="lg">
                        결제 즉시 충전되며, 별도 만료 없이 바로 사용할 수 있습니다.
                    </Text>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                        {packs.map((pack) => (
                            <Card
                                key={pack.cr}
                                padding="lg"
                                radius="xl"
                                style={
                                    pack.popular
                                        ? {
                                            border: '2px solid #8b5cf6',
                                            position: 'relative',
                                            overflow: 'visible',
                                        }
                                        : { border: '1px solid #e5e7eb' }
                                }
                            >
                                {pack.popular && (
                                    <Badge
                                        size="sm"
                                        color="violet"
                                        variant="filled"
                                        style={{
                                            position: 'absolute',
                                            top: -10,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                        }}
                                    >
                                        인기
                                    </Badge>
                                )}
                                <Group justify="space-between" align="center">
                                    <Box>
                                        <Group gap="xs">
                                            <Zap size={18} color="#8b5cf6" />
                                            <Text fw={700} size="lg" style={{ color: 'var(--mantine-color-text)' }}>
                                                {pack.cr.toLocaleString()} 크레딧
                                            </Text>
                                        </Group>
                                        <Text size="xs" c="gray.5" mt={2}>cr당 {pack.per}</Text>
                                    </Box>
                                    <Box ta="right">
                                        <Text fw={800} size="xl" style={{ color: '#8b5cf6' }}>{pack.price}</Text>
                                        <Button
                                            size="xs"
                                            radius="lg"
                                            mt={4}
                                            variant={pack.popular ? 'filled' : 'light'}
                                            color="violet"
                                            style={pack.popular ? { background: '#8b5cf6' } : undefined}
                                            loading={paymentLoading}
                                            onClick={() => requestPayment(pack.cr)}
                                        >
                                            구매하기
                                        </Button>
                                    </Box>
                                </Group>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Box>

                {isAdmin && (
                    <Card padding="lg" radius="xl" withBorder>
                        <Group justify="space-between" align="flex-start" gap="md">
                            <Box maw={560}>
                                <Group gap="xs" mb="xs">
                                    <FlaskConical size={18} color="#8b5cf6" />
                                    <Text fw={700} style={{ color: 'var(--mantine-color-text)' }}>
                                        TossPay API 테스트
                                    </Text>
                                </Group>
                                <Text size="sm" c="dimmed">
                                    `TOSSPAY_API_KEY`와 `tosspay create → callback → success`
                                    경로를 실제 결제로 검증합니다. 올인원 4개월 프로그램 기준
                                    99,000원 결제 페이지를 엽니다.
                                </Text>
                                {tossPayError && (
                                    <Text size="sm" c="red.6" mt="xs">
                                        {tossPayError}
                                    </Text>
                                )}
                            </Box>
                            <Button
                                color="violet"
                                radius="lg"
                                loading={tossPayLoading}
                                onClick={() => requestTossPay('allinone')}
                            >
                                토스페이 테스트 결제
                            </Button>
                        </Group>
                    </Card>
                )}

                <Card padding="xl" radius="xl" withBorder>
                    <Title order={4} mb="md" style={{ color: 'var(--mantine-color-text)' }}>
                        크레딧 사용 안내
                    </Title>
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
