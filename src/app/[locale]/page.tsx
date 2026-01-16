'use client';

/**
 * AI Agent 스타일 랜딩 페이지
 * 노마드코더 AI 마스터클래스 참고 - 프리미엄 디자인
 */

import Image from 'next/image';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Box,
  Divider,
  Code,
} from '@mantine/core';
import {
  Sparkles,
  Zap,
  Brain,
  Bot,
  Cpu,
  Target,
  Clock,
  Shield,
  Play,
  ArrowRight,
  Check,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LandingHeader } from '@/components/landing/LandingHeader';

// ============ 히어로 섹션 ============
function HeroSection() {
  return (
    <Box
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)',
        paddingTop: '140px',  /* 헤더 높이 + 여유 공간 */
        paddingBottom: '100px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 그리드 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 글로우 효과 */}
      <Box
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap={32}>
          {/* 로봇 히어로 이미지 - 다크 배경 */}
          <Box className="animate-float">
            <Image
              src="/images/robot-hero-dark.png"
              alt="FlowSpot AI"
              width={280}
              height={280}
              style={{ borderRadius: '24px' }}
            />
          </Box>

          {/* 메인 타이틀 */}
          <Title
            order={1}
            ta="center"
            style={{
              fontSize: 'clamp(36px, 6vw, 56px)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#FFFFFF',
            }}
          >
            AI Script Agent
          </Title>

          {/* 서브 타이틀 */}
          <Text
            ta="center"
            style={{
              fontSize: 'clamp(20px, 3vw, 28px)',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            조회수가 터지는 스크립트의 비밀
          </Text>

          {/* 설명 */}
          <Text
            size="lg"
            ta="center"
            maw={500}
            style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.6)' }}
          >
            100만뷰 영상 200개를 분석한 AI가
            <br />
            당신의 쇼츠 스크립트를 자동으로 생성합니다
          </Text>

          {/* CTA 버튼 */}
          <Group gap="md" mt="lg">
            <Button
              component={Link}
              href="/dashboard"
              size="xl"
              radius="xl"
              className="animate-gradient"
              leftSection={<Brain size={22} />}
              style={{
                padding: '18px 40px',
                fontSize: '17px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                border: 'none',
              }}
            >
              무료로 시작하기
            </Button>
            <Button
              component={Link}
              href="#demo"
              size="xl"
              radius="xl"
              variant="outline"
              leftSection={<Play size={20} />}
              style={{
                padding: '18px 40px',
                fontSize: '17px',
                fontWeight: 600,
                borderColor: 'rgba(255,255,255,0.2)',
                color: '#FFFFFF',
              }}
            >
              데모 보기
            </Button>
          </Group>

          {/* 신뢰 지표 */}
          <Group gap="xl" mt="xl">
            <Group gap={8}>
              <Box
                className="animate-pulse-dot"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              />
              <Text size="sm" c="gray.5">AI 실시간 작동 중</Text>
            </Group>
            <Text size="sm" c="gray.6">•</Text>
            <Text size="sm" c="gray.5">평균 30초 생성</Text>
            <Text size="sm" c="gray.6">•</Text>
            <Text size="sm" c="gray.5">200개 훅 패턴</Text>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 통계 섹션 ============
function StatsSection() {
  const stats = [
    { value: '100만+', label: '분석한 조회수' },
    { value: '200개', label: '훅 패턴' },
    { value: '30초', label: '평균 생성 시간' },
    { value: '3개', label: '스크립트 옵션' },
  ];

  return (
    <Box py={60} style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container size="lg">
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="xl">
          {stats.map((stat, i) => (
            <Stack key={i} align="center" gap={4}>
              <Text
                style={{
                  fontSize: '36px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {stat.value}
              </Text>
              <Text size="sm" c="gray.5">{stat.label}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 문제 제기 섹션 ============
function ProblemSection() {
  const problems = [
    '스크립트 작성에 2시간 넘게 걸린다',
    '첫 문장(훅)을 어떻게 시작해야 할지 모르겠다',
    '매번 비슷한 패턴으로 작성하게 된다',
    '조회수가 왜 안 나오는지 모르겠다',
  ];

  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="md">
        <Stack align="center" gap="xl">
          <Text
            size="sm"
            fw={600}
            style={{
              color: '#a78bfa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            이런 고민 있으신가요?
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            쇼츠 스크립트 작성,
            <br />
            어렵고 시간이 오래 걸리죠?
          </Title>

          <Stack gap="md" mt="lg">
            {problems.map((problem, i) => (
              <Group key={i} gap="md" style={{ opacity: 0.9 }}>
                <Box
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#ef4444',
                  }}
                />
                <Text size="lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{problem}</Text>
              </Group>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 솔루션 섹션 ============
function SolutionSection() {
  const features = [
    {
      icon: Bot,
      title: 'AI 훅 생성',
      desc: '조회수가 터지는 첫 문장을 AI가 자동으로 만들어드려요',
      color: '#8b5cf6',
    },
    {
      icon: Zap,
      title: '초고속 생성',
      desc: '평균 30초 안에 3개의 스크립트 옵션을 받아보세요',
      color: '#f59e0b',
    },
    {
      icon: Brain,
      title: 'Gemini AI 엔진',
      desc: 'Google의 최신 AI로 자연스러운 한국어 스크립트를 생성해요',
      color: '#ec4899',
    },
    {
      icon: Target,
      title: '알고리즘 최적화',
      desc: '쇼츠 알고리즘에 최적화된 구조로 스크립트를 구성해요',
      color: '#06b6d4',
    },
  ];

  return (
    <Box py={100} style={{ background: '#0a0a14' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Text
            size="sm"
            fw={600}
            style={{
              color: '#a78bfa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Solution
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            AI가 대신 해드립니다
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={32}>
          {features.map((f, i) => (
            <Card
              key={i}
              padding="xl"
              radius="xl"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(139, 92, 246, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Group gap="lg" align="flex-start">
                <Box
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: `${f.color}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <f.icon size={26} color={f.color} />
                </Box>
                <Stack gap={6} style={{ flex: 1 }}>
                  <Title order={4} style={{ color: '#FFFFFF' }}>{f.title}</Title>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{f.desc}</Text>
                </Stack>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 사용 방법 섹션 ============
function HowItWorksSection() {
  const steps = [
    { num: '01', icon: '📝', title: '참고 스크립트 입력', desc: '잘 된 영상의 스크립트나 주제를 입력하세요' },
    { num: '02', icon: '🤖', title: 'AI 분석 & 생성', desc: 'AI가 패턴을 분석하고 맞춤 스크립트를 생성해요' },
    { num: '03', icon: '✨', title: '스크립트 선택', desc: '3가지 옵션 중 마음에 드는 것을 선택하세요' },
  ];

  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Text
            size="sm"
            fw={600}
            style={{
              color: '#a78bfa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            How it works
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            3단계로 끝
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
          {steps.map((step, i) => (
            <Stack key={i} align="center" gap="lg">
              <Box
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '36px',
                }}
              >
                {step.icon}
              </Box>
              <Text
                fw={700}
                style={{
                  fontSize: '13px',
                  color: '#a78bfa',
                  letterSpacing: '2px',
                }}
              >
                STEP {step.num}
              </Text>
              <Title order={4} ta="center" style={{ color: '#FFFFFF' }}>{step.title}</Title>
              <Text size="sm" ta="center" maw={260} style={{ color: 'rgba(255,255,255,0.6)' }}>{step.desc}</Text>
            </Stack>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ CTA 섹션 ============
function CTASection() {
  return (
    <Box
      py={100}
      style={{
        background: 'linear-gradient(135deg, #0a0a14 0%, #1e1b4b 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="xl">
          <Box className="animate-float">
            <Image
              src="/images/robot-cta-dark.png"
              alt="FlowSpot AI"
              width={180}
              height={180}
              style={{ borderRadius: '24px' }}
            />
          </Box>
          <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '40px' }}>
            지금 바로 시작하세요
          </Title>
          <Text size="lg" ta="center" style={{ color: 'rgba(255,255,255,0.6)' }}>
            첫 3회 스크립트 생성은 완전 무료
          </Text>

          <Stack gap="xs" align="center">
            {['카드 등록 필요 없음', '바로 사용 가능', '언제든 취소 가능'].map((text, i) => (
              <Group key={i} gap="sm">
                <Check size={18} color="#22c55e" />
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{text}</Text>
              </Group>
            ))}
          </Stack>

          <Button
            component={Link}
            href="/dashboard"
            size="xl"
            radius="xl"
            rightSection={<ArrowRight size={20} />}
            style={{
              marginTop: 16,
              padding: '18px 48px',
              fontSize: '18px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
              border: 'none',
            }}
          >
            무료로 시작하기
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 푸터 ============
function Footer() {
  return (
    <Box py={60} style={{ background: '#0a0a14' }}>
      <Container size="lg">
        <Stack align="center" gap="md">
          <Group gap="sm">
            <Bot size={24} color="#a78bfa" />
            <Text size="lg" fw={600} style={{ color: '#FFFFFF' }}>FlowSpot</Text>
          </Group>
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            AI-Powered Script Generation
          </Text>
          <Divider w={60} color="gray.8" my="sm" />
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 FlowSpot. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 메인 페이지 ============
export default function LandingPage() {
  return (
    <main>
      <LandingHeader />
      <HeroSection />
      <StatsSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </main>
  );
}
