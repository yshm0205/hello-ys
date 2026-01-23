'use client';

/**
 * FlowSpot 랜딩 페이지 (Final Strategy Applied)
 * 전략: 7대 규칙 기반 (수강생=전자책, AI=본인사용)
 * Update: 2026-01-23
 */

import { useState } from 'react';
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

      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="xl">

          {/* 질문 후킹 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Text
              ta="center"
              style={{
                fontSize: 'clamp(36px, 6vw, 56px)',
                fontWeight: 800,
                lineHeight: 1.2,
                color: '#FFFFFF',
              }}
            >
              비싼 강의 들어도
              <br />
              <span style={{ color: '#f59e0b' }}>결국 막막하죠?</span>
            </Text>
          </motion.div>

          {/* 해결책 선언 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <Stack align="center" gap="sm">
              <Text size="xl" fw={600} ta="center" style={{ color: 'rgba(255,255,255,0.9)' }}>
                그래서 만들었습니다.
              </Text>
              <Text
                ta="center"
                style={{
                  fontSize: 'clamp(28px, 5vw, 42px)',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                배우고 → <span style={{ color: '#00D9FF' }}>바로 쓰는</span> 시스템
              </Text>
            </Stack>
          </motion.div>

          {/* 핵심 구성 태그 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Group gap="md" justify="center">
              <Badge size="xl" variant="light" color="violet" radius="xl" style={{ padding: '14px 24px', fontSize: '16px' }}>
                📚 강의 59강
              </Badge>
              <Text size="xl" fw={700} c="dimmed">+</Text>
              <Badge size="xl" variant="light" color="cyan" radius="xl" style={{ padding: '14px 24px', fontSize: '16px' }}>
                🤖 AI 대본 자동화
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
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(139, 92, 246, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
              }}
            >
              {/* 브라우저 프레임 */}
              <Box style={{
                height: '40px',
                background: 'linear-gradient(to right, #1a1a2e, #16213e)',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                gap: '8px',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                <Box style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                <Box style={{ flex: 1, marginLeft: '16px', height: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                  <Text size="xs" c="dimmed">flowspot.ai/dashboard</Text>
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
                  gap: '16px',
                }}
              >
                {/* 플레이스홀더 아이콘 */}
                <Box
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(0, 217, 255, 0.2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px dashed rgba(139, 92, 246, 0.5)',
                  }}
                >
                  <Bot size={40} color="#a78bfa" />
                </Box>
                <Stack align="center" gap="xs">
                  <Text fw={600} style={{ color: 'rgba(255,255,255,0.6)' }}>
                    AI 도구 시연 영상
                  </Text>
                  <Text size="sm" c="dimmed">
                    (GIF 또는 스크린샷으로 교체 예정)
                  </Text>
                </Stack>
                <Badge variant="outline" color="violet" size="lg">
                  🎬 3분 만에 대본 완성
                </Badge>
              </Box>
            </Box>
          </motion.div>

          {/* 가격 + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Stack align="center" gap="md">
              {/* 실시간 남은 자리 */}
              <Badge
                size="lg"
                color="red"
                variant="filled"
                radius="xl"
                style={{ animation: 'pulse 2s infinite' }}
              >
                🔥 1기 30명 중 23명 마감 — 7자리 남음
              </Badge>

              <Box
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: '16px',
                  padding: '20px 32px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                }}
              >
                <Text size="sm" c="dimmed">유튜브 수익화 마스터플랜</Text>
                <Group gap="sm" mt={4} justify="center">
                  <Text size="sm" style={{ textDecoration: 'line-through', color: '#6b7280' }}>₩700,000</Text>
                  <Text size="xl" fw={800} style={{ color: '#fff' }}>₩500,000</Text>
                  <Badge color="red" size="sm">30% OFF</Badge>
                </Group>
                {/* 가격 인상 예고 */}
                <Text size="xs" mt="xs" style={{ color: '#f59e0b' }}>
                  ⚠️ 2/1 이후 ₩600,000으로 인상 예정
                </Text>
              </Box>

              <Button
                component={Link}
                href="/dashboard"
                size="xl"
                radius="xl"
                rightSection={<ArrowRight size={24} />}
                style={{
                  padding: '0 56px',
                  height: '72px',
                  fontSize: '22px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  boxShadow: '0 0 40px rgba(236, 72, 153, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
                  border: 'none',
                  animation: 'ctaPulse 2s infinite',
                }}
              >
                🔥 지금 시작하기
              </Button>

              {/* 카운트다운 타이머 */}
              <Box
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '12px',
                  padding: '12px 24px',
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
            <Group gap="lg" wrap="wrap" justify="center">
              <Group gap={6}>
                <Check size={16} color="#22c55e" />
                <Text size="sm" c="dimmed">본인 월 1,000만원</Text>
              </Group>
              <Group gap={6}>
                <Check size={16} color="#22c55e" />
                <Text size="sm" c="dimmed">수강생 월 1,000만원</Text>
              </Group>
              <Group gap={6}>
                <Check size={16} color="#22c55e" />
                <Text size="sm" c="dimmed">전자책 500명 검증</Text>
              </Group>
            </Group>
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


// ============ 2. SOCIAL PROOF (전자책 수강생) ============
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

  // 실제 리뷰 (업데이트됨 - 유튜브 댓글 포함)
  const reviews = [
    "300만원 유료 강의도 들어봤는데, 이 이북이 몇백 하는 유료 강의급입니다",
    "3달간 혼자 헤딩하며 얻지 못한 명확한 방향을 찾았습니다",
    "900만원 강의비 날린 저도 이건 달랐습니다. 진짜입니다.",
    "방향을 찾지 못하고 방황하던 중 아주 귀인을 만난 기분입니다",
    "컴퓨터 켜는 것도 어려운 왕초보인데 그대로 따라해서 수익 냈어요",
    "웬만한 강의보다 훨씬 실질적이고 도움이 될 것 같습니다",
    "전자책 만으로도 가성비가 좋은데 프로그램까지? 감동...",
    "실전 중심의 전자책, 초보자 입장에서 따라갈 수 있습니다",
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
              maxWidth: '90%',
              maxHeight: '90%',
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
              ✅ 이 원리로 먼저 성과 낸 분들
            </Badge>
            <Title order={2} ta="center" style={{ color: '#FFFFFF', fontSize: '36px' }}>
              전자책으로 <span style={{ color: '#22c55e' }}>검증된 원리</span>
            </Title>
            <Text size="lg" c="dimmed" ta="center">
              이번엔 영상 강의 59강 + AI 도구까지 드립니다
            </Text>
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

          {/* 후기 카드 그리드 (노마드코더 스타일) */}
          <Box mt={60}>
            <Text fw={600} mb="lg" ta="center" c="dimmed">📸 실제 인증 캡처 & 후기</Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              {/* 이미지 후기 카드들 */}
              {[
                {
                  id: 1,
                  src: "/images/reviews/review_1_revenue.png",
                  text: "쇼츠로 월 1,300만원 이상씩 꾸준히 벌고 있습니다. 진심으로 감사드립니다!",
                  highlight: "월 1,300만원",
                  author: "지맥하는 제이지"
                },
                {
                  id: 2,
                  src: "/images/reviews/review_2_realtime.png",
                  text: "48시간 만에 1,200만 뷰 달성! 실시간으로 폭발 성장 중입니다.",
                  highlight: "48시간 1,200만 뷰",
                  author: "수강생 인증"
                },
                {
                  id: 3,
                  src: "/images/reviews/review_3_kakao.png",
                  text: "전자책 후기입니다. 계속해서 돈을 벌 수 있는 방법을 찾고 있었는데, 드디어 방법을 찾은 것 같습니다.",
                  highlight: "드디어 방법을 찾았다",
                  author: "양손 엄지척 무지"
                },
                {
                  id: 4,
                  src: "/images/reviews/review_4_kakao.png",
                  text: "초보자에게 꼭 필요한 내용들이 자세히 담겨 있어서 큰 도움이 되네요. 덕분에 다시 용기를 내서 방향을 잡아볼 수 있을 것 같아요.",
                  highlight: "다시 용기를 내서",
                  author: "베개를 부비적대는 라이언"
                },
                {
                  id: 5,
                  src: "/images/reviews/review_5_kakao.png",
                  text: "48시간 만에 거의 10만 뷰 증가, 좋아요 2천 개 돌파! 유효 만벽 깨니까 쭉쭉올라가네요.",
                  highlight: "48시간 10만 뷰",
                  author: "리듬타는 제이지"
                },
                {
                  id: 6,
                  src: "/images/reviews/review_6_youtube.png",
                  text: "유튜브 시작한 지 이제 겨우 일주일 된 초보입니다. 전자책 덕분에 유튜브를 전략적인 콘텐츠 사업으로 보게 된 게 가장 큰 수확입니다.",
                  highlight: "전략적인 콘텐츠 사업",
                  author: "유튜브 댓글"
                },
                {
                  id: 7,
                  src: "/images/reviews/review_7_kakao.png",
                  text: "와 저 방금 구독자 1000 되었어요 ㅠㅠㅠㅠ 눈물 아직 조회수때문에 수창은 아니지만ㅠ",
                  highlight: "구독자 1000명 달성",
                  author: "아이디어 프로도"
                },
                {
                  id: 8,
                  src: "/images/reviews/review_8_kakao.png",
                  text: "처음엔 강의 가격이 너무 부담스러워서 혼자 해보려고 했는데, 우연히 유튜브 영상을 보고 전자책까지 구매하게 됐어요.",
                  highlight: "큰 도움이 되네요",
                  author: "권투하는 무지"
                },
                // 유튜브 댓글 (사용자 직접 캡처)
                {
                  id: 9,
                  src: "/images/reviews/comment_osy.png",
                  text: "300만원 유료 강의도 들어봤는데, 이 이북이 몇백 하는 유료 강의급입니다. 쇼츠 유료 강의 수강 고민하시는 분이라면 이 이북부터 보고 채널 운영해 보시길 권해드립니다.",
                  highlight: "300만원 강의급",
                  author: "@osy-b2j"
                },
                {
                  id: 10,
                  src: "/images/reviews/comment_mungge.png",
                  text: "유튜브도 쇼츠도 처음이라 막막했는데 캡컷 편집 강의가 너무 쉽게 잘 구성되어 있어서 큰 도움이 됩니다. 편집이 손에 익을 때까지 자주 볼 것 같아요.",
                  highlight: "편집 강의가 너무 쉽게",
                  author: "@뭉게뭉게-y3j"
                },
                {
                  id: 11,
                  src: "/images/reviews/comment_comfort.png",
                  text: "하고자 하는 방향을 찾지 못하고 방황하던 중 아주 귀인을 만난 기분입니다. 전자책 잘 받았습니다. 포기하지 않고 꾸준히 따라가 보겠습니다!",
                  highlight: "귀인을 만난 기분",
                  author: "@Comfort-Nation"
                },
                {
                  id: 12,
                  src: "/images/reviews/comment_aljjabang.png",
                  text: "말 그대로 실전 중심의 전자책 같습니다. 단순 이론이 아니라 직접 쇼츠 제작에 바로 적용할 수 있는 실용적인 내용과 노하우가 정리되어 있어서 초보자 입장에서 따라갈 수 있을 것 같습니다.",
                  highlight: "실전 중심",
                  author: "@알짜방"
                },
              ].map((card) => (
                <Paper
                  key={card.id}
                  p="lg"
                  radius="lg"
                  onClick={() => card.src && setSelectedImage(card.src)}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    cursor: card.src ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                  }}
                  className={card.src ? 'review-card' : ''}
                >
                  <Group align="flex-start" gap="md">
                    {/* 썸네일 (있는 경우) */}
                    {card.src && (
                      <Box
                        style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <img
                          src={card.src}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    )}
                    {/* 텍스트 */}
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Text size="sm" style={{ color: '#d1d5db', lineHeight: 1.6 }}>
                        {card.text.split(card.highlight).map((part, i, arr) => (
                          <span key={i}>
                            {part}
                            {i < arr.length - 1 && (
                              <span style={{ color: '#f59e0b', fontWeight: 600 }}>{card.highlight}</span>
                            )}
                          </span>
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

          {/* 브릿지 (다음 섹션 연결) */}
          <Box mt={80} ta="center">
            <Text size="xl" fw={600} style={{ color: 'rgba(255,255,255,0.6)' }}>
              하지만...
            </Text>
            <Title order={3} mt="md" style={{ color: '#f59e0b', fontSize: '28px' }}>
              대본 쓰는 건 여전히 어렵다는 분들이 많았습니다
            </Title>
            <Text size="lg" c="dimmed" mt="md">
              그래서 영상으로 더 자세히 보여드리고, AI로 실행까지 도와드립니다
            </Text>
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
      <PainPointSection />
      <StorySection />
      <AIRevealSection />
      <HowItWorksSection />
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
  return (
    <Box py={100} style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #111827 100%)' }}>
      <Container size="lg">
        <Stack align="center" gap="xl" mb={60}>
          <Badge size="lg" variant="light" color="cyan" radius="xl">
            💰 왜 이 가격인가요?
          </Badge>
          <Title order={2} ta="center" c="white" style={{ fontSize: '36px' }}>
            <span style={{ color: '#6b7280' }}>비싼 강의 vs</span> 마스터플랜
          </Title>
        </Stack>

        {/* 2열 장단점 비교 */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" mb={60}>

          {/* 일반 유료 강의 */}
          <Paper
            p="xl"
            radius="xl"
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}
          >
            <Group mb="lg">
              <X size={24} color="#ef4444" />
              <Text fw={700} size="lg" style={{ color: '#ef4444' }}>일반 유료 강의</Text>
            </Group>
            <Stack gap="md">
              {[
                { text: '가격 99~160만원', bad: true },
                { text: '강의만 제공 (실행은 알아서)', bad: true },
                { text: '기간 제한 (100일, 기수제)', bad: true },
                { text: '대본은 직접 써야 함', bad: true },
                { text: 'AI 도구 없음', bad: true },
              ].map((item, i) => (
                <Group key={i} gap="sm">
                  <X size={16} color="#ef4444" />
                  <Text size="sm" c="dimmed">{item.text}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>

          {/* 마스터플랜 */}
          <Paper
            p="xl"
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 217, 255, 0.1), rgba(139, 92, 246, 0.08))',
              border: '2px solid #00D9FF',
              boxShadow: '0 0 40px rgba(0, 217, 255, 0.2)',
            }}
          >
            <Group mb="lg">
              <Check size={24} color="#22c55e" />
              <Text fw={700} size="lg" style={{ color: '#22c55e' }}>마스터플랜</Text>
              <Badge color="cyan" size="sm">추천</Badge>
            </Group>
            <Stack gap="md">
              {[
                { text: '가격 50만원 (60% 저렴)', good: true },
                { text: '강의 + AI 도구로 바로 실행', good: true },
                { text: '강의 평생 소장', good: true },
                { text: 'AI가 3분 만에 대본 작성', good: true },
                { text: 'AI 스크립트 도구 1년 무제한', good: true },
              ].map((item, i) => (
                <Group key={i} gap="sm">
                  <Check size={16} color="#22c55e" />
                  <Text size="sm" style={{ color: '#fff' }}>{item.text}</Text>
                </Group>
              ))}
            </Stack>
          </Paper>
        </SimpleGrid>

        {/* 부분별 가치 입증 */}
        <Box
          p="xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Title order={3} ta="center" c="white" mb="xl">
            🎁 뭐가 들어있나요?
          </Title>
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
            {[
              { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
              { item: 'AI 스크립트 도구 1년 무제한', value: '₩600,000' },
              { item: '채널 분석 피드백', value: '₩100,000' },
              { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
            ].map((item, i) => (
              <Group key={i} justify="space-between" style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <Text size="sm" c="dimmed">{item.item}</Text>
                <Text size="sm" fw={600} style={{ color: '#a78bfa' }}>{item.value}</Text>
              </Group>
            ))}
          </SimpleGrid>
          <Divider my="lg" color="gray.8" />
          <Group justify="space-between">
            <Text fw={700} c="white">총 가치</Text>
            <Text fw={700} style={{ color: '#a78bfa', textDecoration: 'line-through' }}>₩1,390,000</Text>
          </Group>
          <Group justify="space-between" mt="sm">
            <Text fw={800} size="xl" c="white">마스터플랜 가격</Text>
            <Group gap="sm">
              <Text fw={800} size="xl" style={{ color: '#22c55e' }}>₩500,000</Text>
              <Badge color="red" size="lg">64% 할인</Badge>
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
            mt={60}
            p="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '20px',
              textAlign: 'center',
            }}
          >
            <Text size="lg" fw={700} c="white" mb="md">
              💡 이렇게 생각해보세요
            </Text>
            <Group justify="center" gap="xl" wrap="wrap">
              <Stack gap={4} align="center">
                <Text size="sm" c="dimmed">스크립트 작가 1명 고용</Text>
                <Text size="xl" fw={800} c="white">월 200만원</Text>
              </Stack>
              <Text size="xl" c="dimmed">vs</Text>
              <Stack gap={4} align="center">
                <Text size="sm" c="dimmed">AI 스크립트 1년</Text>
                <Text size="xl" fw={800} style={{ color: '#ec4899' }}>50만원</Text>
              </Stack>
            </Group>
            <Text c="dimmed" mt="lg">
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
