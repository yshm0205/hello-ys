'use client';

/**
 * FlowSpot 랜딩 페이지 (Final Strategy Applied)
 * 전략: 7대 규칙 기반 (수강생=전자책, AI=본인사용)
 * Update: 2026-01-23
 */

import { useState, useEffect, useRef } from 'react';
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
import { motion, useInView } from 'framer-motion';

// 🔥 카운트업 애니메이션 컴포넌트
function CountUp({
  end,
  suffix = '',
  duration = 2000,
  style
}: {
  end: number;
  suffix?: string;
  duration?: number;
  style?: React.CSSProperties;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo for dramatic effect
      const eased = 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(end * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref} style={style}>
      {count.toLocaleString()}{suffix}
    </span>
  );
}

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
        background: 'linear-gradient(180deg, #130a26 0%, #1e1b4b 60%, #111827 100%)', // 딥 퍼플 그라데이션
        paddingTop: 'clamp(80px, 15vh, 120px)',
        paddingBottom: 'clamp(60px, 10vh, 100px)',
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
            linear-gradient(rgba(167, 139, 250, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(167, 139, 250, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 글로우 오브 (보라색 강화) - 모바일 대응 */}
      <Box
        style={{
          position: 'absolute',
          top: '0%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '1200px',
          height: '80vh',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.15) 40%, transparent 70%)',
          filter: 'blur(120px)',
          pointerEvents: 'none',
        }}
      />

      <Container size="md" style={{ position: 'relative', zIndex: 1, padding: '0 16px' }}>
        <Stack align="center" gap="xl">

          {/* 메인 배너 이미지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            style={{ width: '100%', maxWidth: '800px' }}
          >
            <Box
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(139, 92, 246, 0.4), 0 0 0 1px rgba(255,255,255,0.1)',
                border: '4px solid rgba(255,255,255,0.05)',
                background: '#130a26',
                aspectRatio: '16 / 7',
              }}
            >
              <img
                src="/images/hero_banner_300.png"
                alt="유튜브 쇼츠로 월 300만원 - VOD & AI 스크립트 자동화 & 트렌드 채널 리스트 올인원 패키지"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  objectFit: 'cover',
                  objectPosition: 'center center',
                }}
              />
              <Box style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(105deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.02) 100%)',
                pointerEvents: 'none'
              }} />
            </Box>
          </motion.div>

          {/* 메인 헤드라인 (면죄부) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Stack align="center" gap="xs">
              <Text
                ta="center"
                style={{
                  fontSize: 'clamp(32px, 5vw, 40px)',
                  fontWeight: 700,
                  color: '#FFFFFF', // 벤치마크 규칙: 메인 텍스트는 무조건 Pure White
                  letterSpacing: '-0.02em',
                  textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                }}
              >
                수백만 원 강의 듣고도 조회수 100회?
              </Text>
              <Text
                ta="center"
                style={{
                  fontSize: 'clamp(48px, 8vw, 72px)',
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: '#FFFFFF',
                  letterSpacing: '-0.03em',
                  textShadow: '0 4px 30px rgba(139, 92, 246, 0.6), 0 2px 0px rgba(0,0,0,0.8)' // 보라색 글로우 섀도우
                }}
              >
                당신의 <span style={{ color: '#ff4d4d', textDecoration: 'underline', textDecorationColor: '#ff4d4d', textUnderlineOffset: '8px' }}>탓이 아닙니다.</span>
              </Text>
            </Stack>
          </motion.div>

          {/* 서브 헤드라인 (실행 + AI 직원) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Stack align="center" gap="xl" mt="xl">
              <Box p="md" style={{ background: 'rgba(17, 24, 39, 0.6)', borderRadius: '20px', backdropFilter: 'blur(10px)', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', width: '100%' }}>
                <Text size="xl" ta="center" style={{ color: '#f3f4f6', fontSize: 'clamp(16px, 4vw, 24px)', maxWidth: '800px', lineHeight: 1.6, fontWeight: 500, margin: '0 auto' }}>
                  문제는 '의지'가 아니라 <span style={{ color: '#fff', fontWeight: 800 }}>'실행'</span>입니다. 혼자 하긴 벅차니까요.<br />
                  그래서 <span style={{ color: '#a78bfa', fontWeight: 800 }}>검증된 노하우</span>에 <span style={{ color: '#a78bfa', fontWeight: 800 }}>AI 직원들</span>을 더했습니다.
                </Text>
              </Box>
              <Text size="xl" ta="center" style={{ color: '#ffffff', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                이제 골치 아픈 '실행'은 AI에게 위임하고, <br className="block sm:hidden" />당신은 <span style={{ fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: '4px' }}>결과</span>만 확인하세요.
              </Text>
            </Stack>
          </motion.div>

          {/* 핵심 구성 배지 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Group gap="sm" justify="center" mt="lg" wrap="wrap">
              <Badge size="lg" variant="filled" color="dark" radius="xl" style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 28px)', height: 'auto', border: '1px solid rgba(139, 92, 246, 0.4)', fontSize: 'clamp(14px, 3.5vw, 18px)', background: 'rgba(17, 24, 39, 0.8)' }}>
                🧠 59강 영상 강의
              </Badge>
              <Text size="xl" fw={900} style={{ color: '#a78bfa' }}>+</Text>
              <Badge size="lg" variant="gradient" gradient={{ from: 'violet', to: 'indigo' }} radius="xl" style={{ padding: 'clamp(12px, 3vw, 20px) clamp(16px, 4vw, 28px)', height: 'auto', border: '1px solid rgba(255,255,255,0.2)', fontSize: 'clamp(14px, 3.5vw, 18px)', boxShadow: '0 0 25px rgba(139, 92, 246, 0.5)' }}>
                🤖 AI 직원 3인방
              </Badge>
            </Group>
          </motion.div>

          {/* AI 도구 시연 GIF/스크린샷 플레이스홀더 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ width: '100%', maxWidth: '800px' }}
          >
            <Box
              style={{
                position: 'relative',
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              {/* 브라우저 프레임 */}
              <Box style={{
                height: '48px',
                background: 'linear-gradient(to right, #1a1a2e, #16213e)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                <Box style={{ flex: 1, marginLeft: '16px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                  <Text size="sm" c="dimmed">flowspot.ai/dashboard</Text>
                </Box>
              </Box>

              {/* GIF/스크린샷 영역 */}
              <Box
                style={{
                  background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
                  aspectRatio: '16/9',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '20px',
                }}
              >
                {/* 플레이스홀더 아이콘 */}
                <Box
                  style={{
                    width: '96px',
                    height: '96px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 217, 255, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(139, 92, 246, 0.5)',
                  }}
                >
                  <Bot size={48} color="#a78bfa" />
                </Box>
                <Stack align="center" gap="xs">
                  <Text fw={600} size="xl" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    AI 도구 시연 영상
                  </Text>
                  <Text size="md" c="dimmed">
                    (GIF 또는 스크린샷으로 교체 예정)
                  </Text>
                </Stack>
                <Badge variant="outline" color="violet" size="lg" style={{ fontSize: '16px', padding: '12px 20px' }}>
                  🎬 3분 만에 대본 완성
                </Badge>
              </Box>
            </Box>
          </motion.div>
        </Stack>
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


// ============ 1.5 PAIN POINT 1단계 (일반 Pain Point) ============
function PainPoint1Section() {
  const painPoints = [
    {
      icon: '📉',
      title: '3개월째 조회수 100회?',
      description: '열심히 올리는데 왜 안 터지는지 모르겠어요...',
    },
    {
      icon: '💸',
      title: '300만원 강의 듣고도 막막?',
      description: '배우긴 했는데, 막상 하려니 뭘 해야 할지...',
    },
    {
      icon: '😩',
      title: '열심히 하는데 왜 안 터지죠?',
      description: '구독자 2,700명에서 더 이상 안 올라가요...',
    },
  ];

  return (
    <Box py={80} style={{ background: 'linear-gradient(180deg, #111827 0%, #0f0f1a 100%)' }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stack align="center" gap="xl">
            {/* 헤더 */}
            <Text
              ta="center"
              style={{
                fontSize: 'clamp(28px, 4vw, 40px)',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              혹시 이런 상황 아니세요?
            </Text>

            {/* Pain Point 카드 3개 */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl" mt="xl" style={{ width: '100%' }}>
              {painPoints.map((pain, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Paper
                    p="xl"
                    radius="lg"
                    style={{
                      background: 'rgba(239, 68, 68, 0.05)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      height: '100%',
                      textAlign: 'center',
                    }}
                  >
                    <Stack align="center" gap="md">
                      <Text style={{ fontSize: 'clamp(32px, 10vw, 48px)' }}>{pain.icon}</Text>
                      <Text
                        fw={700}
                        style={{
                          fontSize: 'clamp(16px, 4.5vw, 22px)',
                          color: '#FF4D4D',
                        }}
                      >
                        ❌ {pain.title}
                      </Text>
                      <Text
                        style={{
                          color: '#9ca3af',
                          fontSize: 'clamp(14px, 3.5vw, 16px)',
                          fontStyle: 'italic',
                        }}
                      >
                        "{pain.description}"
                      </Text>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </SimpleGrid>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}


// ============ 2. SOCIAL PROOF (전자책 성공 사례) ============
function SocialProofSection() {
  // 모달 상태
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 실제 후기 데이터 (업데이트됨)
  const results = [
    {
      title: "월 1,356만원",
      subtitle: "28일 조회수 7,613만",
      icon: "💰",
      color: "#22c55e",
      review: "유튜브 스튜디오 인증",
      quote: "원초적인사이트님 덕분에 쇼츠로 월 1,300만원 이상씩 꾸준히 벌고 있습니다."
    },
    {
      title: "48시간 1,200만뷰",
      subtitle: "실시간 폭발 성장",
      icon: "🚀",
      color: "#3b82f6",
      review: "유튜브 스튜디오 캡처",
      quote: "48시간 만에 1,200만 뷰 달성, 실시간 차트 상승 중"
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

  // 실제 유튜브 댓글 리뷰
  const reviews = [
    "혼자서 쇼츠부업도 해보고 다른강의도 여러개 들어봤는데 이 전자책이 가장 도움이 많이 되네요 - @hzksiwb-p7z",
    "다시 펼쳐 읽어보니 훨씬 더 깊은 인사이트와 실질적인 팁들을 발견할 수 있었습니다 - @auggie-x6x",
    "전자책 내용 단번에 읽어 내려갔고 편집 강의 및 프로그램 등 너무 유용해서 좋았습니다 - @재율-z1c",
    "정말 다양하고 내용이 알차요... 시야도 훨씬 넓어졌고, 시간가는줄 모르고 보다가 왔네요 - @월드뷰티",
    "전자책 구매한지 3개월 됐는데 아직도 읽어보면서 잘 활용하고 있습니다 - @파레트-p9l",
    "전자책 구매했는데 구성이 너무 좋습니다. 지금까지 산 전자책 중에서 최고네요 - @무사-z1s",
    "기존 리뷰 채널 운영하며 시청시간이 안 나와 고생했는데, 이번에 제대로 공부해서 잘해보려고 합니다 - @viewpang",
    "저 같은 초보한테 유효한 내용이 담겨있어서 돈이 아깝지 않네요 - @귀욤-w7i",
  ];

  // 이미지 갤러리 (실제 이미지)
  const reviewImages = [
    { id: 1, alt: "월 1356만원 수익 인증", src: "/images/reviews/review_1_revenue.png" },
    { id: 2, alt: "48시간 1200만 뷰", src: "/images/reviews/review_2_realtime.png" },
    { id: 3, alt: "카톡 후기 1", src: "/images/reviews/review_3_kakao.png" },
    { id: 4, alt: "카톡 후기 2", src: "/images/reviews/review_4_kakao.png" },
    { id: 5, alt: "카톡 후기 3", src: "/images/reviews/review_5_kakao.png" },
    { id: 6, alt: "유튜브 댓글 1", src: "/images/reviews/review_6_youtube.png" },
    { id: 7, alt: "유튜브 댓글 2", src: "/images/reviews/review_7_kakao.png" },
    { id: 8, alt: "카톡 후기 4", src: "/images/reviews/review_8_kakao.png" },
  ];


  return (
    <>
      {/* 이미지 확대 모달 */}
      {selectedImage && (
        <Box
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            padding: '20px',
          }}
        >
          <img
            src={selectedImage}
            alt="확대 이미지"
            style={{
              width: '100%',
              maxWidth: '900px',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: '16px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
          />
          <Text
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
            }}
          >
            ✕
          </Text>
        </Box>
      )}
      <Box py={100} style={{ background: '#111827' }}>
        <Container size="lg">

          {/* 헤더 */}
          <Stack align="center" gap="xl" mb={60}>
            <Badge size="lg" variant="light" color="green" radius="xl">
              ✅ 전자책을 보신 분들의 성과
            </Badge>
            <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '36px' }}>
              실제로 전자책을 보신 분들이 <span style={{ color: '#22c55e' }}>이렇게 말씀해주셨어요</span>
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              같은 원리로 먼저 성과 낸 분들
            </Text>
          </Stack>



          {/* 🔥 HERO PROOF - 가장 임팩트 있는 성과 (풀와이드) */}
          <Box mt={60}>
            <Paper
              p="xl"
              radius="xl"
              onClick={() => setSelectedImage("/images/reviews/review_1_revenue.png")}
              style={{
                background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                border: '2px solid rgba(34,197,94,0.4)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Group align="center" gap="xl" wrap="nowrap">
                <Box
                  style={{
                    width: '280px',
                    height: '180px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    flexShrink: 0,
                    border: '2px solid rgba(34,197,94,0.3)',
                    background: '#1a1a2e',
                  }}
                >
                  <img
                    src="/images/reviews/review_1_revenue.png"
                    alt="월 1356만원 수익 인증"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </Box>
                <Stack gap="md" style={{ flex: 1 }}>
                  <Text style={{ fontSize: '48px', fontWeight: 800, color: '#22c55e' }}>
                    💰 월 1,356만원
                  </Text>
                  <Text size="lg" style={{ color: '#d1d5db' }}>
                    "원초적인사이트님 덕분에 쇼츠로 <span style={{ color: '#22c55e', fontWeight: 600 }}>월 1,300만원 이상씩</span> 꾸준히 벌고 있습니다. 진심으로 감사드립니다!"
                  </Text>
                  <Text c="dimmed">— 지맥하는 제이지 (유튜브 스튜디오 인증)</Text>
                </Stack>
              </Group>
            </Paper>
          </Box>

          {/* 🔥 하이라이트 성과 3개 */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" mt="xl">
            {[
              { src: "/images/reviews/review_2_realtime.png", title: "🚀 48시간 1,200만뷰", text: "실시간으로 폭발 성장 중!", author: "수강생 인증" },
              { src: "/images/reviews/review_7_kakao.png", title: "👥 구독자 1,000명 달성", text: "시작 2주 만에 수익창출 조건 충족!", author: "아이디어 프로도" },
              { src: "/images/reviews/review_6_youtube.png", title: "📈 48시간 10만뷰", text: "만벽 깨니까 조회수 쭉쭉 올라가네요!", author: "리듬타는 제이지" },
            ].map((item, i) => (
              <Paper key={i} p="lg" radius="lg" onClick={() => setSelectedImage(item.src)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center' }}>
                <Box style={{ width: '100%', height: '120px', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
                  <img src={item.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Text fw={700} style={{ color: '#f59e0b', fontSize: '20px' }}>{item.title}</Text>
                <Text size="sm" c="dimmed" mt="xs">{item.text}</Text>
                <Text size="xs" c="dimmed" mt="sm">— {item.author}</Text>
              </Paper>
            ))}
          </SimpleGrid>

          {/* 📝 상세 후기 그리드 */}
          <Box mt={60}>
            <Text fw={600} mb="lg" ta="center" c="dimmed">📸 77건 인증 후기 중 일부</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {[
                { id: 1, src: "/images/reviews/review_3_kakao.png", text: "하민님 덕분에 쇼츠로 월 700이상씩 꾸준히 벌고 있습니다~! 진심으로 감사드립니다^^", highlight: "월 700이상", author: "지맥하는 제이지" },
                { id: 2, src: "/images/reviews/review_4_kakao.png", text: "전자책 후기입니다. 계속해서 돈을 벌 수 있는 방법을 찾고 있었는데, 드디어 방법을 찾은 것 같습니다!", highlight: "드디어 방법을 찾았다", author: "양손 엄지척 무지" },
                { id: 3, src: "/images/reviews/review_5_kakao.png", text: "전자책리뷰입니다. 초보자에게 꼭 필요한 내용들이 자세히 담겨 있어서 큰 도움이 되네요. 덕분에 다시 용기를 내서 방향을 잡아볼 수 있을 것 같아요!", highlight: "다시 용기를 내서", author: "베개를 부비적대는 라이언" },
                { id: 4, src: "/images/reviews/review_8_kakao.png", text: "처음엔 강의 가격이 너무 부담스러워서 혼자 해보려고 했는데, 우연히 유튜브 영상 보고 전자책까지 구매했어요. 초보자에게 꼭 필요한 내용들이 담겨 있어요!", highlight: "초보자에게 꼭 필요한", author: "권투하는 무지" },
                { id: 5, src: "/images/reviews/comment_osy.png", text: "300만원 유료 강의도 들어봤는데, 이 이북이 몇백 하는 유료 강의급입니다. 쇼츠 유료 강의 수강 고민하시는 분이라면 이 이북부터 보고 채널 운영해 보시길 권해드립니다.", highlight: "300만원 강의급", author: "@osy-b2j" },
                { id: 6, src: "/images/reviews/comment_mungge.png", text: "유튜브도 쇼츠도 처음이라 막막했는데 캡컷 편집 강의가 너무 쉽게 잘 구성되어 있어서 큰 도움이 됩니다. 편집이 손에 익을 때까지 자주 볼 것 같아요.", highlight: "편집 강의가 너무 쉽게", author: "@뭉게뭉게-y3j" },
                { id: 7, src: "/images/reviews/comment_comfort.png", text: "하고자 하는 방향을 찾지 못하고 방황하던 중 아주 귀인을 만난 기분입니다. 전자책 잘 받았습니다. 포기하지 않고 꾸준히 따라가 보겠습니다!", highlight: "귀인을 만난 기분", author: "@Comfort-Nation" },
                { id: 8, src: "/images/reviews/comment_aljjabang.png", text: "말 그대로 실전 중심의 전자책 같습니다. 단순 이론이 아니라 직접 쇼츠 제작에 바로 적용할 수 있는 실용적인 내용이 정리되어 있어서 초보자도 따라갈 수 있습니다.", highlight: "실전 중심", author: "@알짜방" },
                { id: 9, src: "/images/reviews/comment_ali3rangka.png", text: "쇼츠가 궁금해서 구매했는데 전자책 구성이 잘 되어있는 것 같아요. 감사합니다!", highlight: "전자책 구성이 잘 되어있는", author: "@ali3rangka" },
                { id: 10, src: "/images/reviews/comment_ssdaddy.png", text: "해외에 거주한다는 이유때문에 강의 문의를 보냈어도 대부분 무시를 하셨는데 이 분은 정말 찐이십니다. 현실적인 조언 많이 주셔서 감사합니다.", highlight: "이 분은 정말 찐이십니다", author: "@Ssdaddy012" },
                { id: 11, src: "/images/reviews/comment_dodomom.png", text: "잠깐 하고 말려면 꼼수에 미치면 되지만, 오래 잘 하려면 본질에 집중해야 한다는 철학과 잘 맞는 전자책이었습니다. 고맙습니다.", highlight: "본질에 집중", author: "@도도맘맘" },
                { id: 12, src: "/images/reviews/comment_runforever.png", text: "내용이 체계적이고 초보자가 쉽게 파악할 수 있게 되어 있네요. 앞으로 유튜브 공략하는데 큰 도움이 될것 같습니다. 감사합니다.", highlight: "체계적이고 초보자가 쉽게", author: "@runforever524" },
              ].map((card) => (
                <Paper key={card.id} p="lg" radius="lg" onClick={() => card.src && setSelectedImage(card.src)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', cursor: card.src ? 'pointer' : 'default' }}>
                  <Group align="flex-start" gap="md">
                    {card.src && (
                      <Box style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)', background: '#1f2937' }}>
                        <img src={card.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </Box>
                    )}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm" style={{ color: '#d1d5db', lineHeight: 1.6 }}>
                        {card.text.split(card.highlight).map((part, i, arr) => (
                          <span key={i}>{part}{i < arr.length - 1 && <span style={{ color: '#f59e0b', fontWeight: 600 }}>{card.highlight}</span>}</span>
                        ))}
                      </Text>
                      <Text size="xs" c="dimmed">— {card.author}</Text>
                    </Stack>
                  </Group>
                </Paper>
              ))}
            </SimpleGrid>
          </Box>

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

          {/* 🔴 BUT 반전 + Pain Point 2단계 (막막형/귀찮형) */}
          <Box mt={80}>
            {/* 브릿지 문구 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Stack align="center" gap="lg" mb={60}>
                <Text style={{ fontSize: '48px', fontWeight: 400, color: '#a1a1aa' }}>
                  그런데...
                </Text>
                <Text size="xl" ta="center" style={{ color: '#e5e7eb', maxWidth: '700px', lineHeight: 1.9, fontSize: '22px' }}>
                  <span style={{ color: '#a78bfa', fontWeight: 700 }}>이런 분들도 있었어요.</span>
                </Text>
                <Text ta="center" style={{ color: '#9ca3af', fontSize: '18px', maxWidth: '600px' }}>
                  "알긴 아는데 실행이 안 돼요"라고 하시는 분들
                </Text>
              </Stack>
            </motion.div>

            {/* 막막형 / 귀찮형 2개 카드 */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              {[
                {
                  icon: '😰',
                  type: '막막형',
                  headline: '채널 분석한다고 유튜브만 3시간... 결국 오늘도 영상 0개',
                  subline: '방향은 잡았는데, 막상 시작하려니 뭘 먼저 해야 할지 모르겠어요',
                  problems: [
                    '"공부해야지" 하면서 유튜브만 3시간',
                    '이것저것 찾다가 하루가 끝남',
                    '1주일째 영상 0개, 마음만 급함',
                  ],
                  solution: '막막형을 위해 준비했습니다',
                  solutionDetail: '영상 강의 59강',
                  solutionDesc: '뭘 먼저 해야 하는지, 순서대로 손잡고 알려드려요',
                  color: '#a78bfa',
                },
                {
                  icon: '😫',
                  type: '귀찮형',
                  headline: '대본 썼다 지우고, 2시간 동안 제자리... 결국 내일로 미룸',
                  subline: '알긴 아는데, 빈 화면 보면 손이 안 가요',
                  problems: [
                    '대본 쓰려고 앉으면 막막해서 멍',
                    '썼다 지우고 2시간, 결국 마음에 안 듦',
                    '"내일 해야지" 하고 한 달째',
                  ],
                  solution: '귀찮형을 위해 준비했습니다',
                  solutionDetail: 'AI 직원 3인방',
                  solutionDesc: '레퍼런스만 넣으면 3분 만에 대본 완성',
                  color: '#00D9FF',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                  whileHover={{ y: -4 }}
                >
                  <Paper
                    p={32}
                    radius="lg"
                    style={{
                      background: 'rgba(17, 24, 39, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      height: '100%',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Stack gap="lg">
                      {/* 이모지 + 타입 */}
                      <Group gap="md">
                        <Text style={{ fontSize: '48px' }}>{item.icon}</Text>
                        <Badge size="lg" variant="light" color={i === 0 ? 'violet' : 'cyan'} radius="xl">
                          {item.type}
                        </Badge>
                      </Group>

                      {/* 헤드라인 */}
                      <Text fw={700} style={{ fontSize: '20px', color: '#fff', lineHeight: 1.4 }}>
                        "{item.headline}"
                      </Text>

                      {/* 서브라인 */}
                      <Text style={{ color: '#9ca3af', fontSize: '15px', fontStyle: 'italic', marginTop: '-8px' }}>
                        {item.subline}
                      </Text>

                      {/* 문제점 리스트 */}
                      <Stack gap="sm">
                        {item.problems.map((problem, idx) => (
                          <Group key={idx} gap="sm" align="flex-start">
                            <Text style={{ color: '#FF4D4D', fontWeight: 700 }}>❌</Text>
                            <Text style={{ color: '#9ca3af', fontSize: '15px' }}>{problem}</Text>
                          </Group>
                        ))}
                      </Stack>

                      {/* 구분선 */}
                      <Box style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '8px 0' }} />

                      {/* 해결책 */}
                      <Stack gap="xs">
                        <Text style={{ color: '#9ca3af', fontSize: '14px' }}>{item.solution}</Text>
                        <Text fw={700} style={{ fontSize: '24px', color: item.color }}>
                          → {item.solutionDetail}
                        </Text>
                        <Text style={{ color: '#d1d5db', fontSize: '15px' }}>{item.solutionDesc}</Text>
                      </Stack>
                    </Stack>
                  </Paper>
                </motion.div>
              ))}
            </SimpleGrid>

            {/* AI Reveal 연결 - 새로운 전환 멘트 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Stack align="center" gap={32} mt={100}>
                <Title order={2} ta="center" style={{ color: '#fff', fontSize: '52px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  그래서 준비했습니다.
                </Title>
                <Text ta="center" style={{ color: '#d1d5db', lineHeight: 1.8, fontSize: '26px', maxWidth: '700px' }}>
                  <b style={{ color: '#fff' }}>막막함</b>은 강의로,<br />
                  <b style={{ color: '#fff' }}>귀찮음</b>은 AI로 해결합니다.
                </Text>
                <Group gap={60} mt={40} justify="center" wrap="wrap" align="flex-start">
                  <Stack align="center" gap={16} style={{ maxWidth: '320px' }}>
                    <Box style={{
                      width: '240px',
                      height: '160px',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(167, 139, 250, 0.1)',
                      border: '1px solid rgba(167, 139, 250, 0.2)',
                    }}>
                      <img src="/images/lecture-vod-new.png" alt="59강 강의" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 60%, rgba(10,10,20,0.8))',
                        pointerEvents: 'none',
                      }} />
                    </Box>
                    <Text fw={600} style={{ color: '#fff', fontSize: '18px' }}>처음부터 끝까지 알려주는</Text>
                    <Text fw={700} style={{ color: '#a78bfa', fontSize: '28px' }}>59강 강의</Text>
                  </Stack>

                  <Box style={{ width: '1px', height: '140px', background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.1), transparent)' }} visibleFrom="md" />

                  <Stack align="center" gap={16} style={{ maxWidth: '320px' }}>
                    <Box style={{
                      width: '240px',
                      height: '160px',
                      borderRadius: '24px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 20px rgba(0, 217, 255, 0.1)',
                      border: '1px solid rgba(0, 217, 255, 0.2)',
                    }}>
                      <img src="/images/ai-team-new.png" alt="AI 직원" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <Box style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 60%, rgba(10,10,20,0.8))',
                        pointerEvents: 'none',
                      }} />
                    </Box>
                    <Text fw={600} style={{ color: '#fff', fontSize: '18px' }}>대본을 대신 써주는</Text>
                    <Text fw={700} style={{ color: '#00D9FF', fontSize: '28px' }}>AI 직원</Text>
                  </Stack>
                </Group>
              </Stack>
            </motion.div>
          </Box>

          <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
        </Container>
      </Box>
    </>
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

          {/* 권위 인용 - 샘 알트만 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Box
              p="xl"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.05), rgba(139, 92, 246, 0.05))',
                border: '1px solid rgba(0, 217, 255, 0.2)',
                maxWidth: '800px',
                position: 'relative',
              }}
            >
              <Quote size={40} color="rgba(0, 217, 255, 0.3)" style={{ position: 'absolute', top: '16px', left: '20px' }} />
              <Stack gap="md" pl={50}>
                <Text size="lg" style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.8, fontStyle: 'italic' }}>
                  "AI를 사용하는 사람이 AI를 사용하지 않는 사람을 대체할 것이다."
                </Text>
                <Group gap="sm">
                  <Box w={40} h={40} style={{ borderRadius: '50%', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Text fw={700} size="sm" style={{ color: '#00D9FF' }}>S</Text>
                  </Box>
                  <Stack gap={0}>
                    <Text size="sm" fw={600} c="white">Sam Altman</Text>
                    <Text size="xs" c="dimmed">OpenAI CEO</Text>
                  </Stack>
                </Group>
              </Stack>
            </Box>
          </motion.div>

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

// ============ 5. STORY SECTION (권위 - 앞으로 이동됨) ============
function StorySection() {
  return (
    <Box py={120} style={{ background: '#0a0a14', color: '#fff' }}>
      <Container size="lg">

        {/* 도입: 공감 */}
        <Stack align="center" gap="xl" mb={100}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Title order={2} ta="center" style={{ fontSize: '48px', lineHeight: 1.3 }}>
              사실, <span style={{ color: '#a78bfa' }}>저도 시작은 똑같았습니다.</span>
            </Title>
          </motion.div>
        </Stack>

        {/* Before: 힘들었던 시절 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} mb={100} style={{ alignItems: 'center' }}>
          {/* Image Placeholder */}
          <Box
            h={400}
            bg="#1f2937"
            style={{ borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563' }}
          >
            <Stack align="center" gap="sm">
              <Text style={{ fontSize: '40px' }}>📉</Text>
              <Text c="dimmed">조회수 10회 스크린샷</Text>
              <Text size="xs" c="dimmed">(이미지 들어갈 자리)</Text>
            </Stack>
          </Box>

          <Stack gap="lg">
            <Title order={3} style={{ fontSize: '32px', lineHeight: 1.4 }}>
              저도 조회수 10회에서 시작했습니다.
            </Title>
            <Text style={{ fontSize: '18px', color: '#d1d5db', lineHeight: 1.8 }}>
              7일 걸려서 만든 영상.<br />
              다음 날 확인한 조회수는 <b>23회</b>.<br />
              댓글 0개. 좋아요 1개.
            </Text>
            <Text style={{ fontSize: '18px', color: '#9ca3af', lineHeight: 1.7, fontStyle: 'italic' }}>
              그 막막함, 겪어보신 분은 아실 겁니다.
            </Text>
          </Stack>
        </SimpleGrid>


        {/* 전환점: 분석 시작 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing={60} mb={100} style={{ alignItems: 'center' }}>
          <Stack gap="lg">
            <Badge variant="dot" color="indigo" size="lg">전환점</Badge>
            <Title order={3} style={{ fontSize: '32px', lineHeight: 1.4 }}>
              그래서 분석을 시작했습니다.
            </Title>
            <Text style={{ fontSize: '18px', color: '#d1d5db', lineHeight: 1.8 }}>
              조회수 100만 넘는 영상들,<br />
              도대체 뭐가 다른 건지.
            </Text>
            <Text style={{ fontSize: '18px', color: '#d1d5db', lineHeight: 1.8 }}>
              초 단위로, 프레임 단위로.<br />
              <b>3,000개 영상</b>을 뜯어봤습니다.
            </Text>
          </Stack>

          {/* Image Placeholder */}
          <Box
            h={400}
            bg="#1f2937"
            style={{ borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563' }}
          >
            <Stack align="center" gap="sm">
              <Text style={{ fontSize: '40px' }}>🧐</Text>
              <Text c="dimmed">분석 노트/엑셀</Text>
              <Text size="xs" c="dimmed">(이미지 들어갈 자리)</Text>
            </Stack>
          </Box>
        </SimpleGrid>


        {/* 성장 과정 */}
        <Stack align="center" gap="xl" mb={80}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Text ta="center" style={{ fontSize: '24px', color: '#d1d5db', lineHeight: 1.8 }}>
              그러다 <span style={{ color: '#a78bfa', fontWeight: 600 }}>패턴이 보이기 시작했습니다.</span><br />
              조금씩 성과가 나오기 시작했고...
            </Text>
          </motion.div>

          {/* 드라마틱 전환 - 여백으로 스크롤 유도 */}
        </Stack>

        {/* 🎯 스크롤 유도 디자인 - 미니멀 */}
        <Stack align="center" gap={0} py={100}>
          {/* 그라데이션 세로선 */}
          <Box
            style={{
              width: '5px',
              height: '250px',
              background: 'linear-gradient(180deg, rgba(167, 139, 250, 0.8) 0%, rgba(167, 139, 250, 0.3) 70%, rgba(167, 139, 250, 0.6) 100%)',
              borderRadius: '100px',
            }}
          />

          {/* 큰 글로우 포인트 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <Box
              mt="lg"
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(167, 139, 250, 0.8)',
                boxShadow: '0 0 40px rgba(167, 139, 250, 1), 0 0 80px rgba(167, 139, 250, 0.6), 0 0 120px rgba(167, 139, 250, 0.4)',
              }}
            />
          </motion.div>
        </Stack>


        {/* 🔥 대형 숫자 - 권위 임팩트 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Box
            py={60}
            mb={60}
            style={{
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* 배경 글로우 효과 */}
            <Box
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '600px',
                height: '400px',
                background: 'radial-gradient(ellipse, rgba(167, 139, 250, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* 메인 숫자 */}
            <Box
              style={{
                fontSize: 'clamp(80px, 15vw, 140px)',
                fontWeight: 900,
                color: '#a78bfa',
                lineHeight: 1,
                textShadow: '0 0 60px rgba(139,92,246,0.4)',
                position: 'relative',
              }}
            >
              <CountUp end={18000} suffix="만뷰" duration={2500} />
            </Box>

            {/* 서브 지표들 */}
            <Group justify="center" gap={60} mt={40} wrap="wrap">
              <Stack align="center" gap={4}>
                <Text
                  style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 800,
                    color: '#3b82f6',
                    lineHeight: 1,
                  }}
                >
                  4개 채널
                </Text>
                <Text size="sm" c="dimmed">운영 중</Text>
              </Stack>
              <Stack align="center" gap={4}>
                <Text
                  style={{
                    fontSize: 'clamp(32px, 5vw, 48px)',
                    fontWeight: 800,
                    color: '#22c55e',
                    lineHeight: 1,
                  }}
                >
                  7만명
                </Text>
                <Text size="sm" c="dimmed">구독자</Text>
              </Stack>
            </Group>
          </Box>
        </motion.div>


        {/* 결과: 스크린샷 + 숫자 */}
        <Stack align="center" gap="xl" mb={80}>
          {/* 스크린샷 3장 플레이스홀더 */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg" style={{ width: '100%', maxWidth: '900px' }}>
            {['채널 1', '채널 2', '채널 3'].map((channel, i) => (
              <Box
                key={i}
                h={200}
                bg="#1f2937"
                style={{ borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #4b5563' }}
              >
                <Stack align="center" gap="xs">
                  <Text style={{ fontSize: '32px' }}>📊</Text>
                  <Text c="dimmed" size="sm">{channel} 스크린샷</Text>
                </Stack>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>


        {/* 핵심 메시지: 차이는 원리 */}
        <Stack align="center" gap="xl" mt={60}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Box
              p={60}
              style={{
                background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15) 0%, rgba(0, 217, 255, 0.1) 100%)',
                borderRadius: '32px',
                border: '1px solid rgba(167, 139, 250, 0.3)',
                textAlign: 'center',
                maxWidth: '800px'
              }}
            >
              <Title order={2} style={{ fontSize: '36px', lineHeight: 1.5, color: '#fff' }}>
                저와 여러분의 차이는 <span style={{ color: '#a78bfa' }}>딱 하나</span>입니다.
              </Title>
              <Text mt="xl" style={{ fontSize: '24px', color: '#d1d5db', lineHeight: 1.6 }}>
                <b style={{ color: '#fff' }}>이 원리를 알고 있느냐, 모르고 있느냐.</b><br />
                그게 전부입니다.
              </Text>
              <Text mt="xl" style={{ fontSize: '20px', color: '#a78bfa' }}>
                그래서 이 원리를 정리했습니다.
              </Text>
            </Box>
          </motion.div>
        </Stack>

      </Container>
    </Box>
  );
}

// ============ 6. HOW IT WORKS (AI 3-Step) ============
function HowItWorksSection() {
  return (
    <Box py={120} style={{ background: '#111827' }}>
      <Container size="lg">
        <Title order={2} ta="center" style={{ color: '#fff', fontSize: '42px', marginBottom: '60px' }}>
          AI 스크립트, <span style={{ color: '#f59e0b' }}>3단계로 끝</span>납니다.
        </Title>
        <SimpleGrid cols={{ base: 1, md: 3 }} spacing={40}>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius="xl" color="dark" style={{ fontSize: '32px', fontWeight: 700 }}>1</ThemeIcon>
            <Title order={3} style={{ color: '#fff', fontSize: '24px' }}>레퍼런스 입력</Title>
            <Text ta="center" style={{ color: '#d1d5db', fontSize: '18px', lineHeight: 1.6 }}>
              벤치마킹하고 싶은<br />영상 URL만 넣으세요.
            </Text>
          </Stack>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius="xl" color="grape" style={{ fontSize: '32px', fontWeight: 700 }}>2</ThemeIcon>
            <Title order={3} style={{ color: '#fff', fontSize: '24px' }}>AI 구조 분석 (30초)</Title>
            <Text ta="center" style={{ color: '#d1d5db', fontSize: '18px', lineHeight: 1.6 }}>
              후킹 포인트와 논리 구조를<br />AI가 파악합니다.
            </Text>
          </Stack>
          <Stack align="center" gap="lg">
            <ThemeIcon size={80} radius="xl" color="pink" style={{ fontSize: '32px', fontWeight: 700 }}>3</ThemeIcon>
            <Title order={3} style={{ color: '#fff', fontSize: '24px' }}>대본 완성</Title>
            <Text ta="center" style={{ color: '#d1d5db', fontSize: '18px', lineHeight: 1.6 }}>
              촬영만 하면 되는<br /><span style={{ color: '#f59e0b', fontWeight: 600 }}>완벽한 대본</span>이 나옵니다.
            </Text>
          </Stack>
        </SimpleGrid>
      </Container>
    </Box>
  );
}

// ============ 7. CURRICULUM & PRICING (Final) ============
// (FAQ, Pricing, Guarantee 등 나머지 섹션은 기존 코드 유지 및 보완)

// ============ Floating CTA (오른쪽 고정 결제 박스) ============
function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 600);
    };
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // 초기값
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 카운트다운 타이머
  useEffect(() => {
    const targetDate = new Date('2026-02-01T00:00:00');
    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  // 📱 모바일 버전 - 펼치기 가능한 하단 고정 바 (클래스101 스타일)
  if (isMobile) {
    return (
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#0f0f19',
          borderTop: '1px solid rgba(167, 139, 250, 0.4)',
          borderRadius: isExpanded ? '20px 20px 0 0' : '0',
          transition: 'all 0.3s ease',
          paddingBottom: 'env(safe-area-inset-bottom)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* 펼치기/접기 토글 버튼 */}
        <Box
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          <Box
            style={{
              width: '40px',
              height: '4px',
              background: 'rgba(167, 139, 250, 0.5)',
              borderRadius: '2px',
            }}
          />
        </Box>

        {/* 펼쳐진 상태: 상세 정보 */}
        {isExpanded && (
          <Box style={{ padding: '0 20px 16px' }}>
            <Stack gap="md" align="center">
              <Badge color="red" size="sm" variant="filled">
                🔥 1기 30명 중 23명 마감 — 7자리 남음
              </Badge>
              <Text ta="center" style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
                유튜브 수익화 마스터플랜
              </Text>
              <Text ta="center" style={{ fontSize: '12px', color: '#f59e0b' }}>
                ⚠️ 2/1 이후 ₩600,000으로 인상 예정
              </Text>
              {/* 카운트다운 */}
              <Group gap="sm" justify="center">
                {[
                  { value: timeLeft.days, label: '일' },
                  { value: timeLeft.hours, label: '시' },
                  { value: timeLeft.minutes, label: '분' },
                  { value: timeLeft.seconds, label: '초' },
                ].map((t, i) => (
                  <Stack key={i} gap={0} align="center">
                    <Text style={{ fontSize: '18px', fontWeight: 700, color: '#ef4444' }}>{t.value}</Text>
                    <Text size="xs" c="dimmed">{t.label}</Text>
                  </Stack>
                ))}
              </Group>
            </Stack>
          </Box>
        )}

        {/* 기본 바 영역 */}
        <Box style={{ padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm" style={{ width: '100%' }}>
            <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
              <Group gap={4} align="baseline" wrap="nowrap">
                <Text style={{ fontSize: '12px', color: '#6b7280', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>₩700,000</Text>
                <Text style={{ fontSize: '18px', fontWeight: 800, color: '#a78bfa', whiteSpace: 'nowrap' }}>₩500,000</Text>
              </Group>
            </Stack>
            <Button
              component={Link}
              href="/pricing"
              size="sm"
              radius="xl"
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                fontWeight: 700,
                fontSize: '14px',
                padding: '8px 16px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              신청하기
            </Button>
          </Group>
        </Box>
      </Box>
    );
  }

  // 🖥️ 데스크톱 버전 - 오른쪽 사이드바
  return (
    <Box
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        width: '300px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          p="lg"
          radius="lg"
          style={{
            background: 'rgba(15, 15, 25, 0.98)',
            border: '1px solid rgba(167, 139, 250, 0.4)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack gap="md">
            <Badge color="red" variant="filled" size="sm">
              🔥 1기 30명 중 23명 마감 — 7자리 남음
            </Badge>
            <Text style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>
              유튜브 수익화 마스터플랜
            </Text>
            <Stack gap={4}>
              <Group gap="sm" align="center">
                <Text style={{ fontSize: '16px', color: '#6b7280', textDecoration: 'line-through' }}>₩700,000</Text>
                <Badge color="green" size="sm">30% OFF</Badge>
              </Group>
              <Text style={{ fontSize: '32px', fontWeight: 800, color: '#a78bfa' }}>₩500,000</Text>
            </Stack>
            <Text style={{ fontSize: '12px', color: '#f59e0b' }}>
              ⚠️ 2/1 이후 ₩600,000으로 인상 예정
            </Text>
            <Box
              p="sm"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
            >
              <Text ta="center" size="xs" c="dimmed" mb="xs">⏰ 얼리버드 마감까지</Text>
              <Group justify="center" gap="xs">
                <Stack gap={0} align="center">
                  <Text style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{timeLeft.days}</Text>
                  <Text size="xs" c="dimmed">일</Text>
                </Stack>
                <Text c="dimmed">:</Text>
                <Stack gap={0} align="center">
                  <Text style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{timeLeft.hours}</Text>
                  <Text size="xs" c="dimmed">시</Text>
                </Stack>
                <Text c="dimmed">:</Text>
                <Stack gap={0} align="center">
                  <Text style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{timeLeft.minutes}</Text>
                  <Text size="xs" c="dimmed">분</Text>
                </Stack>
                <Text c="dimmed">:</Text>
                <Stack gap={0} align="center">
                  <Text style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{timeLeft.seconds}</Text>
                  <Text size="xs" c="dimmed">초</Text>
                </Stack>
              </Group>
            </Box>
            <Button
              component={Link}
              href="/pricing"
              size="md"
              fullWidth
              style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #6366f1 100%)',
                fontWeight: 700,
                fontSize: '16px',
              }}
            >
              🚀 지금 신청하기
            </Button>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}

// ============ [통합 Export] ============
export default function LandingPage() {
  return (
    <main>
      <LandingHeader />
      <HeroSection />
      <PainPoint1Section />
      <StorySection />
      <SocialProofSection />
      <AIRevealSection />
      <HowItWorksSection />
      <PackageSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingCTA />
    </main>
  );
}

// ============ Helper Components (Pricing, FAQ, CTA, Footer) Copied from previous context ============
// (To make the code complete, I would include the remaining components with updated content here, but for brevity in this response, I will focus on the main structural changes above. 
//  In the actual file write, I will include EVERYTHING.)

function PackageSection() {
  return (
    <Box py={100} style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Badge size="xl" variant="light" color="cyan" radius="xl" style={{ fontSize: '16px', padding: '12px 20px' }}>
            💰 왜 이 가격인가요?
          </Badge>
          <Title order={2} ta="center" style={{ color: '#fff', fontSize: '42px', lineHeight: 1.2 }}>
            <span style={{ color: '#6b7280' }}>비싼 강의 vs</span> 마스터플랜
          </Title>
        </Stack>

        {/* 2열 장단점 비교 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb={60}>

          {/* 일반 유료 강의 */}
          <Paper
            p={40}
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <Group mb={32}>
              <X size={32} color="#ef4444" />
              <Text fw={700} style={{ fontSize: '24px', color: '#ef4444' }}>일반 유료 강의</Text>
            </Group>
            <Stack gap="lg">
              {[
                { text: '가격 99~160만원', bad: true },
                { text: '강의만 제공 (실행은 알아서)', bad: true },
                { text: '기간 제한 (100일, 기수제)', bad: true },
                { text: '대본은 직접 써야 함', bad: true },
                { text: 'AI 도구 없음', bad: true },
              ].map((item, i) => (
                <Group key={i} gap="md">
                  <X size={20} color="#ef4444" />
                  <Text style={{ color: '#d1d5db', fontSize: '18px' }}>{item.text}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>

          {/* 마스터플랜 */}
          <Paper
            p={40}
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(139, 92, 246, 0.08))',
              border: '2px solid #00D9FF',
              boxShadow: '0 0 60px rgba(0, 217, 255, 0.15)',
            }}
          >
            <Group mb={32}>
              <Check size={32} color="#22c55e" />
              <Text fw={700} style={{ fontSize: '24px', color: '#22c55e' }}>마스터플랜</Text>
              <Badge color="cyan" size="lg" style={{ fontSize: '14px' }}>추천</Badge>
            </Group>
            <Stack gap="lg">
              {[
                { text: '가격 50만원 (60% 저렴)', good: true },
                { text: '강의 + AI 도구로 바로 실행', good: true },
                { text: '강의 평생 소장', good: true },
                { text: 'AI가 3분 만에 대본 작성', good: true },
                { text: 'AI 스크립트 도구 1년 무제한', good: true },
              ].map((item, i) => (
                <Group key={i} gap="md">
                  <div style={{ background: 'rgba(34, 197, 94, 0.2)', borderRadius: '50%', padding: '2px' }}>
                    <Check size={16} color="#4ade80" />
                  </div>
                  <Text fw={500} style={{ color: '#fff', fontSize: '18px' }}>{item.text}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* 부분별 가치 입증 */}
        <Box
          p={40}
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Title order={3} ta="center" style={{ fontSize: '28px', color: '#fff', marginBottom: '40px' }}>
            🎁 뭐가 들어있나요?
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={32}>
            {[
              { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
              { item: 'AI 스크립트 도구 1년 무제한', value: '₩600,000' },
              { item: '채널 분석 피드백', value: '₩100,000' },
              { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
            ].map((item, i) => (
              <Group key={i} justify="space-between" style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                <Text style={{ fontSize: '16px', color: '#d1d5db' }}>{item.item}</Text>
                <Text fw={600} style={{ fontSize: '18px', color: '#a78bfa' }}>{item.value}</Text>
              </Group>
            ))}
          </SimpleGrid>
          <Divider my={32} color="rgba(255,255,255,0.1)" />
          <Group justify="space-between" align="flex-end">
            <Text fw={700} style={{ fontSize: '20px', color: '#9ca3af' }}>총 가치</Text>
            <Text fw={700} style={{ fontSize: '24px', color: '#9ca3af', textDecoration: 'line-through' }}>₩1,390,000</Text>
          </Group>
          <Group justify="space-between" mt="md" align="center">
            <Text fw={800} style={{ fontSize: '28px', color: '#fff' }}>마스터플랜 가격</Text>
            <Group gap="md" align="center">
              <Text fw={800} style={{ fontSize: '36px', color: '#22c55e' }}>₩500,000</Text>
              <Badge color="red" size="xl" style={{ fontSize: '16px', padding: '12px' }}>64% 할인</Badge>
            </Group>
          </Group>
        </Box>

        {/* 직원 비유 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Box
            mt={80}
            p={40}
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '24px',
              textAlign: 'center',
            }}
          >
            <Text fw={700} style={{ fontSize: '24px', color: '#fff', marginBottom: '24px' }}>
              💡 이렇게 생각해보세요
            </Text>
            <Group justify="center" gap={40} wrap="wrap">
              <Stack gap={8} align="center">
                <Text style={{ fontSize: '16px', color: '#d1d5db' }}>스크립트 작가 1명 고용</Text>
                <Text fw={800} style={{ fontSize: '32px', color: '#fff' }}>월 200만원</Text>
              </Stack>
              <Text style={{ fontSize: '32px', color: '#6b7280', fontWeight: 300 }}>vs</Text>
              <Stack gap={8} align="center">
                <Text style={{ fontSize: '16px', color: '#d1d5db' }}>AI 스크립트 1년</Text>
                <Text fw={800} style={{ fontSize: '32px', color: '#ec4899' }}>50만원</Text>
              </Stack>
            </Group>
            <Text style={{ marginTop: '32px', fontSize: '20px', color: '#d1d5db' }}>
              = <b style={{ color: '#fff' }}>월 4만원</b> = 커피 10잔 값으로 <b style={{ color: '#a78bfa' }}>24시간 일하는 직원</b>을 고용하세요
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
