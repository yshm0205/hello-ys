'use client';

/**
 * 대시보드 레이아웃 - Mantine AppShell
 * 사이드바 네비게이션 + 헤더
 */

import { createContext, useContext, useState, type MouseEvent, type ReactNode } from 'react';
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
    FolderOpen,
    Settings,
    LogOut,
    ChevronDown,
    LayoutDashboard,
    BarChart3,
    Zap,
    BookOpen,
    Loader2,
    Trophy,
} from 'lucide-react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import type { AdminAccessLevel } from '@/lib/admin/access';

interface DashboardLayoutProps {
    children: ReactNode;
    user?: { email?: string };
    adminAccessLevel?: AdminAccessLevel;
    initialCreditInfo?: {
        credits: number;
        plan_type: string;
        expires_at: string | null;
        monthly_credit_amount?: number | null;
        monthly_credit_total_cycles?: number | null;
        monthly_credit_granted_cycles?: number | null;
        next_credit_at?: string | null;
    } | null;
}

interface DashboardShellContextValue {
    creditInfo: {
        credits: number;
        plan_type: string;
        expires_at: string | null;
        monthly_credit_amount?: number | null;
        monthly_credit_total_cycles?: number | null;
        monthly_credit_granted_cycles?: number | null;
        next_credit_at?: string | null;
    } | null;
    initialCredits: number | null;
}

const DashboardShellContext = createContext<DashboardShellContextValue>({
    creditInfo: null,
    initialCredits: null,
});

export function useDashboardShell() {
    return useContext(DashboardShellContext);
}

const navItems = [
    {
        label: '홈',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: '통계, 빠른 액션',
    },
    {
        label: '스크립트 생성',
        href: '/dashboard/batch',
        icon: Zap,
        description: '소재 → 3스크립트 자동 생성',
    },
    {
        label: '보관함',
        href: '/dashboard/archive',
        icon: FolderOpen,
        description: '이전 스크립트 확인',
    },
    {
        label: '강의실',
        href: '/dashboard/lectures',
        icon: BookOpen,
        description: '단계별 학습 + 실습',
    },
    {
        label: '챌린지',
        href: '/dashboard/challenge',
        icon: Trophy,
        description: '3일 미션 제출',
    },
    {
        label: 'HOT 리스트',
        href: '/dashboard/hot-list',
        icon: BarChart3,
        description: '이달의 추천 채널',
    },
];

export function DashboardLayout({
    children,
    user,
    adminAccessLevel = 'none',
    initialCreditInfo = null,
}: DashboardLayoutProps) {
    const [opened, { toggle }] = useDisclosure();
    const pathname = usePathname();
    const router = useRouter();
    const [pendingHref, setPendingHref] = useState<string | null>(null);
    const credits = initialCreditInfo?.credits ?? null;
    const canViewMarketingOverview = adminAccessLevel === 'full' || adminAccessLevel === 'marketing';
    const resolvedNavItems = canViewMarketingOverview
        ? [
              ...navItems,
              {
                  label: '운영 지표',
                  href: '/admin/overview',
                  icon: BarChart3,
                  description: '런칭 퍼널과 핵심 지표',
              },
          ]
        : navItems;

    const handleNavClick = (event: MouseEvent<HTMLElement>, href: string, isActive = false) => {
        if (
            isActive ||
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }

        event.preventDefault();
        setPendingHref(href);
        router.push(href);
        window.setTimeout(() => setPendingHref((current) => (current === href ? null : current)), 8000);
    };

    return (
        <DashboardShellContext.Provider
            value={{
                creditInfo: initialCreditInfo,
                initialCredits: credits,
            }}
        >
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
                        background: 'var(--mantine-color-body)',
                        minHeight: '100vh',
                        overflowX: 'auto',
                        maxWidth: '100vw',
                    },
                }}
            >
            {/* 헤더 */}
            <AppShell.Header
                style={{
                    background: 'var(--mantine-color-body)',
                    borderBottom: '1px solid var(--mantine-color-default-border)',
                }}
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Link href="/dashboard" prefetch={false} style={{ textDecoration: 'none' }}>
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
                    background: 'var(--mantine-color-body)',
                    borderRight: '1px solid var(--mantine-color-default-border)',
                }}
            >
                <Stack gap="xs">
                    {resolvedNavItems.map((item) => {
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname === item.href || pathname.startsWith(item.href + '/');
                        const isPending = pendingHref === item.href;
                        return (
                            <NavLink
                                key={item.href}
                                component={Link}
                                href={item.href}
                                prefetch={false}
                                onClick={(event) => handleNavClick(event, item.href, isActive)}
                                label={item.label}
                                description={item.description}
                                leftSection={<item.icon size={20} color={isActive ? '#8b5cf6' : '#6b7280'} />}
                                rightSection={isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                                disabled={Boolean(pendingHref) && !isPending}
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
                                    <Text size="sm" fw={600} style={{ color: 'var(--mantine-color-text)' }}>
                                        {credits} 크레딧
                                    </Text>
                                </Group>
                                <Text
                                    size="xs"
                                    c="violet"
                                    fw={500}
                                    component={Link}
                                    href="/dashboard/credits"
                                    prefetch={false}
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
        </DashboardShellContext.Provider>
    );
}
