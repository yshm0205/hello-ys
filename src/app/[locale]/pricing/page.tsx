'use client';

/**
 * 가격 페이지
 * 3개 플랜 비교, Mantine UI
 */

import { useState } from 'react';
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
  Switch,
  List,
  ThemeIcon,
  Divider,
} from '@mantine/core';
import { Check, X, Sparkles, Zap, Crown } from 'lucide-react';
import { Link } from '@/i18n/routing';

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { text: string; included: boolean }[];
  popular?: boolean;
  icon: React.ReactNode;
  color: string;
  buttonText: string;
  buttonVariant: 'filled' | 'outline' | 'light';
}

const plans: Plan[] = [
  {
    name: 'Free',
    description: '가볍게 시작하기',
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: <Sparkles size={24} />,
    color: '#6b7280',
    buttonText: '무료로 시작',
    buttonVariant: 'outline',
    features: [
      { text: '월 3회 스크립트 생성', included: true },
      { text: '기본 훅 템플릿', included: true },
      { text: '3개 옵션 제공', included: true },
      { text: '우선 처리', included: false },
      { text: '히스토리 저장', included: false },
      { text: '이메일 지원', included: false },
    ],
  },
  {
    name: 'Pro',
    description: '콘텐츠 크리에이터를 위한',
    monthlyPrice: 19000,
    yearlyPrice: 15000,
    icon: <Zap size={24} />,
    color: '#8b5cf6',
    buttonText: 'Pro 시작하기',
    buttonVariant: 'filled',
    popular: true,
    features: [
      { text: '무제한 스크립트 생성', included: true },
      { text: '모든 훅 템플릿 (200개)', included: true },
      { text: '3개 옵션 제공', included: true },
      { text: '우선 처리 (빠른 생성)', included: true },
      { text: '히스토리 저장 (3개월)', included: true },
      { text: '이메일 지원', included: true },
    ],
  },
  {
    name: 'Team',
    description: '팀/에이전시용',
    monthlyPrice: 49000,
    yearlyPrice: 39000,
    icon: <Crown size={24} />,
    color: '#f59e0b',
    buttonText: '문의하기',
    buttonVariant: 'light',
    features: [
      { text: '무제한 스크립트 생성', included: true },
      { text: '모든 훅 템플릿 + 커스텀', included: true },
      { text: '5개 옵션 제공', included: true },
      { text: '우선 처리 (최우선)', included: true },
      { text: '히스토리 저장 (무제한)', included: true },
      { text: '전용 슬랙 채널 지원', included: true },
    ],
  },
];

function formatPrice(price: number): string {
  if (price === 0) return '무료';
  return new Intl.NumberFormat('ko-KR').format(price);
}

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <Box
      style={{
        background: 'linear-gradient(180deg, #F9FAFB 0%, #FFFFFF 100%)',
        minHeight: '100vh',
      }}
    >
      <Container size="lg" py={80}>
        <Stack gap={60}>
          {/* 헤더 */}
          <Stack align="center" gap="lg">
            <Badge
              size="lg"
              variant="light"
              color="violet"
              style={{ padding: '10px 20px' }}
            >
              Pricing
            </Badge>
            <Title
              order={1}
              ta="center"
              style={{ fontSize: '44px', color: '#111827' }}
            >
              심플한 가격 정책
            </Title>
            <Text size="lg" c="gray.6" ta="center" maw={500}>
              숨겨진 비용 없이, 필요한 만큼만 사용하세요
            </Text>

            {/* 월/연 토글 */}
            <Group gap="md" mt="md">
              <Text size="sm" c={!isYearly ? 'violet' : 'gray.6'} fw={500}>
                월간
              </Text>
              <Switch
                checked={isYearly}
                onChange={(e) => setIsYearly(e.currentTarget.checked)}
                size="lg"
                color="violet"
              />
              <Group gap="xs">
                <Text size="sm" c={isYearly ? 'violet' : 'gray.6'} fw={500}>
                  연간
                </Text>
                <Badge size="sm" variant="light" color="green">
                  20% 할인
                </Badge>
              </Group>
            </Group>
          </Stack>

          {/* 플랜 카드 */}
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                padding="xl"
                radius="xl"
                style={{
                  border: plan.popular
                    ? '2px solid #8b5cf6'
                    : '1px solid #E5E7EB',
                  position: 'relative',
                  background: '#FFFFFF',
                  transform: plan.popular ? 'scale(1.02)' : undefined,
                }}
              >
                {plan.popular && (
                  <Badge
                    style={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                    }}
                    size="lg"
                    color="violet"
                  >
                    가장 인기
                  </Badge>
                )}

                <Stack gap="lg">
                  {/* 아이콘 + 이름 */}
                  <Group gap="md">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: `${plan.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: plan.color,
                      }}
                    >
                      {plan.icon}
                    </Box>
                    <Box>
                      <Title order={4} style={{ color: '#111827' }}>
                        {plan.name}
                      </Title>
                      <Text size="sm" c="gray.6">
                        {plan.description}
                      </Text>
                    </Box>
                  </Group>

                  {/* 가격 */}
                  <Box>
                    <Group gap="xs" align="baseline">
                      <Text
                        style={{
                          fontSize: '36px',
                          fontWeight: 700,
                          color: '#111827',
                        }}
                      >
                        ₩{formatPrice(isYearly ? plan.yearlyPrice : plan.monthlyPrice)}
                      </Text>
                      {plan.monthlyPrice > 0 && (
                        <Text size="sm" c="gray.5">
                          / 월
                        </Text>
                      )}
                    </Group>
                    {isYearly && plan.monthlyPrice > 0 && (
                      <Text size="xs" c="green" mt={4}>
                        연간 ₩{formatPrice(plan.yearlyPrice * 12)} (20% 절약)
                      </Text>
                    )}
                  </Box>

                  <Divider />

                  {/* 기능 목록 */}
                  <List spacing="sm" size="sm" center>
                    {plan.features.map((feature, i) => (
                      <List.Item
                        key={i}
                        icon={
                          <ThemeIcon
                            size={20}
                            radius="xl"
                            color={feature.included ? 'green' : 'gray'}
                            variant="light"
                          >
                            {feature.included ? (
                              <Check size={12} />
                            ) : (
                              <X size={12} />
                            )}
                          </ThemeIcon>
                        }
                        style={{
                          color: feature.included ? '#374151' : '#9CA3AF',
                        }}
                      >
                        {feature.text}
                      </List.Item>
                    ))}
                  </List>

                  {/* CTA 버튼 */}
                  <Button
                    component={Link}
                    href={plan.name === 'Team' ? '/support' : '/dashboard'}
                    size="lg"
                    radius="lg"
                    variant={plan.buttonVariant}
                    color={plan.popular ? 'violet' : 'gray'}
                    fullWidth
                    style={
                      plan.popular
                        ? {
                          background:
                            'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                          border: 'none',
                        }
                        : undefined
                    }
                  >
                    {plan.buttonText}
                  </Button>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>

          {/* FAQ 링크 */}
          <Stack align="center" gap="md">
            <Text size="sm" c="gray.6">
              궁금한 점이 있으신가요?
            </Text>
            <Button
              component={Link}
              href="/support"
              variant="subtle"
              color="violet"
            >
              자주 묻는 질문 보기
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
