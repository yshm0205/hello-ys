'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Group,
  Burger,
  Drawer,
  Stack,
  Divider,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Bot } from 'lucide-react';

import { Link, useRouter } from '@/i18n/routing';
import { createClient } from '@/utils/supabase/client';

import { AuthAwareButton } from './AuthAwareButton';

const navLinks = [
  { label: '사용 방법', href: '#how-it-works' },
  { label: '가격', href: '/pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function LandingHeader() {
  const [opened, { toggle, close }] = useDisclosure(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    close();
    router.refresh();
  }

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
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Group gap="sm">
              <Bot size={28} color="#8b5cf6" />
              <Text size="xl" fw={700} style={{ color: '#8b5cf6' }}>
                FlowSpot
              </Text>
            </Group>
          </Link>

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

          <Group gap="md" visibleFrom="sm">
            {isAuthenticated ? (
              <Button
                radius="lg"
                onClick={handleSignOut}
                style={{
                  background: '#8b5cf6',
                  border: 'none',
                }}
              >
                로그아웃
              </Button>
            ) : (
              <AuthAwareButton
                authenticatedHref="/dashboard"
                unauthenticatedHref="/login"
                unpaidAuthenticatedHref="/checkout/allinone"
                radius="lg"
                style={{
                  background: '#8b5cf6',
                  border: 'none',
                }}
              >
                로그인
              </AuthAwareButton>
            )}
          </Group>

          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            color="#374151"
            size="sm"
          />
        </Group>
      </Container>

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

          {isAuthenticated ? (
            <Button
              fullWidth
              size="lg"
              radius="lg"
              onClick={handleSignOut}
              style={{
                background: '#8b5cf6',
                border: 'none',
              }}
            >
              로그아웃
            </Button>
          ) : (
            <AuthAwareButton
              authenticatedHref="/dashboard"
              unauthenticatedHref="/login"
              unpaidAuthenticatedHref="/checkout/allinone"
              fullWidth
              size="lg"
              radius="lg"
              onClick={close}
              style={{
                background: '#8b5cf6',
                border: 'none',
              }}
            >
              로그인
            </AuthAwareButton>
          )}
        </Stack>
      </Drawer>
    </Box>
  );
}
