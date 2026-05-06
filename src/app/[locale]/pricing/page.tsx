'use client';

/**
 * 가격 페이지
 * 1상품 판매 구조: 올인원 패스 + 추가 토큰 + 월 구독 예정
 */

import {
  Alert,
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
import { Check, Coins, Crown, Lock } from 'lucide-react';
import { MarketingTracker } from '@/components/analytics/MarketingTracker';
import { Link } from '@/i18n/routing';
import {
  CREDIT_TOPUP_PACKS,
  MONTHLY_SUBSCRIPTION_PREVIEW,
  TOSSPAY_PLAN_CONFIG,
} from '@/lib/plans/config';

export default function PricingPage() {
  const program = TOSSPAY_PLAN_CONFIG.allinone;
  const monthly = MONTHLY_SUBSCRIPTION_PREVIEW;

  return (
    <Box style={{ background: '#fff', minHeight: '100vh' }}>
      <MarketingTracker pageType="pricing" />
      <Container size="xl" py={80}>
        <Stack gap={48}>
          {/* ── 헤더 ── */}
          <Stack align="center" gap="lg">
            <Badge size="lg" variant="light" color="violet" style={{ padding: '10px 20px' }}>
              Pricing
            </Badge>
            <Title order={1} ta="center" style={{ fontSize: '40px', color: '#111827' }}>
              프로그램 신청
            </Title>
            <Text size="lg" c="gray.6" ta="center" maw={500}>
              첫 결제는 올인원 패스 1개입니다. 부족한 크레딧은 추가 토큰으로 충전합니다.
            </Text>
          </Stack>

          <Alert color="violet" radius="xl" variant="light" title="현재 판매 구조">
            첫 결제는 <strong>올인원 패스</strong>입니다. 4개월 프로그램 이용권과 함께 매달 400cr씩 4회 지급됩니다.
            추가 토큰 구매는 로그인 후 대시보드에서 가능합니다.
          </Alert>

          {/* ── 메인 카드 ── */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
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
                메인 상품
              </Badge>

              <Stack gap="md">
                <Box>
                  <Group gap="xs" mb={4}>
                    <Crown size={18} color="#8b5cf6" />
                    <Text fw={700} size="xl" style={{ color: '#111827' }}>올인원 패스</Text>
                  </Group>
                  <Text size="sm" c="gray.5">
                    강의 4개월 + 프로그램 4개월 + 매달 400cr 지급
                  </Text>
                </Box>

                <Box>
                  <Text style={{
                    fontSize: '16px', color: '#9ca3af',
                    textDecoration: 'line-through',
                  }}>
                    ₩{program.listAmount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                    ₩{program.amount.toLocaleString()}
                  </Text>
                  <Text size="sm" c="gray.5">
                    결제 직후 400cr + 이후 매달 400cr씩 총 4회
                  </Text>
                </Box>

                <Divider color="gray.2" />

                <Text size="xs" c="gray.5">포함:</Text>
                <List spacing={8} size="sm" center>
                  {[
                    '강의 4개월 이용권',
                    '프로그램 4개월 참여',
                    '매달 400cr × 4회 지급',
                    '로그인 후 대시보드에서 바로 결제 진행',
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
                  component={Link} href="/checkout/allinone?intent=pay"
                  radius="lg" fullWidth
                  style={{
                    height: 48, fontSize: '16px',
                    background: '#8b5cf6', border: 'none',
                  }}
                >
                  로그인 후 신청하기
                </Button>
              </Stack>
            </Card>

            <Card
              padding="xl" radius="xl"
              style={{ border: '1px solid #e5e7eb', background: '#fff' }}
            >
              <Stack gap="md">
                <Box>
                  <Group gap="xs" mb={4}>
                    <Coins size={18} color="#8b5cf6" />
                    <Text fw={700} size="xl" style={{ color: '#111827' }}>추가 토큰 구매</Text>
                  </Group>
                  <Text size="sm" c="gray.5">
                    기본 제공 크레딧이 부족할 때만 보충하는 추가 구매 상품입니다.
                  </Text>
                </Box>

                <Divider color="gray.2" />

                <List spacing={8} size="sm" center>
                  {CREDIT_TOPUP_PACKS.map((pack) => (
                    <List.Item key={pack.credits} icon={
                      <ThemeIcon size={20} radius="xl" color="violet" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {pack.credits.toLocaleString()}cr · ₩{pack.amount.toLocaleString()}
                    </List.Item>
                  ))}
                </List>

                <Text size="xs" c="gray.5">
                  추가 토큰은 대시보드에서만 구매 가능합니다. 기본 제공분보다 높은 단가로 운영됩니다.
                </Text>
              </Stack>
            </Card>

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
                오픈 예정
              </Badge>

              <Stack gap="md" mt={8}>
                <Box>
                  <Text fw={700} size="xl" style={{ color: '#111827' }}>{monthly.name}</Text>
                  <Text size="sm" c="gray.5">
                    4개월 프로그램 종료 후 계속 사용할 수 있는 유지형 상품입니다.
                  </Text>
                </Box>

                <Box>
                  <Group gap="xs" align="baseline">
                    <Text style={{ fontSize: '36px', fontWeight: 800, color: '#111827' }}>
                      ₩{monthly.amount.toLocaleString()}
                    </Text>
                    <Text size="sm" c="gray.5">/ 월 예정</Text>
                  </Group>
                  <Text size="sm" c="gray.5">매달 {monthly.monthlyCredits}cr 포함</Text>
                </Box>

                <Divider color="gray.2" />

                <Text size="xs" c="gray.5">예정 구성:</Text>
                <List spacing={8} size="sm" center>
                  {[
                    'FlowSpot 계속 이용',
                    '매달 400cr 자동 지급',
                    '올인원 종료 후 이어서 사용 가능',
                  ].map((f, i) => (
                    <List.Item key={i} icon={
                      <ThemeIcon size={20} radius="xl" color="gray" variant="light">
                        <Check size={12} />
                      </ThemeIcon>
                    } style={{ color: '#374151' }}>
                      {f}
                    </List.Item>
                  ))}
                </List>
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
