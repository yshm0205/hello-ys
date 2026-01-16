'use client';

/**
 * 랜딩 페이지 네비게이션 헤더
 * Mantine UI
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
import { Bot, Menu } from 'lucide-react';
import { Link } from '@/i18n/routing';

const navLinks = [
    { label: '기능', href: '#features' },
    { label: '사용 방법', href: '#how-it-works' },
    { label: '가격', href: '/pricing' },
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
                background: 'rgba(10, 10, 20, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
        >
            <Container size="lg" py="md">
                <Group justify="space-between">
                    {/* 로고 */}
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Group gap="sm">
                            <Bot size={28} color="#a78bfa" />
                            <Text
                                size="xl"
                                fw={700}
                                style={{
                                    background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                }}
                            >
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
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    textDecoration: 'none',
                                    transition: 'color 0.2s',
                                }}
                                className="nav-link-hover"
                            >
                                {link.label}
                            </Text>
                        ))}
                    </Group>

                    {/* 데스크톱 CTA 버튼 */}
                    <Group gap="md" visibleFrom="sm">
                        <Button
                            component={Link}
                            href="/login"
                            variant="subtle"
                            color="gray"
                            style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                            로그인
                        </Button>
                        <Button
                            component={Link}
                            href="/dashboard"
                            radius="lg"
                            style={{
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
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
                        color="white"
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
                        background: '#0a0a14',
                        height: '100%',
                    },
                    header: {
                        background: '#0a0a14',
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
                                color: 'rgba(255, 255, 255, 0.8)',
                                textDecoration: 'none',
                            }}
                            onClick={close}
                        >
                            {link.label}
                        </Text>
                    ))}

                    <Divider color="dark.5" my="sm" />

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
                            background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
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
