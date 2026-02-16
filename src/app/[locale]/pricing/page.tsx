'use client';

/**
 * 가격 페이지
 * 상단: 월 구독 3개 (취소선) → 하단: 번들 (추천) + 토큰 팩
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
import { Check, X, Sparkles, Zap, Crown, Package, ArrowDown } from 'lucide-react';
import { Link } from '@/i18n/routing';

const subscriptionPlans = [
  {
    name: 'Free',
    price: 0,
    icon: <Sparkles size={20} />,
    features: ['월 3회 생성', '기본 템플릿', '보관함 제한'],
    missing: ['강의 59강', '채널 피드백', '우선 처리'],
  },
  {
    name: 'Pro',
    price: 19000,
    icon: <Zap size={20} />,
    features: ['월 30회 생성', '모든 템플릿', '히스토리 3개월'],
    missing: ['강의 59강', '채널 피드백', '터진 영상 템플릿'],
  },
  {
    name: 'Team',
    price: 49000,
    icon: <Crown size={20} />,
    features: ['무제한 생성', '커스텀 템플릿', '전용 지원'],
    missing: ['강의 59강', '채널 피드백', '터진 영상 템플릿'],
  },
];

export default function PricingPage() {
  return (
    <Box style={{ background: '#fff', minHeight: '100vh' }}>
      <Container size="lg" py={80}>
        <Stack gap={48}>
          {/* ── 헤더 ── */}
          <Stack align="center" gap="lg">
            <Badge size="lg" variant="light" color="violet" style={{ padding: '10px 20px' }}>
              Pricing
            </Badge>
            <Title order={1} ta="center" style={{ fontSize: '40px', color: '#111827' }}>
              요금제
            </Title>
            <Text size="lg" c="gray.6" ta="center" maw={500}>
              숨겨진 비용 없이, 필요한 만큼만
            </Text>
          </Stack>

          {/* ── 섹션 1: 월 구독 (취소선) ── */}
          <Box>
            <Group justify="center" gap="xs" mb="lg">
              <Text fw={600} size="lg" style={{ color: '#9ca3af' }}>
                FlowSpot 월 구독으로 따로 사면?
              </Text>
            </Group>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
              {subscriptionPlans.map((plan) => (
                <Card
                  key={plan.name}
                  padding="lg" radius="xl"
                  style={{
                    border: '1px solid #e5e7eb',
                    background: '#fafafa',
                    opacity: 0.7,
                  }}
                >
                  <Stack gap="md">
                    <Group gap="sm">
                      <Box style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: '#f3f4f6', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#9ca3af',
                      }}>
                        {plan.icon}
                      </Box>
                      <Text fw={600} style={{ color: '#9ca3af' }}>{plan.name}</Text>
                    </Group>

                    {/* 가격 취소선 */}
                    <Box>
                      <Text style={{
                        fontSize: '28px', fontWeight: 700,
                        color: '#d1d5db', textDecoration: 'line-through',
                      }}>
                        {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                      </Text>
                      {plan.price > 0 && (
                        <Text size="xs" c="gray.4">
                          / 월 — 1년이면 ₩{(plan.price * 12).toLocaleString()}
                        </Text>
                      )}
                    </Box>

                    <Divider color="gray.2" />

                    {/* 포함 */}
                    <List spacing={6} size="sm" center>
                      {plan.features.map((f, i) => (
                        <List.Item key={i} icon={
                          <ThemeIcon size={18} radius="xl" color="gray" variant="light">
                            <Check size={11} />
                          </ThemeIcon>
                        } style={{ color: '#9ca3af' }}>
                          {f}
                        </List.Item>
                      ))}
                      {plan.missing.map((f, i) => (
                        <List.Item key={`m-${i}`} icon={
                          <ThemeIcon size={18} radius="xl" color="red" variant="light">
                            <X size={11} />
                          </ThemeIcon>
                        } style={{ color: '#d1d5db' }}>
                          {f}
                        </List.Item>
                      ))}
                    </List>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* ── 화살표 전환 ── */}
          <Stack align="center" gap="xs">
            <ArrowDown size={28} color="#8b5cf6" />
            <Text fw={700} size="xl" style={{ color: '#8b5cf6' }}>
              번들 하나면 전부 포함
            </Text>
          </Stack>

          {/* ── 섹션 2: 마스터 번들 ── */}
          <Box style={{ position: 'relative', paddingTop: 16 }}>
            <Badge
              style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
              size="lg" color="violet" variant="filled"
            >
              BEST — 64% 할인
            </Badge>
            <Card
              padding="xl" radius="xl"
              style={{
                border: '2px solid #8b5cf6',
                background: '#fff',
              }}
            >

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mt="md">
              {/* 왼쪽: 설명 */}
              <Stack gap="lg">
                <Group gap="md">
                  <Box style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Package size={28} />
                  </Box>
                  <Box>
                    <Title order={3} style={{ color: '#111827' }}>마스터 번들</Title>
                    <Text size="sm" c="gray.6">강의 + FlowSpot + 크레딧 — 올인원</Text>
                  </Box>
                </Group>

                <List spacing="sm" size="sm" center>
                  {[
                    '강의 59강 (기획 → 촬영 → 편집 → 수익화)',
                    'FlowSpot 1년 무제한 이용',
                    '크레딧 300개 포함 (스크립트 300회)',
                    '훅 템플릿 79개 + 지속 업데이트',
                    '채널 분석 피드백 1회',
                    '터진 영상 템플릿 보너스',
                  ].map((text, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={22} radius="xl" color="green" variant="light">
                        <Check size={13} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {text}
                    </List.Item>
                  ))}
                </List>
              </Stack>

              {/* 오른쪽: 가격 + CTA */}
              <Stack gap="lg" justify="center" align="center">
                <Box ta="center">
                  <Text size="sm" c="gray.5" mb={4}>총 가치</Text>
                  <Text style={{ fontSize: '18px', color: '#9ca3af', textDecoration: 'line-through' }}>
                    ₩1,390,000
                  </Text>
                </Box>
                <Box ta="center">
                  <Text style={{ fontSize: '16px', color: '#9ca3af', textDecoration: 'line-through' }}>
                    정가 ₩700,000
                  </Text>
                  <Text style={{ fontSize: '48px', fontWeight: 800, color: '#8b5cf6', lineHeight: 1.1 }}>
                    ₩500,000
                  </Text>
                  <Badge variant="light" color="green" size="md" mt={8}>
                    얼리버드 특가 — 30% OFF
                  </Badge>
                </Box>

                {/* 개별 구매 비교 */}
                <Card padding="md" radius="md" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', width: '100%' }}>
                  <Stack gap={4}>
                    <Group justify="space-between">
                      <Text size="xs" c="gray.5">강의 59강</Text>
                      <Text size="xs" c="gray.5" style={{ textDecoration: 'line-through' }}>₩590,000</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="gray.5">FlowSpot Pro 1년</Text>
                      <Text size="xs" c="gray.5" style={{ textDecoration: 'line-through' }}>₩228,000</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="xs" c="gray.5">크레딧 300개</Text>
                      <Text size="xs" c="gray.5" style={{ textDecoration: 'line-through' }}>₩99,000</Text>
                    </Group>
                    <Divider my={4} />
                    <Group justify="space-between">
                      <Text size="sm" fw={600} style={{ color: '#8b5cf6' }}>번들 가격</Text>
                      <Text size="sm" fw={700} style={{ color: '#8b5cf6' }}>₩500,000</Text>
                    </Group>
                  </Stack>
                </Card>

                <Button
                  component={Link}
                  href="/login"
                  size="xl" radius="lg" fullWidth
                  style={{ background: '#8b5cf6', border: 'none', fontSize: '18px', height: 56 }}
                >
                  번들 시작하기
                </Button>
              </Stack>
            </SimpleGrid>
          </Card>
          </Box>

          {/* ── FAQ 링크 ── */}
          <Stack align="center" gap="md">
            <Text size="sm" c="gray.6">궁금한 점이 있으신가요?</Text>
            <Button component="a" href="/#faq" variant="subtle" color="violet">
              자주 묻는 질문 보기
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
