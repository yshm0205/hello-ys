'use client';

/**
 * 가격 페이지
 * 3단 카드: Beta 무료 | Pro 수강생 전용 (잠금) | 올인원 패스 (추천)
 * 하단: 추가 크레딧 팩
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
import { Check, X, Sparkles, Zap, Package, Lock } from 'lucide-react';
import { Link } from '@/i18n/routing';

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

          {/* ── 3단 플랜 카드 ── */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {/* Beta 무료 */}
            <Card
              padding="xl" radius="xl"
              style={{ border: '1px solid #e5e7eb', background: '#fff' }}
            >
              <Stack gap="md">
                <Group gap="sm">
                  <Box style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Sparkles size={20} />
                  </Box>
                  <Text fw={600} style={{ color: '#111827' }}>Beta 무료</Text>
                </Group>

                <Box>
                  <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                    ₩0
                  </Text>
                  <Text size="sm" c="gray.5">영원히 무료</Text>
                </Box>

                <Divider color="gray.2" />

                <List spacing={8} size="sm" center>
                  {[
                    '월 30 크레딧',
                    '스크립트 3회 생성 (9개)',
                    '기본 니치 템플릿',
                    '보관함 저장',
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f}
                    </List.Item>
                  ))}
                  {[
                    '강의 59강',
                    '채널 분석 피드백',
                    'Pro 전용 기능',
                  ].map((f, i) => (
                    <List.Item key={`m-${i}`} icon={
                      <ThemeIcon size={20} radius="xl" color="gray" variant="light">
                        <X size={12} />
                      </ThemeIcon>
                    } style={{ color: '#9ca3af' }}>
                      {f}
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link} href="/login"
                  variant="outline" color="violet" radius="lg" fullWidth
                  style={{ height: 48, fontSize: '16px' }}
                >
                  무료로 시작하기
                </Button>
              </Stack>
            </Card>

            {/* Pro 구독 — 수강생 전용 */}
            <Card
              padding="xl" radius="xl"
              style={{
                border: '1px solid #e5e7eb',
                background: '#fafafa',
                position: 'relative',
                overflow: 'visible',
              }}
            >
              <Badge
                style={{
                  position: 'absolute', top: -12, left: '50%',
                  transform: 'translateX(-50%)', zIndex: 10,
                }}
                size="lg" color="dark" variant="filled"
                leftSection={<Lock size={12} />}
              >
                수강생 전용
              </Badge>

              <Stack gap="md" mt={8}>
                <Group gap="sm">
                  <Box style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Zap size={20} />
                  </Box>
                  <Text fw={600} style={{ color: '#111827' }}>Pro</Text>
                </Group>

                <Box>
                  <Group gap="xs" align="baseline">
                    <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                      ₩39,900
                    </Text>
                    <Text size="sm" c="gray.5">/ 월</Text>
                  </Group>
                  <Text size="sm" c="gray.5">올인원 패스 수강생 전용 플랜</Text>
                </Box>

                <Divider color="gray.2" />

                <List spacing={8} size="sm" center>
                  {[
                    '월 500 크레딧',
                    '스크립트 50회 생성 (150개)',
                    '모든 니치 템플릿',
                    '리서치 + 출처 링크',
                    '리라이트 / 톤 변경',
                    '보관함 무제한',
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f}
                    </List.Item>
                  ))}
                </List>

                <Box style={{
                  background: '#f3f4f6', borderRadius: 12,
                  padding: '12px 16px', textAlign: 'center',
                }}>
                  <Group gap={6} justify="center">
                    <Lock size={14} color="#6b7280" />
                    <Text size="sm" fw={500} c="gray.6">
                      올인원 패스 수강생만 이용 가능
                    </Text>
                  </Group>
                </Box>
              </Stack>
            </Card>

            {/* 올인원 패스 — 추천 */}
            <Card
              padding="xl" radius="xl"
              style={{
                border: '2px solid #8b5cf6',
                background: '#fff',
                position: 'relative',
              }}
            >
              <Badge
                style={{
                  position: 'absolute', top: -12, left: '50%',
                  transform: 'translateX(-50%)', zIndex: 10,
                }}
                size="lg" color="violet" variant="filled"
              >
                BEST
              </Badge>

              <Stack gap="md" mt={8}>
                <Group gap="sm">
                  <Box style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: 'rgba(139,92,246,0.1)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: '#8b5cf6',
                  }}>
                    <Package size={20} />
                  </Box>
                  <Text fw={600} style={{ color: '#111827' }}>올인원 패스</Text>
                </Group>

                <Box>
                  <Text style={{
                    fontSize: '16px', color: '#9ca3af',
                    textDecoration: 'line-through',
                  }}>
                    ₩700,000
                  </Text>
                  <Group gap="xs" align="baseline">
                    <Text style={{ fontSize: '36px', fontWeight: 800, color: '#8b5cf6' }}>
                      ₩500,000
                    </Text>
                  </Group>
                  <Badge variant="light" color="green" size="sm" mt={4}>
                    얼리버드 30% OFF
                  </Badge>
                </Box>

                <Divider color="gray.2" />

                <List spacing={8} size="sm" center>
                  {[
                    '강의 59강 (기획→촬영→편집→수익화)',
                    'FlowSpot 6개월 이용',
                    '크레딧 3,000개 포함',
                    '훅 템플릿 79개 + 지속 업데이트',
                    '채널 분석 피드백 1회',
                    '6개월 후 Pro 구독 자격',
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="green" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f}
                    </List.Item>
                  ))}
                </List>

                <Button
                  component={Link} href="/login"
                  radius="lg" fullWidth
                  style={{
                    height: 48, fontSize: '16px',
                    background: '#8b5cf6', border: 'none',
                  }}
                >
                  올인원 패스 시작하기
                </Button>
              </Stack>
            </Card>
          </SimpleGrid>

          {/* ── FAQ 링크 ── */}
          <Stack align="center" gap="md">
            <Text size="sm" c="gray.6">궁금한 점이 있으신가요?</Text>
            <Button component="a" href="/#faq" variant="subtle" color="violet">
              자주 묻는 질문 보기
            </Button>
          </Stack>

          {/* ── 사업자 정보 ── */}
          <Divider color="gray.2" />
          <Stack align="center" gap={4}>
            <Text size="xs" c="gray.4">
              플로우스팟 | 대표: 이하민, 김예성 | 사업자등록번호: 693-07-02115
            </Text>
            <Text size="xs" c="gray.4">
              통신판매업 신고번호: 2022-충남천안-0095 | 전화: 070-8027-2849 | 이메일: hmys0205hmys@gmail.com
            </Text>
            <Text size="xs" c="gray.4">
              주소: 충남 천안시 서북구 두정동 1225, 401호
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
