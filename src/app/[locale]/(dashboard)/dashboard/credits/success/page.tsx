'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Card, Stack, Title, Text, Button, Loader, Group } from '@mantine/core';
import { CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');
    const [addedCredits, setAddedCredits] = useState(0);

    useEffect(() => {
        async function confirmPayment() {
            const paymentKey = searchParams.get('paymentKey');
            const orderId = searchParams.get('orderId');
            const amount = searchParams.get('amount');

            if (!paymentKey || !orderId || !amount) {
                setStatus('error');
                setMessage('결제 정보가 올바르지 않습니다.');
                return;
            }

            try {
                const res = await fetch('/api/payments/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        paymentKey,
                        orderId,
                        amount: Number(amount),
                    }),
                });

                const data = await res.json();

                if (data.success) {
                    setStatus('success');
                    setAddedCredits(data.added);
                    setMessage(`${data.added}cr 충전 완료! (잔여: ${data.credits}cr)`);
                } else {
                    setStatus('error');
                    setMessage(data.error || '결제 승인에 실패했습니다.');
                }
            } catch {
                setStatus('error');
                setMessage('서버 연결에 실패했습니다.');
            }
        }

        confirmPayment();
    }, [searchParams]);

    return (
        <Container size="sm" py={80}>
            <Card padding="xl" radius="xl" withBorder>
                <Stack align="center" gap="lg" py="xl">
                    {status === 'loading' && (
                        <>
                            <Loader color="violet" size="lg" />
                            <Title order={3} ta="center">결제를 확인하고 있어요...</Title>
                            <Text c="gray.6" ta="center">잠시만 기다려주세요</Text>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle size={64} color="#22c55e" />
                            <Title order={2} ta="center" style={{ color: '#111827' }}>
                                충전 완료!
                            </Title>
                            <Text size="lg" c="gray.7" ta="center">
                                {addedCredits.toLocaleString()} 크레딧이 추가되었습니다
                            </Text>
                            <Text size="sm" c="gray.5" ta="center">{message}</Text>
                            <Group mt="md">
                                <Button
                                    component={Link} href="/dashboard/credits"
                                    variant="light" color="violet" radius="lg"
                                    leftSection={<ArrowLeft size={16} />}
                                >
                                    크레딧 페이지로
                                </Button>
                                <Button
                                    component={Link} href="/dashboard/scripts-v2"
                                    color="violet" radius="lg"
                                    style={{ background: '#8b5cf6' }}
                                >
                                    스크립트 만들기
                                </Button>
                            </Group>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <AlertCircle size={64} color="#ef4444" />
                            <Title order={2} ta="center" style={{ color: '#111827' }}>
                                충전 실패
                            </Title>
                            <Text c="gray.6" ta="center">{message}</Text>
                            <Text size="sm" c="gray.5" ta="center">
                                문제가 계속되면 hmys0205hmys@gmail.com으로 문의해주세요
                            </Text>
                            <Button
                                component={Link} href="/dashboard/credits"
                                variant="light" color="violet" radius="lg" mt="md"
                                leftSection={<ArrowLeft size={16} />}
                            >
                                크레딧 페이지로 돌아가기
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </Container>
    );
}
