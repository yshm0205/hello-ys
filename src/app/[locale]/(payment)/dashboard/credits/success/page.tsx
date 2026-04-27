'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Button,
    Card,
    Container,
    Group,
    Loader,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';

import { Link } from '@/i18n/routing';

type PaymentStatus = 'loading' | 'success' | 'error';

const TOSSPAY_PENDING_STATUSES = new Set(['PENDING', 'PAY_PENDING', 'IN_PROGRESS', 'PROCESSING']);

export default function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<PaymentStatus>('loading');
    const [message, setMessage] = useState('');
    const [addedCredits, setAddedCredits] = useState(0);
    const [redirectSeconds, setRedirectSeconds] = useState(5);

    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | null = null;

        async function confirmPortOnePayment(paymentId: string, attempt = 0) {
            try {
                const res = await fetch('/api/payments/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentId }),
                });

                const data = await res.json();
                if (cancelled) return;

                if (res.ok && data.success) {
                    setStatus('success');
                    setAddedCredits(data.added ?? 0);
                    setMessage(data.message || `${data.orderName || '결제'}가 완료되었습니다.`);
                    return;
                }

                if ((res.status === 202 || data.pending) && attempt < 15) {
                    setMessage('결제 완료를 반영하는 중입니다...');
                    timer = setTimeout(() => {
                        void confirmPortOnePayment(paymentId, attempt + 1);
                    }, 2000);
                    return;
                }

                setStatus('error');
                setMessage(data.error || '결제 확인에 실패했습니다.');
            } catch {
                if (cancelled) return;
                setStatus('error');
                setMessage('서버 연결에 실패했습니다.');
            }
        }

        async function confirmLegacyTossPayments(paymentKey: string, orderId: string, amount: number) {
            try {
                const res = await fetch('/api/payments/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentKey, orderId, amount }),
                });

                const data = await res.json();
                if (cancelled) return;

                if (data.success) {
                    setStatus('success');
                    setAddedCredits(data.added);
                    setMessage(`${data.added}cr 충전이 완료되었습니다. (보유: ${data.credits}cr)`);
                    return;
                }

                setStatus('error');
                setMessage(data.error || '결제 확인에 실패했습니다.');
            } catch {
                if (cancelled) return;
                setStatus('error');
                setMessage('서버 연결에 실패했습니다.');
            }
        }

        async function pollLegacyTossPayStatus(orderNo: string, attempt = 0) {
            try {
                const res = await fetch(`/api/tosspay/status?orderNo=${encodeURIComponent(orderNo)}`, {
                    cache: 'no-store',
                });
                const data = await res.json();
                if (cancelled) return;

                if (!res.ok) {
                    setStatus('error');
                    setMessage(data.error || '결제 상태를 확인하지 못했습니다.');
                    return;
                }

                if (data.status === 'DONE') {
                    setStatus('success');
                    setAddedCredits(data.addedCredits || 0);
                    setMessage(`${data.orderName || '올인원'} 결제가 완료되었습니다.`);
                    return;
                }

                if (TOSSPAY_PENDING_STATUSES.has(data.status) && attempt < 15) {
                    setMessage('결제 확인 완료를 확인하는 중입니다...');
                    timer = setTimeout(() => {
                        void pollLegacyTossPayStatus(orderNo, attempt + 1);
                    }, 2000);
                    return;
                }

                setStatus('error');
                setMessage(
                    data.status && TOSSPAY_PENDING_STATUSES.has(data.status)
                        ? '결제 확인이 지연되고 있습니다. 잠시 후 다시 확인해 주세요.'
                        : `결제가 완료되지 않았습니다. 현재 상태: ${data.status || 'UNKNOWN'}`,
                );
            } catch {
                if (cancelled) return;
                setStatus('error');
                setMessage('결제 상태를 확인하지 못했습니다.');
            }
        }

        const paymentId = searchParams.get('payment_id') || searchParams.get('paymentId');
        const code = searchParams.get('code');
        const queryMessage = searchParams.get('message');
        const paymentKey = searchParams.get('paymentKey');
        const orderId = searchParams.get('orderId');
        const amount = searchParams.get('amount');
        const orderNo = searchParams.get('orderNo');

        if (code) {
            setStatus('error');
            setMessage(queryMessage || `결제가 완료되지 않았습니다. 오류 코드: ${code}`);
        } else if (paymentId) {
            void confirmPortOnePayment(paymentId);
        } else if (paymentKey && orderId && amount) {
            void confirmLegacyTossPayments(paymentKey, orderId, Number(amount));
        } else if (orderNo) {
            void pollLegacyTossPayStatus(orderNo);
        } else {
            timer = setTimeout(() => {
                if (cancelled) return;
                setStatus('error');
                setMessage('결제 정보가 올바르지 않습니다.');
            }, 0);
        }

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [searchParams]);

    useEffect(() => {
        if (status !== 'success') {
            setRedirectSeconds(5);
            return;
        }

        const interval = setInterval(() => {
            setRedirectSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    router.push('/dashboard/lectures');
                    return 0;
                }

                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [router, status]);

    return (
        <Container size="sm" py={80}>
            <Card padding="xl" radius="xl" withBorder>
                <Stack align="center" gap="lg" py="xl">
                    {status === 'loading' && (
                        <>
                            <Loader color="violet" size="lg" />
                            <Title order={3} ta="center">
                                결제를 확인하고 있습니다...
                            </Title>
                            <Text c="gray.6" ta="center">
                                {message || '잠시만 기다려 주세요.'}
                            </Text>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle size={64} color="#22c55e" />
                            <Title order={2} ta="center" style={{ color: '#111827' }}>
                                결제 완료
                            </Title>
                            <Text size="lg" c="gray.7" ta="center">
                                {addedCredits > 0
                                    ? `${addedCredits.toLocaleString()}cr가 반영되었습니다.`
                                    : '결제가 정상적으로 완료되었습니다.'}
                            </Text>
                            <Text size="sm" c="gray.5" ta="center">
                                {message}
                            </Text>
                            <Text size="sm" fw={600} c="violet.7" ta="center">
                                {redirectSeconds > 0
                                    ? `${redirectSeconds}초 후 강의실로 자동 이동합니다.`
                                    : '강의실로 이동하는 중입니다.'}
                            </Text>
                            <Text size="xs" c="gray.5" ta="center">
                                창을 닫으셨더라도 로그인 후 왼쪽 메뉴의 강의실에서
                                바로 이어서 보실 수 있습니다.
                            </Text>
                            <Group mt="md">
                                <Button
                                    component={Link}
                                    href="/dashboard/lectures"
                                    variant="light"
                                    color="violet"
                                    radius="lg"
                                    leftSection={<ArrowLeft size={16} />}
                                >
                                    강의 보러가기
                                </Button>
                                <Button
                                    component={Link}
                                    href="/dashboard/scripts-v2"
                                    color="violet"
                                    radius="lg"
                                    style={{ background: '#8b5cf6' }}
                                >
                                    스크립트 생성하러가기
                                </Button>
                            </Group>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <AlertCircle size={64} color="#ef4444" />
                            <Title order={2} ta="center" style={{ color: '#111827' }}>
                                결제 확인 실패
                            </Title>
                            <Text c="gray.6" ta="center">
                                {message}
                            </Text>
                            <Text size="sm" c="gray.5" ta="center">
                                문제가 계속되면 hmys0205hmys@gmail.com으로 문의해 주세요.
                            </Text>
                            <Button
                                component={Link}
                                href="/"
                                variant="light"
                                color="violet"
                                radius="lg"
                                mt="md"
                                leftSection={<ArrowLeft size={16} />}
                            >
                                홈으로 돌아가기
                            </Button>
                        </>
                    )}
                </Stack>
            </Card>
        </Container>
    );
}
