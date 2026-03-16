'use client';

/**
 * 랜딩 페이지 네비게이션 헤더 — 화이트 테마
 */

import {
    Box,
    Container,
    Group,
    Button,
    Text,
    Burger,
    Drawer,
    Stack,
    Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Bot } from 'lucide-react';
import { Link } from '@/i18n/routing';

const navLinks = [
    { label: '사용 방법', href: '#how-it-works' },
    { label: '가격', href: '/pricing' },
    { label: 'FAQ', href: '#faq' },
];

export function LandingHeader() {
    const [opened, { toggle, close }] = useDisclosure(false);

    return (
        <Box
            component="header"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #e5e7eb',
            }}
        >
            <Container size="lg" py="md">
                <Group justify="space-between">
                    {/* 로고 */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Group gap="sm">
                            <Bot size={28} color="#8b5cf6" />
                            <Text size="xl" fw={700} style={{ color: '#8b5cf6' }}>
                                FlowSpot
                            </Text>
                        </Group>
                    </Link>

                    {/* 데스크톱 네비게이션 */}
                    <Group gap="xl" visibleFrom="sm">
                        {navLinks.map((link) => (
                            <Text
                                key={link.label}
                                component={Link}
                                href={link.href}
                                size="sm"
                                fw={500}
                                style={{
                                    color: '#4b5563',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                            >
                                {link.label}
                            </Text>
                        ))}
                    </Group>

                    {/* 데스크톱 CTA */}
                    <Group gap="md" visibleFrom="sm">
                        <Button
                            component={Link}
                            href="/login"
                            variant="subtle"
                            color="gray"
                            style={{ color: '#4b5563' }}
                        >
                            로그인
                        </Button>
                        <Button
                            component={Link}
                            href="/dashboard"
                            radius="lg"
                            style={{
                                background: '#8b5cf6',
                                border: 'none',
                            }}
                        >
                            무료로 시작
                        </Button>
                    </Group>

                    {/* 모바일 햄버거 */}
                    <Burger
                        opened={opened}
                        onClick={toggle}
                        hiddenFrom="sm"
                        color="#374151"
                        size="sm"
                    />
                </Group>
            </Container>

            {/* 모바일 드로어 */}
            <Drawer
                opened={opened}
                onClose={close}
                size="100%"
                padding="md"
                hiddenFrom="sm"
                zIndex={200}
                styles={{
                    body: {
                        background: '#fff',
                        height: '100%',
                    },
                    header: {
                        background: '#fff',
                    },
                }}
            >
                <Stack gap="lg" mt="xl">
                    {navLinks.map((link) => (
                        <Text
                            key={link.label}
                            component={Link}
                            href={link.href}
                            size="lg"
                            fw={500}
                            style={{
                                color: '#374151',
                                textDecoration: 'none',
                            }}
                            onClick={close}
                        >
                            {link.label}
                        </Text>
                    ))}

                    <Divider color="#e5e7eb" my="sm" />

                    <Button
                        component={Link}
                        href="/login"
                        variant="outline"
                        color="gray"
                        fullWidth
                        size="lg"
                        radius="lg"
                        onClick={close}
                    >
                        로그인
                    </Button>

                    <Button
                        component={Link}
                        href="/dashboard"
                        fullWidth
                        size="lg"
                        radius="lg"
                        style={{
                            background: '#8b5cf6',
                            border: 'none',
                        }}
                        onClick={close}
                    >
                        무료로 시작하기
                    </Button>
                </Stack>
            </Drawer>
        </Box>
    );
}
