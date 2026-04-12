'use client';

import { useSearchParams } from 'next/navigation';
import { Container, Card, Stack, Title, Text, Button } from '@mantine/core';
import { XCircle, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PaymentFailPage() {
    const searchParams = useSearchParams();
    const code = searchParams.get('code') || '';
    const message = searchParams.get('message') || '결제가 취소되었거나 실패했습니다.';

    return (
        <Container size="sm" py={80}>
            <Card padding="xl" radius="xl" withBorder>
                <Stack align="center" gap="lg" py="xl">
                    <XCircle size={64} color="#ef4444" />
                    <Title order={2} ta="center" style={{ color: '#111827' }}>
                        결제 실패
                    </Title>
                    <Text c="gray.6" ta="center">{message}</Text>
                    {code && (
                        <Text size="xs" c="gray.4" ta="center">오류 코드: {code}</Text>
                    )}
                    <Button
                        component={Link} href="/dashboard/credits"
                        variant="light" color="violet" radius="lg" mt="md"
                        leftSection={<ArrowLeft size={16} />}
                    >
                        크레딧 페이지로 돌아가기
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
}
