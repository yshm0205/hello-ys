'use client';

/**
 * FlowSpot 랜딩 페이지 (Final Strategy Applied)
 * 전략: 7대 규칙 기반 (수강생=전자책, AI=본인사용)
 * Update: 2026-01-23
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
  ThemeIcon,
  Timeline,
  Paper,
  Tabs,
  Accordion,
} from '@mantine/core';
import {
  Sparkles,
  Zap,
  Brain,
  Bot,
  Target,
  Clock,
  Shield,
  Play,
  ArrowRight,
  Check,
  X,
  CreditCard,
  AlertTriangle,
  HelpCircle,
  Quote,
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

// ============ 1. HERO 섹션 (크리투스 스타일 - 숫자 거대하게) ============
function HeroSection() {
  // 카운트다운 상태 (실제로는 useState/useEffect 사용)
  const deadline = { days: 3, hours: 15, mins: 42, secs: 18 };

  return (
    <Box
      style={{
        background: 'linear-gradient(180deg, #0a0a14 0%, #0f0f1a 50%, #111827 100%)',
        paddingTop: '120px',
        paddingBottom: '100px',
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
            linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 글로우 오브 */}
      <Box
        style={{
          position: 'absolute',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1000px',
          height: '800px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.08) 40%, transparent 70%)',
          filter: 'blur(100px)',
          pointerEvents: 'none',
        }}
      />

      <Container size="xl" style={{ position: 'relative', zIndex: 1 }}>
        <Group align="flex-start" justify="space-between" gap={60} wrap="wrap">

          {/* 왼쪽: 카피 영역 */}
          <Stack style={{ flex: 1, minWidth: '400px', maxWidth: '600px' }} gap="xl">

            {/* 숫자 임팩트 (크리투스 스타일) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: 'spring' }}
            >
              <Box style={{ position: 'relative' }}>
                <Text
                  style={{
                    fontSize: 'clamp(80px, 12vw, 140px)',
                    fontWeight: 900,
                    lineHeight: 0.9,
                    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-4px',
                  }}
                >
                  1.8억
                </Text>
                <Text
                  style={{
                    fontSize: 'clamp(28px, 4vw, 48px)',
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.9)',
                    marginTop: '-10px',
                  }}
                >
                  누적 조회수 돌파
                </Text>
              </Box>
            </motion.div>

            {/* 메인 카피 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Title
                order={1}
                style={{
                  fontSize: 'clamp(28px, 4vw, 42px)',
                  fontWeight: 700,
                  lineHeight: 1.3,
                  color: '#FFFFFF',
                }}
              >
                전자책 수강생 <span style={{ color: '#22c55e' }}>월 700만원</span>.
                <br />
                비결은 '시스템'이었습니다.
              </Title>
            </motion.div>

            {/* 서브 카피 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Text size="lg" style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                강의로 원리를 배우고, AI로 바로 실행하세요.
                <br />
                레퍼런스 URL만 넣으면, <b style={{ color: '#fff' }}>AI가 3분 만에</b> 터지는 대본을 복사해줍니다.
              </Text>
            </motion.div>

            {/* 가격 + CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Stack gap="md">
                <Box
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'inline-block',
                  }}
                >
                  <Text size="sm" c="dimmed">유튜브 수익화 마스터플랜</Text>
                  <Group gap="sm" mt={4}>
                    <Text size="sm" style={{ textDecoration: 'line-through', color: '#6b7280' }}>₩700,000</Text>
                    <Text size="xl" fw={800} style={{ color: '#fff' }}>₩500,000</Text>
                    <Badge color="red" size="sm">30% OFF</Badge>
                  </Group>
                </Box>

                <Button
                  component={Link}
                  href="/dashboard"
                  size="xl"
                  radius="xl"
                  rightSection={<ArrowRight size={24} />}
                  style={{
                    padding: '0 48px',
                    height: '72px',
                    fontSize: '22px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    boxShadow: '0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
                    border: 'none',
                    animation: 'ctaPulse 2s infinite',
                  }}
                >
                  🔥 1기 30명 한정 시작하기
                </Button>

                {/* 카운트다운 타이머 */}
                <Box
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 20px',
                  }}
                >
                  <Group gap="lg" justify="center">
                    <Text size="sm" fw={600} style={{ color: '#ef4444' }}>⏰ 얼리버드 마감까지</Text>
                    <Group gap="xs">
                      {[
                        { value: deadline.days, label: '일' },
                        { value: deadline.hours, label: '시' },
                        { value: deadline.mins, label: '분' },
                        { value: deadline.secs, label: '초' },
                      ].map((t, i) => (
                        <Group key={i} gap={4}>
                          <Box style={{ background: '#1f2937', padding: '6px 10px', borderRadius: '6px', minWidth: '40px', textAlign: 'center' }}>
                            <Text fw={700} style={{ color: '#fff', fontSize: '18px' }}>{t.value}</Text>
                          </Box>
                          <Text size="xs" c="dimmed">{t.label}</Text>
                        </Group>
                      ))}
                    </Group>
                  </Group>
                </Box>
              </Stack>
            </motion.div>

            {/* 하단 증거 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Group gap="lg" wrap="wrap">
                <Group gap={6}>
                  <Check size={16} color="#22c55e" />
                  <Text size="sm" c="dimmed">본인 수익 7,400만원+</Text>
                </Group>
                <Group gap={6}>
                  <Check size={16} color="#22c55e" />
                  <Text size="sm" c="dimmed">전자책 후기 77개</Text>
                </Group>
                <Group gap={6}>
                  <Check size={16} color="#22c55e" />
                  <Text size="sm" c="dimmed">7일 100% 환불</Text>
                </Group>
              </Group>
            </motion.div>
          </Stack>

          {/* 오른쪽: 제품 목업 플레이스홀더 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ flex: 1, minWidth: '350px', maxWidth: '500px' }}
          >
            <Box
              style={{
                position: 'relative',
                aspectRatio: '4/3',
              }}
            >
              {/* 글로우 배경 */}
              <Box
                style={{
                  position: 'absolute',
                  inset: '-20%',
                  background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
                  filter: 'blur(40px)',
                  zIndex: 0,
                }}
              />

              {/* 목업 프레임 */}
              <Box
                style={{
                  position: 'relative',
                  zIndex: 1,
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, rgba(30, 30, 50, 0.9), rgba(20, 20, 40, 0.95))',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
                  overflow: 'hidden',
                }}
              >
                {/* 브라우저 헤더 */}
                <Box style={{ height: '40px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: '8px' }}>
                  <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                  <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                  <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                </Box>

                {/* 플레이스홀더 콘텐츠 */}
                <Stack align="center" justify="center" style={{ height: 'calc(100% - 40px)', padding: '24px' }}>
                  <Bot size={48} color="#a78bfa" />
                  <Text fw={700} size="lg" style={{ color: 'rgba(255,255,255,0.4)' }}>AI 스크립트 생성 화면</Text>
                  <Text size="sm" c="dimmed">(실제 제품 스크린샷으로 교체 예정)</Text>
                  <Badge variant="light" color="violet" mt="md">LIVE DEMO</Badge>
                </Stack>
              </Box>
            </Box>
          </motion.div>

        </Group>
      </Container>

      <style>{`
        @keyframes ctaPulse {
          0% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7), 0 0 40px rgba(236, 72, 153, 0.5); }
          70% { box-shadow: 0 0 0 20px rgba(236, 72, 153, 0), 0 0 40px rgba(236, 72, 153, 0.5); }
          100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0), 0 0 40px rgba(236, 72, 153, 0.5); }
        }
      `}</style>
    </Box>
  );
}


// ============ 2. SOCIAL PROOF (전자책 수강생) ============
function SocialProofSection() {
  // 실제 후기 데이터 (reviews_summary.md 기반)
  const results = [
    {
      title: "월 700만원+",
      subtitle: "직장인 퇴근 후 2시간",
      icon: "💰",
      color: "#22c55e",
      review: "실제 카톡 인증",
      quote: "원초적인사이트님 덕분에 쇼츠로 월 700 이상씩 꾸준히 벌고 있습니다."
    },
    {
      title: "48시간 10만뷰",
      subtitle: "9개월 정체기 탈출",
      icon: "🚀",
      color: "#3b82f6",
      review: "유튜브 스튜디오 캡처",
      quote: "48시간 만에 거의 10만 뷰 증가, 좋아요 2천 개 돌파"
    },
    {
      title: "300만뷰",
      subtitle: "6천뷰 → 한 달 만에",
      icon: "📈",
      color: "#f59e0b",
      review: "통계 인증",
      quote: "처음 6천 뷰에서 시작해 100만, 300만 뷰까지 성장"
    },
    {
      title: "ROI 430%",
      subtitle: "10만원 → 43만원",
      icon: "💵",
      color: "#ec4899",
      review: "수익 화면 인증",
      quote: "유튜브로 수익 창출돼서, 저 수익금으로 TV 샀어요 ㅎㅎ"
    },
  ];

  // 실제 리뷰 (customer_needs_analysis.md + reviews_summary.md 기반)
  const reviews = [
    "3달간 혼자 헤딩하며 얻지 못한 명확한 방향을 찾았습니다",
    "900만원 강의비 날린 저도 이건 달랐습니다. 진짜입니다.",
    "9개월간 구독자 2700명 정체... 이젠 왜 안됐는지 이해됩니다",
    "컴퓨터 켜는 것도 어려운 왕초보인데 그대로 따라해서 수익 냈어요",
    "몇 년치 시행착오를 줄인 것 같은 느낌이 들었습니다",
    "웬만한 강의보다 훨씬 실질적이고 도움이 될 것 같습니다",
    "전자책 만으로도 가성비가 좋은데 프로그램까지? 감동...",
    "무료 영상에서 보지 못한 소중한 정보들을 발견하고 다시 용기",
  ];


  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Badge size="lg" variant="light" color="green" radius="xl">
            ✅ 전자책 수강생 77명 실제 성과
          </Badge>
          <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '36px' }}>
            강의만으로 이미 <span style={{ color: '#22c55e' }}>결과를 낸 분들</span>
          </Title>
        </Stack>

        {/* 성과 카드 그리드 */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          {results.map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Paper
                p="xl"
                radius="xl"
                style={{
                  background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`,
                  border: `1px solid ${item.color}40`,
                  cursor: 'pointer',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* 글로우 효과 */}
                <Box
                  style={{
                    position: 'absolute',
                    top: '-50%',
                    right: '-50%',
                    width: '100%',
                    height: '100%',
                    background: `radial-gradient(circle, ${item.color}20 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }}
                />
                <Text style={{ fontSize: '40px', marginBottom: '12px' }}>{item.icon}</Text>
                <Text fw={800} style={{ color: item.color, fontSize: '28px' }}>{item.title}</Text>
                <Text size="sm" c="dimmed" mt="xs">{item.subtitle}</Text>
                <Badge variant="outline" color="gray" mt="lg" size="sm">{item.review}</Badge>
              </Paper>
            </motion.div>
          ))}
        </SimpleGrid>

        {/* 텍스트 후기 캐러셀 */}
        <Box mt={60} style={{ position: 'relative', overflow: 'hidden' }}>
          <Box style={{ display: 'flex', gap: '24px', animation: 'marquee 40s linear infinite' }}>
            {[...reviews, ...reviews].map((text, i) => (
              <Paper
                key={i}
                p="lg"
                radius="lg"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  minWidth: '400px',
                  flexShrink: 0,
                }}
              >
                <Group gap="sm" align="flex-start">
                  <Quote size={20} color="#a78bfa" style={{ flexShrink: 0 }} />
                  <Text size="sm" style={{ color: '#d1d5db', lineHeight: 1.6 }}>{text}</Text>
                </Group>
              </Paper>
            ))}
          </Box>
        </Box>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </Container>
    </Box>
  );
}


// ============ 3. BRIDGE & AI REVEAL (본인 성과) ============
function AIRevealSection() {
  const youtubeResults = [
    { views: "500만", hot: true },
    { views: "330만", hot: false },
    { views: "300만", hot: false },
    { views: "170만", hot: false },
  ];

  const naverResults = [
    { views: "55만", hot: true },
    { views: "52만", hot: false },
    { views: "48만", hot: false },
    { views: "41만", hot: false },
  ];

  return (
    <Box py={100} style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)' }}>
      <Container size="lg">
        <Stack gap={60} align="center">

          {/* Bridge - 질문 던지기 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box
              p="xl"
              style={{
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                maxWidth: '700px',
              }}
            >
              <Group gap="md" align="flex-start">
                <Text style={{ fontSize: '32px' }}>💬</Text>
                <Stack gap="sm">
                  <Text size="xl" fw={700} style={{ color: '#fbbf24' }}>
                    "근데... 대본 쓰는 건 여전히 어려워요 ㅠㅠ"
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                    수강생 분들이 가장 많이 하소연하신 게 바로 <b style={{ color: '#fff' }}>'글쓰기'</b>였습니다.
                    <br />원리를 알아도, 막상 빈 화면을 보면 막막하다는 거였죠.
                  </Text>
                </Stack>
              </Group>
            </Box>
          </motion.div>

          {/* 화살표 */}
          <Box style={{ position: 'relative' }}>
            <Box style={{ width: '2px', height: '60px', background: 'linear-gradient(180deg, #f59e0b, #00D9FF)' }} />
            <ArrowRight size={24} color="#00D9FF" style={{ position: 'absolute', bottom: '-12px', left: '-11px', transform: 'rotate(90deg)' }} />
          </Box>

          {/* AI Reveal 헤더 */}
          <Stack align="center" gap="md">
            <Badge size="lg" variant="gradient" gradient={{ from: '#00D9FF', to: '#a78bfa' }} radius="xl">
              🤖 AI 도구 최초 공개
            </Badge>
            <Title order={2} ta="center" style={{ color: '#fff', fontSize: '36px' }}>
              그래서 제가 직접 쓰는 <span style={{ color: '#00D9FF' }}>AI 도구</span>를 공개합니다
            </Title>
            <Text ta="center" c="dimmed" size="lg">
              ⚠️ 수강생 성과가 아닙니다. <b style={{ color: '#fff' }}>제가 직접 이 AI로 만든 영상</b>들입니다.
            </Text>
          </Stack>

          {/* 성과 요약 배지 */}
          <Group justify="center" gap="xl" wrap="wrap">
            <Badge size="xl" variant="gradient" gradient={{ from: 'red', to: 'pink' }} radius="lg" style={{ padding: '16px 24px' }}>
              🔥 YouTube 500만뷰+
            </Badge>
            <Badge size="xl" variant="gradient" gradient={{ from: 'green', to: 'teal' }} radius="lg" style={{ padding: '16px 24px' }}>
              ⚡ 48시간 1,200만뷰
            </Badge>
            <Badge size="xl" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }} radius="lg" style={{ padding: '16px 24px' }}>
              � 월 1,356만원 수익
            </Badge>
          </Group>

        </Stack>
      </Container>
    </Box>
  );
}


// ============ 4. PAIN POINT (Review Based + Solution) ============
function PainPointSection() {
  const pains = [
    {
      emoji: "😰",
      title: "3개월째 방향 없이 헤매요",
      review: "\"3달간 혼자 헤딩하며 얻지 못한 방향을 찾았습니다\"",
      solution: "✅ 59강 커리큘럼이 기획부터 수익화까지 루트를 잡아드립니다."
    },
    {
      emoji: "💸",
      title: "900만원 강의에 속았어요",
      review: "\"올해 봄에 강의들에 낚여서 900만원 날린 사람입니다\"",
      solution: "✅ 배움에서 끝나지 않습니다. AI로 실행까지 책임집니다."
    },
    {
      emoji: "📉",
      title: "구독자 2,700명에서 정체",
      review: "\"9개월간 구독자 2700명.. 그 이상 성장이 불가능했습니다\"",
      solution: "✅ 터진 영상 구조를 분석해서 내 것으로 만드세요."
    }
  ];

  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="lg">
        <Title order={2} ta="center" style={{ color: '#fff', marginBottom: '60px' }}>
          혹시 이런 상황이신가요?
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
          {pains.map((p, i) => (
            <Card key={i} padding="xl" radius="lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Text size="32px" mb="md">{p.emoji}</Text>
              <Text fw={700} size="xl" c="white" mb="sm">{p.title}</Text>
              <Box p="md" bg="rgba(0,0,0,0.3)" style={{ borderRadius: '8px', borderLeft: '3px solid #6b7280' }} mb="lg">
                <Text size="sm" c="dimmed" fs="italic">{p.review}</Text>
              </Box>
              <Text size="sm" fw={600} style={{ color: '#a78bfa' }}>{p.solution}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 5. STORY SECTION ============
function StorySection() {
  return (
    <Box py={100} style={{ background: '#0a0a14', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <Container size="md">
        <Stack align="center" gap="xl">
          <Badge variant="dot" size="lg" color="gray">My Story</Badge>
          <Title order={2} ta="center" c="white">
            저도 처음엔 조회수 <span style={{ textDecoration: 'line-through', color: '#6b7280' }}>10회</span>도 안 나왔습니다.
          </Title>

          <Timeline active={2} bulletSize={24} lineWidth={2}>
            <Timeline.Item bullet={<Box w={10} h={10} bg="gray" style={{ borderRadius: '50%' }} />} title="4년 전" lineVariant="dashed">
              <Text c="dimmed" size="sm">조회수 10회 미만. 방향성 없이 영상만 올리던 시절.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<Box w={10} h={10} bg="indigo" style={{ borderRadius: '50%' }} />} title="터지는 원리 발견">
              <Text c="dimmed" size="sm">수천 개의 떡상 영상을 분석하며 '공통된 패턴' 발견.</Text>
            </Timeline.Item>
            <Timeline.Item bullet={<Box w={10} h={10} bg="pink" style={{ borderRadius: '50%' }} />} title="현재">
              <Text c="white" size="sm" fw={700}>4개 채널 운영, 누적 1.8억 뷰 달성.</Text>
              <Text c="dimmed" size="sm" mt={4}>이제 그 노하우를 AI에 담았습니다.</Text>
            </Timeline.Item>
          </Timeline>
        </Stack>
      </Container>
    </Box>
  );
}

// ============ 6. HOW IT WORKS (AI 3-Step) ============
function HowItWorksSection() {
  return (
    <Box py={100} style={{ background: '#111827' }}>
      <Container size="lg">
        <Title order={2} ta="center" c="white" mb="xl">
          AI 스크립트, <span style={{ color: '#fbbf24' }}>3단계로 끝</span>납니다.
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="dark">1</ThemeIcon>
            <Title order={4} c="white">레퍼런스 입력</Title>
            <Text ta="center" c="dimmed">벤치마킹하고 싶은<br />영상 URL만 넣으세요.</Text>
          </Stack>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="grape">2</ThemeIcon>
            <Title order={4} c="white">AI 구조 분석 (30초)</Title>
            <Text ta="center" c="dimmed">후킹 포인트와 논리 구조를<br />AI가 파악합니다.</Text>
          </Stack>
          <Stack align="center" gap="md">
            <ThemeIcon size={64} radius="xl" color="pink">3</ThemeIcon>
            <Title order={4} c="white">대본 완성</Title>
            <Text ta="center" c="dimmed">촬영만 하면 되는<br />완벽한 대본이 나옵니다.</Text>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 7. CURRICULUM & PRICING (Final) ============
// (FAQ, Pricing, Guarantee 등 나머지 섹션은 기존 코드 유지 및 보완)

// ============ [통합 Export] ============
export default function LandingPage() {
  return (
    <main>
      <LandingHeader />
      <HeroSection />
      <SocialProofSection />
      <AIRevealSection />
      <PainPointSection />
      <StorySection />
      <HowItWorksSection />
      {/* 
         이후 섹션들: 
         - SolutionSection (기존)
         - LectureAIMappingSection (기존)
         - Curriculum (새로 추가 예정)
         - Pricing (업데이트 예정)
         - FAQ (기존)
         - Final CTA (업데이트 예정)
         - Footer (기존)
      */}
      {/* 임시로 Pricing 추가 */}
      <PackageSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}

// ============ Helper Components (Pricing, FAQ, CTA, Footer) Copied from previous context ============
// (To make the code complete, I would include the remaining components with updated content here, but for brevity in this response, I will focus on the main structural changes above. 
//  In the actual file write, I will include EVERYTHING.)

function PackageSection() {
  const competitors = [
    { name: '크리투스', price: '99만원', ai: false, lectures: true, period: '100일', highlight: false },
    { name: '부업부부', price: '160만원', ai: false, lectures: true, period: '기수제', highlight: false },
    { name: '마스터플랜', price: '50만원', ai: true, lectures: true, period: '강의 평생', highlight: true },
  ];

  return (
    <Box py={100} style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Badge size="lg" variant="light" color="cyan" radius="xl">
            💰 가격 비교
          </Badge>
          <Title order={2} ta="center" c="white" style={{ fontSize: '36px' }}>
            강의만 파는 곳과 <span style={{ color: '#00D9FF' }}>다릅니다</span>
          </Title>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing={24}>
          {competitors.map((comp, i) => (
            <motion.div
              key={i}
              whileHover={{ y: comp.highlight ? -12 : -4, scale: comp.highlight ? 1.02 : 1.01 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Paper
                p="xl"
                radius="xl"
                style={{
                  background: comp.highlight
                    ? 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(139, 92, 246, 0.08))'
                    : 'rgba(255,255,255,0.02)',
                  border: comp.highlight
                    ? '2px solid #00D9FF'
                    : '1px solid rgba(255,255,255,0.1)',
                  boxShadow: comp.highlight
                    ? '0 0 60px rgba(0, 217, 255, 0.2), 0 25px 50px rgba(0, 0, 0, 0.3)'
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {comp.highlight && (
                  <Badge
                    style={{
                      position: 'absolute',
                      top: '-1px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #00D9FF, #a78bfa)',
                    }}
                  >
                    ⭐ 추천
                  </Badge>
                )}

                <Stack align="center" gap="md" mt={comp.highlight ? 'md' : 0}>
                  <Text ta="center" size="lg" fw={700} style={{ color: comp.highlight ? '#00D9FF' : 'rgba(255,255,255,0.7)' }}>
                    {comp.name}
                  </Text>

                  <Text
                    ta="center"
                    fw={800}
                    style={{
                      fontSize: comp.highlight ? '48px' : '32px',
                      color: comp.highlight ? '#fff' : 'rgba(255,255,255,0.8)',
                    }}
                  >
                    {comp.price}
                  </Text>

                  <Divider w="100%" color={comp.highlight ? 'cyan' : 'gray.8'} />

                  <Stack gap="sm" w="100%">
                    <Group gap="sm">
                      <Check size={18} color={comp.lectures ? '#22c55e' : '#6b7280'} />
                      <Text size="sm" c="dimmed">강의 제공</Text>
                    </Group>
                    <Group gap="sm">
                      {comp.ai ? (
                        <Check size={18} color="#22c55e" />
                      ) : (
                        <X size={18} color="#ef4444" />
                      )}
                      <Text size="sm" style={{ color: comp.ai ? '#22c55e' : '#6b7280', fontWeight: comp.ai ? 700 : 400 }}>
                        AI 스크립트 도구
                      </Text>
                    </Group>
                    <Group gap="sm">
                      <Clock size={18} color="#6b7280" />
                      <Text size="sm" c="dimmed">{comp.period}</Text>
                    </Group>
                  </Stack>

                  {comp.highlight && (
                    <Button
                      component={Link}
                      href="/dashboard"
                      fullWidth
                      size="lg"
                      radius="xl"
                      mt="md"
                      style={{
                        background: 'linear-gradient(135deg, #00D9FF, #a78bfa)',
                        fontWeight: 700,
                      }}
                    >
                      지금 시작하기
                    </Button>
                  )}
                </Stack>
              </Paper>
            </motion.div>
          ))}
        </SimpleGrid>

        {/* 직원 비유 - 더 임팩트 있게 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Box
            mt={60}
            p="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <Group justify="center" gap="xl" wrap="wrap">
              <Stack gap={4} align="center">
                <Text size="sm" c="dimmed">스크립트 작가 1명</Text>
                <Text size="xl" fw={800} c="white">월 200만원</Text>
              </Stack>
              <Text size="xl" c="dimmed">vs</Text>
              <Stack gap={4} align="center">
                <Text size="sm" c="dimmed">AI 스크립트 1년</Text>
                <Text size="xl" fw={800} style={{ color: '#ec4899' }}>50만원</Text>
              </Stack>
            </Group>
            <Text c="dimmed" mt="lg">
              = <b style={{ color: '#fff' }}>월 4만원</b> = 커피 10잔 값으로 <b style={{ color: '#a78bfa' }}>평생 일하는 직원</b>을 고용하세요
            </Text>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

function FAQSection() {
  const faqs = [
    { q: "AI 1도 몰라도 되나요?", a: "네. 버튼 3개만 누르면 됩니다. 원리는 강의에서 알려드려요." },
    { q: "진짜 수익이 나나요?", a: "전자책 수강생 중 월 700만원 달성자가 있습니다. 실행만 하시면 됩니다." },
    { q: "환불 되나요?", a: "7일 이내, 강의 10강 미만, AI 10회 미만 사용 시 100% 환불해드립니다." },
    { q: "강의 기간은요?", a: "강의는 평생 소장, AI 도구는 1년 이용권입니다." },
  ];
  return (
    <Box py={100} bg="#111827">
      <Container size="md">
        <Title order={2} ta="center" c="white" mb="xl">FAQ</Title>
        <Accordion variant="separated">
          {faqs.map((f, i) => (
            <Accordion.Item key={i} value={f.q} style={{ background: '#1f2937', border: 'none' }}>
              <Accordion.Control style={{ color: 'white' }}>{f.q}</Accordion.Control>
              <Accordion.Panel style={{ color: '#d1d5db' }}>{f.a}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </Box>
  );
}

function CTASection() {
  return (
    <Box py={100} bg="#0a0a14" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <Container size="md">
        <Stack align="center" gap="xl">
          <Title order={2} c="white" ta="center">3분이면 충분합니다.<br />직접 경험해보세요.</Title>
          <Button component={Link} href="/dashboard" size="xl" radius="xl" color="pink" h={60} fz={20}>
            🔥 1기 30명 한정 시작하기
          </Button>
          <Text c="dimmed" size="sm">✅ 7일 100% 환불 보장 | ✅ 카드 등록 없음</Text>
        </Stack>
      </Container>
    </Box>
  );
}

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
          <Text size="sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © 2026 FlowSpot. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}
