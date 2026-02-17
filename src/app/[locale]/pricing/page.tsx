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
import { Check, Lock } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function PricingPage() {
  return (
    <Box style={{ background: '#fff', minHeight: '100vh' }}>
      <Container size="xl" py={80}>
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
                <Box>
                  <Text fw={700} size="xl" style={{ color: '#111827' }}>Beta</Text>
                  <Text size="sm" c="gray.5">
                    FlowSpot을 무료로 체험해보세요
                  </Text>
                </Box>

                <Box>
                  <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                    ₩0
                  </Text>
                  <Text size="sm" c="gray.5">무료</Text>
                </Box>

                <Divider color="gray.2" />

                <Text size="xs" c="gray.5">포함:</Text>
                <List spacing={8} size="sm" center>
                  {[
                    '검증된 프레임워크 기반 AI 스크립트 생성',
                    '소재에 맞는 실시간 리서치',
                    '생성한 스크립트 보관함 저장',
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
                <Box>
                  <Text fw={700} size="xl" style={{ color: '#111827' }}>Pro</Text>
                  <Text size="sm" c="gray.5">
                    올인원 패스 수강생을 위한 전용 플랜
                  </Text>
                </Box>

                <Box>
                  <Group gap="xs" align="baseline">
                    <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                      ₩39,900
                    </Text>
                    <Text size="sm" c="gray.5">/ 월</Text>
                  </Group>
                </Box>

                <Divider color="gray.2" />

                <Text size="xs" c="gray.5">Beta의 모든 기능 포함, 그리고:</Text>
                <List spacing={8} size="sm" center>
                  {[
                    '원하는 말투로 스크립트 리라이트',
                    '모든 니치 템플릿 사용',
                    '보관함 무제한 저장',
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f}
                    </List.Item>
                  ))}
                  <List.Item icon={
                    <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                      <Check size={12} />
                    </ThemeIcon>
                  } style={{ color: '#374151' }}>
                    <Text fw={700} size="sm">월 500 크레딧</Text>
                  </List.Item>
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
                overflow: 'visible',
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
                <Box>
                  <Text fw={700} size="xl" style={{ color: '#111827' }}>올인원 패스</Text>
                  <Text size="sm" c="gray.5">
                    강의부터 AI 스크립트까지, 쇼츠 성장에 필요한 전부
                  </Text>
                </Box>

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

                <Text size="xs" c="gray.5">Pro의 모든 기능 포함, 그리고:</Text>
                <List spacing={8} size="sm" center>
                  {[
                    '쇼츠 성장 강의 59강 (기획→촬영→편집→수익화)',
                    'Pro 6개월 제공',
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
