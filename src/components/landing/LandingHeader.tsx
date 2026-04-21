'use client';

import {
  Box,
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

import { Link } from '@/i18n/routing';

import { AuthAwareButton } from './AuthAwareButton';

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
            <AuthAwareButton
              authenticatedHref="/dashboard"
              unauthenticatedHref="/login"
              variant="subtle"
              color="gray"
              style={{ color: '#4b5563' }}
            >
              로그인
            </AuthAwareButton>

            <AuthAwareButton
              authenticatedHref="/dashboard"
              unauthenticatedHref="/login?redirect=/dashboard"
              radius="lg"
              style={{
                background: '#8b5cf6',
                border: 'none',
              }}
            >
              무료로 시작
            </AuthAwareButton>
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

          <AuthAwareButton
            authenticatedHref="/dashboard"
            unauthenticatedHref="/login"
            variant="outline"
            color="gray"
            fullWidth
            size="lg"
            radius="lg"
            onClick={close}
          >
            로그인
          </AuthAwareButton>

          <AuthAwareButton
            authenticatedHref="/dashboard"
            unauthenticatedHref="/login?redirect=/dashboard"
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
          </AuthAwareButton>
        </Stack>
      </Drawer>
    </Box>
  );
}
