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
  Badge,
  Avatar,
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

          {/* Product-First Hero Layout */}
          <Group align="center" justify="space-between" style={{ width: '100%', gap: '4rem', alignItems: 'center' }}>

            {/* Left: Copy & CTA */}
            <Stack style={{ flex: 1, maxWidth: '600px' }} gap="xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Group gap="sm">
                  <Badge
                    size="lg"
                    variant="gradient"
                    gradient={{ from: 'indigo', to: 'cyan' }}
                    style={{ fontSize: '14px', padding: '12px 16px' }}
                  >
                    🎉 베타 오픈 기념 : 스크립트 3개 무료
                  </Badge>
                </Group>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <Title
                  order={1}
                  style={{
                    fontSize: 'clamp(40px, 5vw, 64px)',
                    fontWeight: 800,
                    lineHeight: 1.1,
                    color: '#FFFFFF',
                    textAlign: 'left',
                  }}
                >
                  잘 터지는 유튜브 대본,
                  <br />
                  <span style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>AI가 3분 만에.</span>
                </Title>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Text
                  size="xl"
                  style={{
                    lineHeight: 1.6,
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '20px',
                    textAlign: 'left'
                  }}
                >
                  레퍼런스 영상만 복사해서 붙여넣으세요.
                  <br />
                  구조 분석부터 후킹 포인트까지, AI가 알아서 대본을 완성해줍니다.
                </Text>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Group gap="md" style={{ marginTop: '1rem' }}>
                  <Button
                    component={Link}
                    href="/dashboard"
                    size="xl"
                    radius="md"
                    rightSection={<Sparkles size={20} />}
                    style={{
                      padding: '0 32px',
                      height: '60px',
                      fontSize: '18px',
                      fontWeight: 700,
                      background: '#a78bfa',
                      color: '#ffffff',
                      transition: 'transform 0.2s',
                    }}
                  >
                    무료로 대본 3개 받기
                  </Button>
                  <Text size="sm" c="dimmed">
                    *카드 등록 없이 바로 시작하세요
                  </Text>
                </Group>
              </motion.div>

              {/* Social Proof Text */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Group gap="xs" style={{ marginTop: '1rem' }}>
                  <Avatar.Group spacing="sm">
                    <Avatar src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-1.png" radius="xl" size="sm" />
                    <Avatar src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-2.png" radius="xl" size="sm" />
                    <Avatar src="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/avatars/avatar-3.png" radius="xl" size="sm" />
                    <Avatar radius="xl" size="sm">+50</Avatar>
                  </Avatar.Group>
                  <Text size="sm" c="dimmed" style={{ marginLeft: '8px' }}>
                    이미 <span style={{ color: '#fff', fontWeight: 600 }}>1,200명</span>의 크리에이터가 사용 중입니다
                  </Text>
                </Group>
              </motion.div>
            </Stack>

            {/* Right: Product Screenshot Placeholder */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{ flex: 1, display: 'flex', justifyContent: 'center', width: '100%' }}
            >
              <Box style={{ position: 'relative', width: '100%', maxWidth: '600px', aspectRatio: '16/10' }}>
                <Box
                  className="animate-float"
                  style={{
                    width: '100%',
                    height: '100%',
                    background: 'rgba(20, 20, 40, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    overflow: 'hidden',
                    zIndex: 2,
                  }}
                >
                  {/* Mockup UI Header */}
                  <Box style={{
                    height: '40px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 20px',
                    gap: '8px',
                    background: 'rgba(255,255,255,0.05)'
                  }}>
                    <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                    <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                    <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                  </Box>

                  {/* Mockup Content Placeholder */}
                  <Box style={{ padding: '30px', height: 'calc(100% - 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <Text size="xl" fw={700} c="dimmed" ta="center" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      SCRIPTSHOP DASHBOARD
                    </Text>
                    <Text size="sm" c="dimmed" ta="center" mt="sm">
                      (실제 툴 구동 화면으로 교체 예정)
                    </Text>
                    <Button variant="outline" color="gray" mt="xl" radius="xl" size="sm" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)' }}>
                      &lt; 대본 생성 결과 화면 &gt;
                    </Button>
                  </Box>
                </Box>

                {/* Decorative Gradient Blob */}
                <Box
                  style={{
                    position: 'absolute',
                    top: '-20%',
                    right: '-20%',
                    width: '140%',
                    height: '140%',
                    background: 'radial-gradient(circle, rgba(167, 139, 250, 0.15) 0%, transparent 60%)',
                    zIndex: 1,
                    pointerEvents: 'none'
                  }}
                />
              </Box>
            </motion.div>
          </Group>

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

// ============ 핵심 가치 제안 (Benefit) 섹션 ============
function ProblemSection() {
  return (
    <Box py={80} style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container size="md">
        <Stack align="center" gap="xl">
          <Badge
            variant="outline"
            color="gray"
            size="lg"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '1px',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.6)'
            }}
          >
            Why FlowSpot?
          </Badge>

          <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '32px' }}>
            <span style={{ color: '#a78bfa' }}>성과 없는 유튜브</span>는 이제 그만.
            <br />
            검증된 데이터로 확실하게 시작하세요.
          </Title>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt="md" style={{ width: '100%' }}>
            {[
              { title: "시간 90% 단축", desc: "고민하는 시간 3시간 → 클릭 3분으로 단축", icon: "⚡" },
              { title: "검증된 구조", desc: "뇌피셜이 아닌, 실제 터진 영상 패턴 분석", icon: "📊" },
              { title: "무한 아이디어", desc: "마르지 않는 소재와 후킹 문장 제공", icon: "💡" },
            ].map((item, i) => (
              <Box key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <Text style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</Text>
                <Text fw={700} style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>{item.title}</Text>
                <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 본인 스토리 섹션 (기획서 3번) ============
function PersonalStorySection() {
  return (
    <Box py={100} style={{ background: '#0d0d1a' }}>
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
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
              왜 AI 팀을 만들었을까요?
            </Text>

            {/* 메인 스토리 */}
            <Box
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '20px',
                padding: '40px',
                maxWidth: '700px',
              }}
            >
              <Stack gap="lg">
                <Text
                  size="lg"
                  style={{
                    color: '#FFFFFF',
                    lineHeight: 1.8,
                    fontSize: '18px',
                  }}
                >
                  &quot;제 수강생 중 <span style={{ color: '#22c55e', fontWeight: 600 }}>월 1000만원, 500만원</span> 버시는 분들이 있습니다.&quot;
                </Text>

                <Text
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.8,
                  }}
                >
                  근데 모든 분이 그러진 못했어요.
                  <br /><br />
                  지식을 정확히 안다고 해서 <span style={{ color: '#a78bfa' }}>실행력과 센스</span>까지 같을 순 없더라고요.
                </Text>

                <Box
                  style={{
                    borderLeft: '3px solid #ec4899',
                    paddingLeft: '20px',
                    marginTop: '12px',
                  }}
                >
                  <Text
                    style={{
                      color: '#ec4899',
                      fontWeight: 600,
                      fontSize: '17px',
                      lineHeight: 1.7,
                    }}
                  >
                    특히 &quot;후킹 문장&quot;, &quot;스크립트 작성&quot;이 가장 어렵다고 하셨어요.
                  </Text>
                </Box>

                <Text
                  style={{
                    color: '#00D9FF',
                    fontWeight: 700,
                    fontSize: '20px',
                    textAlign: 'center',
                    marginTop: '16px',
                  }}
                >
                  그래서 이 부분을 자동화하는 AI 팀을 만들었습니다.
                </Text>
              </Stack>
            </Box>

            {/* 핵심 메시지 */}
            <Box
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(236, 72, 153, 0.15))',
                borderRadius: '100px',
                padding: '16px 32px',
              }}
            >
              <Text fw={600} style={{ color: '#FFFFFF', fontSize: '16px' }}>
                💡 &quot;배운 건 강의로, 실행은 AI로&quot;
              </Text>
            </Box>
          </Stack>
        </motion.div>
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

// ============ 프로세스 여정 섹션 (3-Step Flow) ============
function HowItWorksSection() {
  return (
    <Box id="how-it-works" py={100} style={{ background: '#0a0a14', position: 'relative', overflow: 'hidden' }}>
      {/* Background Grid */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(to bottom, transparent, black, transparent)',
        }}
      />

      <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="xl" mb={80}>
          <Badge variant="dot" color="yellow" size="lg" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>
            HOW IT WORKS
          </Badge>
          <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '36px' }}>
            복잡한 과정은 잊으세요.
            <br />
            <span style={{ color: '#fbbf24' }}>단 3단계</span>로 끝납니다.
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40} style={{ position: 'relative' }}>

          {/* Step 1: Input */}
          <Stack align="center" gap="md">
            <Box style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
              <Box style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Stack align="center" gap="xs">
                  <Box style={{ p: 2, border: '1px dashed rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 16px' }}>
                    <Text size="xs" c="dimmed">youtube.com/watch?v=...</Text>
                  </Box>
                  <Text size="sm" c="dimmed">링크 복사/붙여넣기</Text>
                </Stack>
              </Box>
              <Badge
                size="xl"
                circle
                style={{ position: 'absolute', top: -15, left: 20, width: 40, height: 40, background: '#1f2937', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                1
              </Badge>
            </Box>
            <Title order={3} style={{ color: '#fff', fontSize: '20px' }}>레퍼런스 입력</Title>
            <Text ta="center" c="dimmed" size="sm">벤치마킹하고 싶은<br />영상 링크만 넣으세요.</Text>
          </Stack>

          {/* Step 2: Process */}
          <Stack align="center" gap="md">
            <Box style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
              <Box style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Brain size={64} color="#a78bfa" className="animate-pulse" />
              </Box>
              <Badge
                size="xl"
                circle
                style={{ position: 'absolute', top: -15, left: 20, width: 40, height: 40, background: '#1f2937', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                2
              </Badge>
            </Box>
            <Title order={3} style={{ color: '#fff', fontSize: '20px' }}>AI 분석 & 생성</Title>
            <Text ta="center" c="dimmed" size="sm">영상 구조와 후킹 포인트를<br />AI가 1분 만에 분석합니다.</Text>
          </Stack>

          {/* Step 3: Output */}
          <Stack align="center" gap="md">
            <Box style={{ position: 'relative', width: '100%', aspectRatio: '4/3' }}>
              <Box style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '16px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}>
                <Stack gap="xs">
                  <Box style={{ width: '60%', height: '8px', background: 'rgba(34, 197, 94, 0.3)', borderRadius: '4px' }} />
                  <Box style={{ width: '80%', height: '8px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '4px' }} />
                  <Box style={{ width: '50%', height: '8px', background: 'rgba(34, 197, 94, 0.2)', borderRadius: '4px' }} />
                </Stack>
                <Badge variant="light" color="green" mt="md" style={{ width: 'fit-content' }}>완성</Badge>
              </Box>
              <Badge
                size="xl"
                circle
                style={{ position: 'absolute', top: -15, left: 20, width: 40, height: 40, background: '#1f2937', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                3
              </Badge>
            </Box>
            <Title order={3} style={{ color: '#fff', fontSize: '20px' }}>대본 완성</Title>
            <Text ta="center" c="dimmed" size="sm">나만의 스타일로 재해석된<br />완벽한 대본을 받으세요.</Text>
          </Stack>

        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 강의 + AI 매핑 섹션 (기획서 6번 - 완전 신규) ============
function LectureAIMappingSection() {
  const mappings = [
    { lecture: '기획 원리', agent: '분석 에이전트', emoji: '🔍' },
    { lecture: '후킹 기법', agent: '후킹 에이전트', emoji: '🎯' },
    { lecture: '대본 작성법', agent: '대본 에이전트', emoji: '✍️' },
  ];

  return (
    <Box py={100} style={{ background: '#0d0d1a' }}>
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
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
              강의 + AI 도구
            </Text>

            <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
              강의 28강으로 원리를 배우고
              <br />
              <span style={{ color: '#a78bfa' }}>AI 팀으로</span> 바로 실행하세요
            </Title>

            {/* 매핑 테이블 */}
            <Box
              style={{
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: '20px',
                padding: '32px',
                width: '100%',
                maxWidth: '500px',
              }}
            >
              <Stack gap="lg">
                {/* 헤더 */}
                <SimpleGrid cols={2}>
                  <Text fw={600} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                    📚 강의 28강
                  </Text>
                  <Text fw={600} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
                    🤖 AI 실습
                  </Text>
                </SimpleGrid>

                <Divider color="rgba(139, 92, 246, 0.3)" />

                {/* 매핑 행들 */}
                {mappings.map((item, i) => (
                  <SimpleGrid cols={2} key={i}>
                    <Text style={{ color: '#FFFFFF' }}>{item.lecture}</Text>
                    <Group gap="xs">
                      <Text style={{ color: '#a78bfa' }}>→</Text>
                      <Text style={{ color: '#a78bfa' }}>{item.emoji} {item.agent}</Text>
                    </Group>
                  </SimpleGrid>
                ))}
              </Stack>
            </Box>

            {/* 핵심 메시지 배지 */}
            <Box
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                borderRadius: '100px',
                padding: '16px 32px',
                marginTop: '16px',
              }}
            >
              <Text fw={700} style={{ color: '#FFFFFF', fontSize: '18px' }}>
                💡 &quot;배운 건 강의로, 실행은 AI로&quot;
              </Text>
            </Box>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}

// ============ 팔로워 피드백 섹션 (기획서 5번) ============
function TestimonialsSection() {
  const testimonials = [
    {
      name: '숏폼 크리에이터 A님',
      role: '구독자 3만명',
      content: '매번 스크립트 쓰는데 2시간씩 걸렸는데, 이제 10분이면 끝나요. 진짜 혁신적이에요.',
      rating: 5,
    },
    {
      name: '지식 채널 운영자 B님',
      role: '구독자 8만명',
      content: '훅 문장이 항상 고민이었는데, AI가 제안해주는 옵션 중에 골라쓰니까 조회수가 확 올랐어요.',
      rating: 5,
    },
    {
      name: '부업 유튜버 C님',
      role: '구독자 1.2만명',
      content: '퇴근 후 영상 만들기 힘들었는데, 스크립트 자동화 덕분에 주 3개씩 올릴 수 있게 됐어요.',
      rating: 5,
    },
  ];

  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="lg">
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
            사용자 후기
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            이미 많은 분들이 사용하고 있어요
          </Title>
        </Stack>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing={24}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={itemVariants}>
                <Card
                  padding="xl"
                  radius="xl"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}
                >
                  <Stack gap="md">
                    {/* 별점 */}
                    <Group gap={4}>
                      {[...Array(t.rating)].map((_, j) => (
                        <Text key={j} style={{ color: '#fbbf24' }}>★</Text>
                      ))}
                    </Group>

                    {/* 후기 내용 */}
                    <Text style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, fontSize: '15px' }}>
                      &quot;{t.content}&quot;
                    </Text>

                    {/* 작성자 정보 */}
                    <Group gap="sm" mt="auto">
                      <Box
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text fw={600} style={{ color: '#fff' }}>{t.name[0]}</Text>
                      </Box>
                      <Stack gap={2}>
                        <Text fw={600} size="sm" style={{ color: '#FFFFFF' }}>{t.name}</Text>
                        <Text size="xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.role}</Text>
                      </Stack>
                    </Group>
                  </Stack>
                </Card>
              </motion.div>
            ))}
          </SimpleGrid>
        </motion.div>
      </Container>
    </Box>
  );
}

// ============ 강의+도구 결합 섹션 (기획서 6번) ============
function PackageSection() {
  const competitors = [
    { name: '크리투스', price: '99만원', ai: false, lectures: true },
    { name: '부업부부', price: '160만원', ai: false, lectures: true },
    { name: 'FlowSpot', price: '50만원', ai: true, lectures: true, highlight: true },
  ];

  return (
    <Box py={100} style={{ background: '#0a0a14' }}>
      <Container size="lg">
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
            왜 FlowSpot인가요?
          </Text>
          <Title order={2} ta="center" style={{ color: '#FFFFFF' }}>
            강의만 파는 게 아닙니다.
            <br />
            <span style={{ color: '#00D9FF' }}>진짜 도구</span>를 드립니다.
          </Title>
        </Stack>

        {/* 비교표 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={24}>
            {competitors.map((comp, i) => (
              <Box
                key={i}
                style={{
                  background: comp.highlight
                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(0, 217, 255, 0.1))'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: comp.highlight
                    ? '2px solid rgba(0, 217, 255, 0.5)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '20px',
                  padding: '32px',
                  position: 'relative',
                  boxShadow: comp.highlight ? '0 0 40px rgba(0, 217, 255, 0.2)' : 'none',
                }}
              >
                {comp.highlight && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #8b5cf6, #00D9FF)',
                      borderRadius: '100px',
                      padding: '6px 16px',
                    }}
                  >
                    <Text fw={600} size="xs" style={{ color: '#fff' }}>✨ 추천</Text>
                  </Box>
                )}

                <Stack align="center" gap="lg">
                  <Text fw={700} style={{ color: comp.highlight ? '#00D9FF' : '#FFFFFF', fontSize: '20px' }}>
                    {comp.name}
                  </Text>

                  <Text
                    style={{
                      fontSize: comp.highlight ? '36px' : '28px',
                      fontWeight: 800,
                      color: comp.highlight ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {comp.price}
                  </Text>

                  <Divider w="100%" color="gray.8" />

                  <Stack gap="sm" w="100%">
                    <Group gap="sm">
                      {comp.lectures ? (
                        <Check size={18} color="#22c55e" />
                      ) : (
                        <Text style={{ color: '#ef4444' }}>✕</Text>
                      )}
                      <Text size="sm" style={{ color: 'rgba(255,255,255,0.7)' }}>강의 제공</Text>
                    </Group>
                    <Group gap="sm">
                      {comp.ai ? (
                        <Check size={18} color="#22c55e" />
                      ) : (
                        <Text style={{ color: '#ef4444' }}>✕</Text>
                      )}
                      <Text size="sm" style={{ color: comp.ai ? '#22c55e' : 'rgba(255,255,255,0.5)' }}>
                        AI 스크립트 도구
                      </Text>
                    </Group>
                  </Stack>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </motion.div>

        {/* 가격 강조 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Stack align="center" mt={60}>
            <Box
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.2))',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '16px',
                padding: '24px 48px',
                textAlign: 'center',
              }}
            >
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '8px' }}>
                12개월 분할 시
              </Text>
              <Text
                style={{
                  fontSize: '42px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #a78bfa, #f472b6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                월 ₩41,666
              </Text>
              <Text size="sm" style={{ color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                <span style={{ textDecoration: 'line-through' }}>정가 ₩700,000</span> → ₩500,000
              </Text>
            </Box>

            <Box
              style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '100px',
                padding: '12px 24px',
                marginTop: '16px',
              }}
            >
              <Text fw={600} style={{ color: '#22c55e', fontSize: '14px' }}>
                🔥 1기 100명 한정 얼리버드
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

// ============ CTA 섹션 (Clean) ============
function CTASection() {
  return (
    <Box py={120} style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <Container size="md">
        <Stack align="center" gap="xl">
          <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '48px', fontWeight: 800 }}>
            <span style={{ color: '#a78bfa' }}>3분</span>이면 충분합니다.
            <br />
            직접 경험해보세요.
          </Title>
          <Text size="xl" c="dimmed" ta="center">
            복잡한 설치나 카드 등록 없이, 지금 바로 스크립트를 생성할 수 있습니다.
          </Text>

          <Button
            component={Link}
            href="/dashboard"
            size="xl"
            radius="md"
            rightSection={<Sparkles size={20} />}
            style={{
              padding: '0 48px',
              height: '64px',
              fontSize: '20px',
              fontWeight: 700,
              background: '#a78bfa',
              color: '#ffffff',
              marginTop: '24px'
            }}
          >
            무료로 대본 3개 만들기
          </Button>
          <Text size="sm" c="dimmed">
            *매주 3개 무료 제공
          </Text>
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
          <Group gap="lg" mt="sm">
            <Link href="/privacy" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>
              개인정보처리방침
            </Link>
            <Link href="/terms" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>
              이용약관
            </Link>
            <Link href="/support" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', textDecoration: 'none' }}>
              고객지원
            </Link>
          </Group>
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
      {/* 1. 히어로 */}
      <HeroSection />
      {/* 통계 */}
      <StatsSection />
      {/* 2. 페인포인트 */}
      <ProblemSection />
      {/* 3. 본인 스토리 (새로 추가) */}
      <PersonalStorySection />
      {/* 4. 솔루션 */}
      <SolutionSection />
      {/* 5. AI 팀 3명 */}
      <HowItWorksSection />
      {/* 6. 강의 + AI 매핑 (기획서 섹션 6 - 신규) */}
      <LectureAIMappingSection />
      {/* 7. 팔로워 피드백 */}
      <TestimonialsSection />
      {/* 8. 강의+도구 결합 + 가격 비교 */}
      <PackageSection />
      {/* FAQ */}
      <FAQSection />
      {/* 8. 최종 CTA */}
      <CTASection />
      <Footer />
    </main>
  );
}
