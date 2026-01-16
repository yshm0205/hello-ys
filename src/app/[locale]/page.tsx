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
import { motion } from 'framer-motion';

// 애니메이션 variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

// ============ CSS 애니메이션 Cosmic Flow Orb 컴포넌트 ============
function CosmicFlowOrb() {
  return (
    <Box
      style={{
        position: 'relative',
        width: '340px',
        height: '340px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* 바깥쪽 회전 링 1 */}
      <Box
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          animation: 'spin 20s linear infinite',
        }}
      />
      {/* 바깥쪽 회전 링 2 (반대 방향) */}
      <Box
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          border: '1px dashed rgba(236, 72, 153, 0.4)',
          animation: 'spin 15s linear infinite reverse',
        }}
      />
      {/* 중간 글로우 링 */}
      <Box
        style={{
          position: 'absolute',
          width: '75%',
          height: '75%',
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4))',
          animation: 'spin 8s linear infinite',
          filter: 'blur(3px)',
        }}
      />
      {/* 메인 글라스모픽 오브 */}
      <Box
        style={{
          position: 'absolute',
          width: '65%',
          height: '65%',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), rgba(139, 92, 246, 0.2) 50%, rgba(10,10,20,0.8))',
          boxShadow: '0 0 60px rgba(139, 92, 246, 0.5), inset 0 0 40px rgba(139, 92, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      />
      {/* 내부 코어 */}
      <Box
        style={{
          position: 'absolute',
          width: '35%',
          height: '35%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(139, 92, 246, 0.8) 50%, transparent 70%)',
          animation: 'pulse 3s ease-in-out infinite',
          boxShadow: '0 0 40px rgba(236, 72, 153, 0.6)',
        }}
      />
      {/* 아이콘 중앙 */}
      <Box style={{ position: 'relative', zIndex: 1 }}>
        <Brain size={48} color="rgba(255,255,255,0.9)" strokeWidth={1.5} />
      </Box>
      {/* 플로팅 파티클들 */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          style={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(139, 92, 246, 0.8)' : 'rgba(236, 72, 153, 0.8)',
            boxShadow: `0 0 10px ${i % 2 === 0 ? 'rgba(139, 92, 246, 0.8)' : 'rgba(236, 72, 153, 0.8)'}`,
            animation: `orbit${i % 3 + 1} ${8 + i * 2}s linear infinite`,
            transformOrigin: 'center center',
          }}
        />
      ))}
      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes orbit1 {
          from { transform: rotate(0deg) translateX(140px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(140px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(120deg) translateX(120px) rotate(-120deg); }
          to { transform: rotate(480deg) translateX(120px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(240deg) translateX(160px) rotate(-240deg); }
          to { transform: rotate(600deg) translateX(160px) rotate(-600deg); }
        }
      `}</style>
    </Box>
  );
}

// ============ 히어로 섹션 (노마드코더 스타일) ============
function HeroSection() {
  return (
    <Box
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #0d0d1a 50%, #111827 100%)',
        paddingTop: '100px',
        paddingBottom: '80px',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
      }}
    >
      {/* 배경 그리드 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* 메인 글로우 효과 */}
      <Box
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '700px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.15) 30%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap={40}>

          {/* 소셜 프루프 인용문 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Box
              style={{
                background: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '100px',
                padding: '10px 24px',
              }}
            >
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
                🚀 <span style={{ color: '#a78bfa', fontWeight: 600 }}>"스크립트 작성 시간 90% 단축"</span> — 베타 테스터 피드백
              </Text>
            </Box>
          </motion.div>

          {/* 로봇 캐릭터 이미지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ position: 'relative' }}
          >
            {/* 로봇 뒤 글로우 효과 */}
            <Box style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '300px',
              height: '300px',
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, transparent 70%)',
              filter: 'blur(40px)',
              zIndex: 0,
            }} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/robot-hero.png?v=2"
              alt="FlowSpot AI Robot"
              width={320}
              height={380}
              style={{
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 0 30px rgba(139, 92, 246, 0.3))',
              }}
            />
          </motion.div>

          {/* 메인 타이틀 - 에이전트 스타일 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Title
              order={1}
              ta="center"
              style={{
                fontSize: 'clamp(36px, 6vw, 64px)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#FFFFFF',
              }}
            >
              이제 AI가 대신
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #f472b6 50%, #fb7185 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>스크립트를 써드립니다</span>
            </Title>
          </motion.div>

          {/* 서브 헤드라인 - 가치 제안 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Text
              size="xl"
              ta="center"
              maw={700}
              style={{ lineHeight: 1.8, color: 'rgba(255,255,255,0.7)', fontSize: '20px' }}
            >
              조회수가 터지는 영상에는 <span style={{ color: '#a78bfa', fontWeight: 600 }}>공통된 패턴</span>이 있습니다.
              <br />
              FlowSpot AI가 <span style={{ color: '#4ade80', fontWeight: 600 }}>200개의 바이럴 영상</span>을 분석해서
              <br />
              당신만의 스크립트를 자동으로 생성합니다.
            </Text>
          </motion.div>

          {/* 에이전트 워크플로우 설명 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Box
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '24px 32px',
                maxWidth: '600px',
              }}
            >
              <Stack gap="sm">
                <Group gap="sm">
                  <Bot size={20} color="#a78bfa" />
                  <Text fw={600} style={{ color: '#FFFFFF' }}>Script Agent가 하는 일</Text>
                </Group>
                <Stack gap={8} style={{ paddingLeft: '28px' }}>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    → 참고 스크립트의 <span style={{ color: '#a78bfa' }}>훅 패턴</span> 분석
                  </Text>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    → 조회수 터지는 <span style={{ color: '#a78bfa' }}>첫 문장 3개</span> 자동 생성
                  </Text>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    → 알고리즘 최적화된 <span style={{ color: '#22c55e' }}>완성 스크립트</span> 제공
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </motion.div>

          {/* CTA 버튼 - 레인보우 보더 애니메이션 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Group gap="xl">
              <Box
                style={{
                  background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #f59e0b, #22c55e, #3b82f6, #8b5cf6)',
                  backgroundSize: '200% 100%',
                  animation: 'rainbow 3s linear infinite',
                  padding: '3px',
                  borderRadius: '50px',
                }}
              >
                <Button
                  component={Link}
                  href="/dashboard"
                  size="xl"
                  radius="xl"
                  leftSection={<Sparkles size={22} />}
                  style={{
                    padding: '20px 48px',
                    fontSize: '18px',
                    fontWeight: 700,
                    background: '#0a0a14',
                    border: 'none',
                    color: '#FFFFFF',
                  }}
                >
                  무료로 시작하기
                </Button>
              </Box>
              <Button
                component={Link}
                href="#how-it-works"
                size="xl"
                radius="xl"
                variant="outline"
                rightSection={<ArrowRight size={20} />}
                style={{
                  padding: '20px 40px',
                  fontSize: '18px',
                  fontWeight: 600,
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: '#FFFFFF',
                }}
              >
                작동 원리 보기
              </Button>
            </Group>
          </motion.div>

          {/* 신뢰 지표 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Stack gap="md" align="center">
              <Group gap="xl">
                <Group gap={8}>
                  <Box
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#22c55e',
                      boxShadow: '0 0 15px #22c55e',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Agent 실시간 작동 중</Text>
                </Group>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>|</Text>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  ✅ 카드 등록 없음
                </Text>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>|</Text>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  ✅ 바로 사용 가능
                </Text>
              </Group>
            </Stack>
          </motion.div>
        </Stack>
      </Container>

      {/* 레인보우 애니메이션 CSS */}
      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
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

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={32}>
            {features.map((f, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card
                  padding="xl"
                  radius="xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                    height: '100%',
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
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>
      </Container>
    </Box>
  );
}

// ============ 프로세스 여정 섹션 (3 로봇 팀 레이아웃) ============
function HowItWorksSection() {
  // 3 로봇 에이전트 팀 데이터
  const agentTeam = [
    {
      name: '패턴 분석가',
      role: 'Pattern Analyzer',
      image: '/images/robot-analyzer.png?v=2',
      color: '#8b5cf6',
      desc: '200개 바이럴 영상의 훅 패턴을 분석합니다',
      emoji: '🔍',
    },
    {
      name: '스크립트 작가',
      role: 'Script Writer',
      image: '/images/robot-hero.png?v=2',
      color: '#ec4899',
      desc: '분석된 패턴으로 3개의 스크립트를 생성합니다',
      emoji: '✍️',
    },
    {
      name: '품질 검수자',
      role: 'Quality Checker',
      image: '/images/robot-working.png?v=2',
      color: '#22c55e',
      desc: '알고리즘 최적화 및 품질을 검증합니다',
      emoji: '✅',
    },
  ];

  return (
    <Box id="how-it-works" py={120} style={{ background: 'linear-gradient(180deg, #1a1a3e 0%, #0f0f2a 100%)', position: 'relative', overflow: 'hidden' }}>
      {/* 배경 블루프린트 그리드 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(100, 120, 200, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 120, 200, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />

      <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
        {/* 섹션 타이틀 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stack align="center" gap="md" mb={60}>
            <Text
              fw={600}
              style={{
                color: '#a78bfa',
                fontSize: '13px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
              }}
            >
              Agent Team
            </Text>
            <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '36px' }}>
              3명의 AI 에이전트가 <span style={{
                background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.3), transparent)',
                padding: '4px 12px',
                borderRadius: '4px',
              }}>함께</span> 일합니다
            </Title>
            <Text ta="center" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '600px' }}>
              각자의 전문 분야에서 협력하여 최고의 스크립트를 만들어냅니다
            </Text>
          </Stack>
        </motion.div>

        {/* 3 로봇 팀 - 나란히 배치 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* 연결선 - 로봇들 사이 */}
          <Box style={{ position: 'relative' }}>
            {/* 수평 연결선 (로봇들 위에) */}
            <Box style={{
              position: 'absolute',
              top: '180px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              height: '3px',
              background: 'linear-gradient(90deg, #8b5cf6, #ec4899, #22c55e)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              zIndex: 0,
            }} />

            {/* 화살표 애니메이션 표시 */}
            <Box style={{
              position: 'absolute',
              top: '170px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1,
            }}>
              <Text style={{ fontSize: '20px', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}>⚡</Text>
            </Box>

            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={40} style={{ position: 'relative', zIndex: 2 }}>
              {agentTeam.map((agent, index) => (
                <motion.div
                  key={agent.role}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                >
                  <Stack align="center" gap="lg">
                    {/* 순서 번호 */}
                    <Box style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${agent.color}, ${agent.color}99)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 20px ${agent.color}60`,
                    }}>
                      <Text fw={700} style={{ color: '#fff', fontSize: '16px' }}>{index + 1}</Text>
                    </Box>

                    {/* 로봇 이미지 */}
                    <Box style={{ position: 'relative' }}>
                      {/* 글로우 효과 */}
                      <Box style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '200px',
                        height: '200px',
                        background: `radial-gradient(circle, ${agent.color}40 0%, transparent 70%)`,
                        filter: 'blur(30px)',
                      }} />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agent.image}
                        alt={agent.name}
                        width={200}
                        height={240}
                        style={{
                          position: 'relative',
                          filter: `drop-shadow(0 0 15px ${agent.color}50)`,
                        }}
                      />
                    </Box>

                    {/* 에이전트 정보 카드 */}
                    <Box style={{
                      padding: '20px 24px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '16px',
                      border: `2px solid ${agent.color}50`,
                      textAlign: 'center',
                      width: '100%',
                      maxWidth: '280px',
                    }}>
                      <Group gap="xs" justify="center" mb="xs">
                        <Text style={{ fontSize: '20px' }}>{agent.emoji}</Text>
                        <Text fw={700} style={{ color: agent.color, fontSize: '18px' }}>
                          {agent.name}
                        </Text>
                      </Group>
                      <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                        {agent.role}
                      </Text>
                      <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                        {agent.desc}
                      </Text>
                    </Box>
                  </Stack>
                </motion.div>
              ))}
            </SimpleGrid>
          </Box>
        </motion.div>

        {/* 워크플로우 화살표 - 팀 아래 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Stack align="center" gap="md" mt={50}>
            {/* 화살표 */}
            <Box style={{
              width: '3px',
              height: '40px',
              background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.6), rgba(251, 146, 60, 0.8))',
            }} />

            {/* 최종 결과물 */}
            <Box style={{
              padding: '20px 48px',
              background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.2) 0%, rgba(239, 68, 68, 0.2) 100%)',
              borderRadius: '16px',
              border: '2px solid rgba(251, 146, 60, 0.6)',
              boxShadow: '0 0 50px rgba(251, 146, 60, 0.3)',
            }}>
              <Group gap="md">
                <Text style={{ fontSize: '28px' }}>🎯</Text>
                <Stack gap={4}>
                  <Text fw={800} style={{ color: '#fb923c', fontSize: '22px' }}>
                    완성 스크립트 3개
                  </Text>
                  <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    평균 30초 만에 자동 생성
                  </Text>
                </Stack>
              </Group>
            </Box>
          </Stack>
        </motion.div>

        {/* 완료 표시 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Stack align="center" gap="md" mt={40}>
            <Box
              style={{
                padding: '12px 24px',
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '100px',
              }}
            >
              <Text fw={600} style={{ color: '#22c55e', fontSize: '14px' }}>
                ✓ 3명의 전문가가 당신을 위해 일합니다
              </Text>
            </Box>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}

// ============ FAQ 섹션 ============
function FAQSection() {
  const faqs = [
    {
      question: '무료로 사용할 수 있나요?',
      answer: '네! 기본 플랜은 무료로 제공됩니다. 매월 일정 횟수의 스크립트 생성이 가능하며, 더 많은 기능이 필요하시면 Pro 플랜을 이용해 주세요.',
    },
    {
      question: '어떤 AI를 사용하나요?',
      answer: 'Google의 최신 Gemini AI를 사용합니다. 한국어에 특화된 자연스러운 스크립트를 생성할 수 있어요.',
    },
    {
      question: '생성된 스크립트의 저작권은 누구에게 있나요?',
      answer: '생성된 모든 스크립트의 저작권은 사용자님에게 있습니다. 유튜브 영상에 자유롭게 활용하실 수 있어요.',
    },
    {
      question: '스크립트 생성에 얼마나 걸리나요?',
      answer: '평균 30초 이내에 3개의 스크립트 옵션을 받아보실 수 있습니다. AI가 빠르게 분석하고 생성해드려요.',
    },
    {
      question: '참고 스크립트는 어떤 걸 넣어야 하나요?',
      answer: '잘 된 영상의 스크립트나 주제를 입력하시면 됩니다. AI가 패턴을 분석해서 비슷한 스타일의 새 스크립트를 만들어드려요.',
    },
  ];

  return (
    <Box py={100} style={{ background: '#0a0a14' }}>
      <Container size="md">
        <Stack align="center" gap="xl" mb={48}>
          <Text
            size="sm"
            fw={600}
            style={{
              color: '#a78bfa',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            FAQ
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            자주 묻는 질문
          </Title>
        </Stack>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Stack gap="md">
            {faqs.map((faq, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Box
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }}
                >
                  <details>
                    <summary
                      style={{
                        color: '#FFFFFF',
                        fontWeight: 600,
                        fontSize: '16px',
                        listStyle: 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {faq.question}
                      <span style={{ color: '#a78bfa', fontSize: '20px' }}>+</span>
                    </summary>
                    <Text
                      size="sm"
                      style={{
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: '12px',
                        lineHeight: 1.7,
                      }}
                    >
                      {faq.answer}
                    </Text>
                  </details>
                </Box>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
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
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
