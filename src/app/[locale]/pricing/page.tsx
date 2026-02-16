'use client';

/**
 * 가격 페이지
 * 월 구독(취소선) vs 번들(추천) vs 토큰 팩
 */

import {
  Container,
  Title,
  Text,
  Button,
  Stack,
  Card,
  SimpleGrid,
  Group,
  Badge,
  Box,
  List,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { Check, X, Zap, Package, Coins } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PricingPage() {
  return (
    <Box style={{ background: '#fff', minHeight: '100vh' }}>
      <Container size="lg" py={80}>
        <Stack gap={60}>
          {/* 헤더 */}
          <Stack align="center" gap="lg">
            <Badge size="lg" variant="light" color="violet" style={{ padding: '10px 20px' }}>
              Pricing
            </Badge>
            <Title order={1} ta="center" style={{ fontSize: '44px', color: '#111827' }}>
              SaaS만? 번들로 전부 가져가세요
            </Title>
            <Text size="lg" c="gray.6" ta="center" maw={600}>
              월 구독보다 번들이 압도적으로 이득입니다
            </Text>
          </Stack>

          {/* 3 카드 */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">

            {/* ── 1. 월 구독 (취소선) ── */}
            <Card padding="xl" radius="xl" style={{ border: '1px solid #E5E7EB', background: '#FAFAFA', position: 'relative' }}>
              <Badge
                style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
                size="md" color="gray" variant="light"
              >
                SaaS만
              </Badge>
              <Stack gap="lg">
                <Group gap="md">
                  <Box style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: '#f3f4f6', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                  }}>
                    <Zap size={24} />
                  </Box>
                  <Box>
                    <Title order={4} style={{ color: '#9ca3af' }}>월 구독</Title>
                    <Text size="sm" c="gray.5">AI 스크립트 도구만</Text>
                  </Box>
                </Group>

                {/* 가격 — 취소선 */}
                <Box>
                  <Text style={{ fontSize: '36px', fontWeight: 700, color: '#d1d5db', textDecoration: 'line-through' }}>
                    ₩19,000
                  </Text>
                  <Text size="sm" c="gray.5">/ 월</Text>
                  <Text size="xs" c="gray.4" mt={4}>
                    1년이면 ₩228,000 — 강의 미포함
                  </Text>
                </Box>

                <Divider />

                <List spacing="sm" size="sm" center>
                  {[
                    { text: '스크립트 생성 (월 30회)', included: true },
                    { text: '훅 템플릿 79개', included: true },
                    { text: '스크립트 보관함', included: true },
                    { text: '강의 59강', included: false },
                    { text: '채널 분석 피드백', included: false },
                    { text: '터진 영상 템플릿', included: false },
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color={f.included ? 'gray' : 'gray'} variant="light">
                        {f.included ? <Check size={12} /> : <X size={12} />}
                      </ThemeIcon>
                    } style={{ color: f.included ? '#9ca3af' : '#d1d5db' }}>
                      {f.text}
                    </List.Item>
                  ))}
                </List>

                <Button size="lg" radius="lg" variant="outline" color="gray" fullWidth disabled>
                  준비 중
                </Button>
              </Stack>
            </Card>

            {/* ── 2. 마스터 번들 (추천) ── */}
            <Card padding="xl" radius="xl" style={{
              border: '2px solid #8b5cf6', position: 'relative',
              background: '#fff', transform: 'scale(1.03)',
            }}>
              <Badge
                style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
                size="lg" color="violet"
              >
                BEST
              </Badge>
              <Stack gap="lg">
                <Group gap="md">
                  <Box style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Package size={24} />
                  </Box>
                  <Box>
                    <Title order={4} style={{ color: '#111827' }}>마스터 번들</Title>
                    <Text size="sm" c="gray.6">강의 + SaaS + 크레딧</Text>
                  </Box>
                </Group>

                {/* 가격 */}
                <Box>
                  <Group gap="sm" align="baseline">
                    <Text style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                      ₩700,000
                    </Text>
                  </Group>
                  <Text style={{ fontSize: '36px', fontWeight: 700, color: '#8b5cf6' }}>
                    ₩500,000
                  </Text>
                  <Text size="sm" c="gray.5">일시불 (얼리버드 특가)</Text>
                  <Badge variant="light" color="green" size="sm" mt={4}>
                    총 가치 ₩1,390,000 — 64% 할인
                  </Badge>
                </Box>

                <Divider />

                <List spacing="sm" size="sm" center>
                  {[
                    { text: '강의 59강 (기획→촬영→수익화)', included: true },
                    { text: 'AI 스크립트 도구 1년 무제한', included: true },
                    { text: '크레딧 300개 포함', included: true },
                    { text: '훅 템플릿 79개 + 업데이트', included: true },
                    { text: '채널 분석 피드백', included: true },
                    { text: '터진 영상 템플릿 보너스', included: true },
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="green" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f.text}
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link}
                  href="/login"
                  size="lg" radius="lg" fullWidth
                  style={{ background: '#8b5cf6', border: 'none' }}
                >
                  번들 시작하기
                </Button>
              </Stack>
            </Card>

            {/* ── 3. 토큰 팩 ── */}
            <Card padding="xl" radius="xl" style={{ border: '1px solid #E5E7EB', background: '#fff', position: 'relative' }}>
              <Badge
                style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}
                size="md" color="violet" variant="light"
              >
                추가 구매
              </Badge>
              <Stack gap="lg">
                <Group gap="md">
                  <Box style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Coins size={24} />
                  </Box>
                  <Box>
                    <Title order={4} style={{ color: '#111827' }}>토큰 팩</Title>
                    <Text size="sm" c="gray.6">크레딧 소진 시 추가 구매</Text>
                  </Box>
                </Group>

                {/* 토큰 팩 2가지 */}
                <Stack gap="md">
                  <Card padding="md" radius="md" withBorder>
                    <Group justify="space-between">
                      <Box>
                        <Text fw={600} style={{ color: '#111827' }}>30 크레딧</Text>
                        <Text size="xs" c="gray.5">스크립트 약 30회</Text>
                      </Box>
                      <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩9,900</Text>
                    </Group>
                  </Card>
                  <Card padding="md" radius="md" style={{ border: '2px solid #8b5cf6' }}>
                    <Group justify="space-between">
                      <Box>
                        <Group gap="xs">
                          <Text fw={600} style={{ color: '#111827' }}>100 크레딧</Text>
                          <Badge size="xs" color="green" variant="light">인기</Badge>
                        </Group>
                        <Text size="xs" c="gray.5">스크립트 약 100회</Text>
                      </Box>
                      <Box ta="right">
                        <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩29,900</Text>
                        <Text size="xs" c="green">개당 ₩299</Text>
                      </Box>
                    </Group>
                  </Card>
                </Stack>

                <Divider />

                <List spacing="sm" size="sm" center>
                  {[
                    { text: '구매 즉시 충전', included: true },
                    { text: '유효기간 없음', included: true },
                    { text: '번들 고객 전용', included: true },
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="green" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f.text}
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link}
                  href="/dashboard"
                  size="lg" radius="lg" variant="light" color="violet" fullWidth
                >
                  대시보드에서 구매
                </Button>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* 비교 요약 */}
          <Card padding="xl" radius="xl" style={{ border: '1px solid #e5e7eb', background: '#faf5ff' }}>
            <Stack gap="md" align="center">
              <Title order={4} style={{ color: '#374151' }}>왜 번들이 압도적으로 이득인가요?</Title>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" style={{ width: '100%' }}>
                <Box ta="center">
                  <Text size="sm" c="gray.5">강의만 따로</Text>
                  <Text fw={700} size="xl" style={{ color: '#9ca3af', textDecoration: 'line-through' }}>₩590,000</Text>
                </Box>
                <Box ta="center">
                  <Text size="sm" c="gray.5">SaaS 1년 구독</Text>
                  <Text fw={700} size="xl" style={{ color: '#9ca3af', textDecoration: 'line-through' }}>₩228,000</Text>
                </Box>
                <Box ta="center">
                  <Text size="sm" c="violet">번들로 전부</Text>
                  <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>₩500,000</Text>
                </Box>
              </SimpleGrid>
            </Stack>
          </Card>

          {/* FAQ 링크 */}
          <Stack align="center" gap="md">
            <Text size="sm" c="gray.6">궁금한 점이 있으신가요?</Text>
            <Button component={Link} href="/support" variant="subtle" color="violet">
              자주 묻는 질문 보기
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
