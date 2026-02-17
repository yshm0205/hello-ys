'use client';

/**
 * 대시보드 레이아웃 - Mantine AppShell
 * 사이드바 네비게이션 + 헤더
 */

import { ReactNode, useState, useEffect } from 'react';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    Text,
    Box,
    Stack,
    Avatar,
    Menu,
    Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    Bot,
    Sparkles,
    FolderOpen,
    Settings,
    LogOut,
    ChevronDown,
    LayoutDashboard,
    TestTube,
    Flame,
    Zap,
    BookOpen,
} from 'lucide-react';
import { Link, usePathname } from '@/i18n/routing';

interface DashboardLayoutProps {
    children: ReactNode;
    user?: { email?: string };
}

const navItems = [
    {
        label: '대시보드',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: '홈, 통계, 빠른 액션',
    },
    {
        label: '강의실',
        href: '/dashboard/lectures',
        icon: BookOpen,
        description: '단계별 학습 + 실습',
    },
    {
        label: '스크립트 제작',
        href: '/dashboard/scripts',
        icon: Sparkles,
        description: 'AI로 스크립트 만들기',
    },
    {
        label: '스크립트 V2',
        href: '/dashboard/scripts-v2',
        icon: Zap,
        description: '소재 → 3스크립트 자동 생성',
    },
    {
        label: '보관함',
        href: '/dashboard/archive',
        icon: FolderOpen,
        description: '히스토리 + 영상 연결',
    },
    {
        label: '성과 분석',
        href: '/dashboard/analytics',
        icon: TestTube,
        description: '스타일별 성과 비교',
    },
    {
        label: '🔥 핫 리스트',
        href: '/dashboard/hot-list',
        icon: Flame,
        description: '터지는 영상 발굴',
    },
    {
        label: '설정',
        href: '/settings',
        icon: Settings,
        description: '계정 설정',
    },
];

export function DashboardLayout({ children, user }: DashboardLayoutProps) {
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();
    const [credits, setCredits] = useState<number | null>(null);

    useEffect(() => {
        async function fetchCredits() {
            try {
                const res = await fetch('/api/credits');
                if (res.ok) {
                    const data = await res.json();
                    setCredits(data.credits);
                }
            } catch {
                // 무시
            }
        }
        fetchCredits();
    }, []);

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 280,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="lg"
            styles={{
                main: {
                    background: '#F9FAFB',
                    minHeight: '100vh',
                },
            }}
        >
            {/* 헤더 */}
            <AppShell.Header
                style={{
                    background: '#FFFFFF',
                    borderBottom: '1px solid #E5E7EB',
                }}
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                            <Group gap="sm">
                                <Bot size={28} color="#8b5cf6" />
                                <Text
                                    size="lg"
                                    fw={700}
                                    style={{
                                        background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    FlowSpot
                                </Text>
                            </Group>
                        </Link>
                    </Group>

                    {/* 유저 메뉴 */}
                    <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                            <Group gap="sm" style={{ cursor: 'pointer' }}>
                                <Avatar size="sm" radius="xl" color="violet">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </Avatar>
                                <Text size="sm" c="gray.7" visibleFrom="sm">
                                    {user?.email?.split('@')[0] || 'User'}
                                </Text>
                                <ChevronDown size={16} color="#6b7280" />
                            </Group>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item leftSection={<Settings size={16} />} component={Link} href="/settings">
                                설정
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                                leftSection={<LogOut size={16} />}
                                color="red"
                                component="a"
                                href="/api/auth/signout"
                            >
                                로그아웃
                            </Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </AppShell.Header>

            {/* 사이드바 */}
            <AppShell.Navbar
                p="md"
                style={{
                    background: '#FFFFFF',
                    borderRight: '1px solid #E5E7EB',
                }}
            >
                <Stack gap="xs">
                    {navItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <NavLink
                                key={item.href}
                                component={Link}
                                href={item.href}
                                label={item.label}
                                description={item.description}
                                leftSection={<item.icon size={20} color={isActive ? '#8b5cf6' : '#6b7280'} />}
                                active={isActive}
                                variant="light"
                                color="violet"
                                style={{
                                    borderRadius: '12px',
                                }}
                                styles={{
                                    root: {
                                        '&[dataActive]': {
                                            background: 'rgba(139, 92, 246, 0.1)',
                                        },
                                    },
                                }}
                            />
                        );
                    })}
                </Stack>

                {/* 하단: 크레딧 + 로고 */}
                <Box mt="auto" pt="xl">
                    {credits !== null && (
                        <Box
                            mb="md"
                            style={{
                                background: 'rgba(139, 92, 246, 0.06)',
                                border: '1px solid rgba(139, 92, 246, 0.15)',
                                borderRadius: 12,
                                padding: '12px 14px',
                            }}
                        >
                            <Group justify="space-between" align="center">
                                <Group gap={8}>
                                    <Zap size={16} color="#8b5cf6" />
                                    <Text size="sm" fw={600} style={{ color: '#111827' }}>
                                        {credits} 크레딧
                                    </Text>
                                </Group>
                                <Text
                                    size="xs"
                                    c="violet"
                                    fw={500}
                                    component={Link}
                                    href="/dashboard/credits"
                                    style={{ textDecoration: 'none' }}
                                >
                                    충전
                                </Text>
                            </Group>
                        </Box>
                    )}
                    <Divider mb="md" color="gray.2" />
                    <Group gap="xs">
                        <Bot size={20} color="#d1d5db" />
                        <Text size="xs" c="gray.5">
                            FlowSpot v1.0
                        </Text>
                    </Group>
                </Box>
            </AppShell.Navbar>

            {/* 메인 콘텐츠 */}
            <AppShell.Main>
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
