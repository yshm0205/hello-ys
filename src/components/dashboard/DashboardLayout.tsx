'use client';

/**
 * 대시보드 레이아웃 - Mantine AppShell
 * 사이드바 네비게이션 + 헤더
 */

import { ReactNode } from 'react';
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
    CreditCard,
    User,
    ChevronDown,
    LayoutDashboard,
    TestTube,
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
        label: '스크립트 제작',
        href: '/dashboard/scripts',
        icon: Sparkles,
        description: 'AI로 스크립트 만들기',
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
        label: '구독 관리',
        href: '/subscription',
        icon: CreditCard,
        description: '플랜 및 결제',
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
                        <Link href="/" style={{ textDecoration: 'none' }}>
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
                            <Menu.Item leftSection={<User size={16} />} component={Link} href="/settings">
                                프로필
                            </Menu.Item>
                            <Menu.Item leftSection={<CreditCard size={16} />} component={Link} href="/subscription">
                                구독 관리
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
                        const isActive = pathname.includes(item.href);
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

                {/* 하단 로고 */}
                <Box mt="auto" pt="xl">
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
