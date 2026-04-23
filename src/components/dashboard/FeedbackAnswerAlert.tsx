'use client';

import { useEffect, useState } from 'react';
import { Card, Group, Text, Button, ThemeIcon, Stack } from '@mantine/core';
import { MessageSquareText, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

const TYPE_LABELS: Record<string, string> = {
    channel: '채널 방향',
    topic: '주제 기획',
    script: '스크립트',
    other: '기타',
};

interface UnreadItem {
    id: string;
    title: string;
    requestType: string;
    respondedAt: string | null;
}

export function FeedbackAnswerAlert() {
    const [items, setItems] = useState<UnreadItem[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/feedback-requests/unread', {
                    cache: 'no-store',
                });
                if (!res.ok) return;
                const data = await res.json();
                if (cancelled) return;
                setItems(Array.isArray(data?.items) ? data.items : []);
            } catch {
                // ignore
            } finally {
                if (!cancelled) setLoaded(true);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!loaded || items.length === 0) return null;

    return (
        <Card
            padding="lg"
            radius="xl"
            style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                border: '1px solid #86efac',
            }}
        >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group align="flex-start" wrap="nowrap" gap="md" style={{ flex: 1 }}>
                    <ThemeIcon size="xl" radius="xl" color="green" variant="light">
                        <MessageSquareText size={22} />
                    </ThemeIcon>
                    <Stack gap={6} style={{ flex: 1 }}>
                        <Text fw={700} size="lg" c="green.8">
                            💬 피드백 답변 {items.length}개가 도착했어요
                        </Text>
                        <Stack gap={2}>
                            {items.slice(0, 3).map((item) => (
                                <Text key={item.id} size="sm" c="gray.7" lineClamp={1}>
                                    · [{TYPE_LABELS[item.requestType] || item.requestType}] {item.title}
                                </Text>
                            ))}
                            {items.length > 3 && (
                                <Text size="xs" c="gray.6">
                                    외 {items.length - 3}건
                                </Text>
                            )}
                        </Stack>
                    </Stack>
                </Group>
                <Button
                    component={Link}
                    href="/dashboard/feedback"
                    color="green"
                    radius="lg"
                    rightSection={<ArrowRight size={16} />}
                >
                    확인하러 가기
                </Button>
            </Group>
        </Card>
    );
}
