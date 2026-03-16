'use client';

/**
 * FlowSpot 랜딩 페이지 — 리디자인 Phase 1 (v2)
 * 디자인: 순백 배경 + violet(#8b5cf6) 액센트
 * 모바일/데스크톱 동일 레이아웃
 */

import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Button,
  Group,
  Stack,
  Box,
  Badge,
  Paper,
  Accordion,
  Anchor,
  Divider,
} from '@mantine/core';
import { Check, X, Bot, ChevronDown, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { motion } from 'framer-motion';


// ============================================================
// 섹션 1: Hero — 최단거리 포지셔닝
// ============================================================
function HeroSection() {
  return (
    <Box
      component="section"
      style={{
        background: '#fff',
        paddingTop: 'clamp(120px, 20vh, 180px)',
        paddingBottom: 'clamp(60px, 12vh, 120px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 데코 — 미니멀 도트 패턴 */}
      <Box
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.5,
          pointerEvents: 'none',
        }}
      />
      {/* 배경 글로우 */}
      <Box
        style={{
          position: 'absolute',
          top: '-20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '600px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <Container size="sm" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <Stack align="center" gap={0}>
            {/* 프리헤더 */}
            <Text
              ta="center"
              style={{
                color: '#9ca3af',
                fontSize: 'clamp(15px, 2.5vw, 18px)',
                fontWeight: 500,
                letterSpacing: '0.02em',
                marginBottom: '16px',
              }}
            >
              지금부터 소개해드리는 이 길이,
            </Text>

            {/* 메인 헤드라인 */}
            <Title
              order={1}
              ta="center"
              style={{
                fontSize: 'clamp(36px, 6vw, 64px)',
                fontWeight: 900,
                color: '#111827',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '24px',
              }}
            >
              쇼츠{' '}
              <span
                style={{
                  color: '#8b5cf6',
                  position: 'relative',
                  display: 'inline-block',
                }}
              >
                월 300
                <Box
                  style={{
                    position: 'absolute',
                    bottom: '2px',
                    left: 0,
                    right: 0,
                    height: '8px',
                    background: 'rgba(139, 92, 246, 0.2)',
                    borderRadius: '4px',
                  }}
                />
              </span>
              까지의
              <br />
              최단거리입니다
            </Title>

            {/* 서브라인 */}
            <Text
              ta="center"
              style={{
                color: '#6b7280',
                fontSize: 'clamp(16px, 2.5vw, 20px)',
                maxWidth: '520px',
                lineHeight: 1.6,
                marginBottom: '32px',
              }}
            >
              뭘 해야 하는지 알려주고, AI가 대신 실행합니다
            </Text>

            {/* 배지 */}
            <Group gap="md" justify="center" mb={36}>
              <Badge
                size="xl"
                variant="light"
                color="violet"
                radius="xl"
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                📚 VOD 59강
              </Badge>
              <Badge
                size="xl"
                variant="light"
                color="violet"
                radius="xl"
                style={{
                  padding: '12px 24px',
                  fontSize: '15px',
                  fontWeight: 600,
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                🤖 AI 스크립트
              </Badge>
            </Group>

            {/* CTA */}
            <Button
              component={Link}
              href="/dashboard"
              size="xl"
              radius="xl"
              style={{
                background: '#8b5cf6',
                fontSize: '18px',
                fontWeight: 700,
                padding: '16px 56px',
                height: 'auto',
                boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4)',
                transition: 'all 0.2s ease',
              }}
            >
              무료로 시작하기
            </Button>
            <Text size="sm" mt="md" style={{ color: '#9ca3af' }}>
              30크레딧 무료 · 카드 등록 없음
            </Text>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}


// ============================================================
// 섹션 2: Pain — 돌아가는 길 3가지
// ============================================================
function PainSection() {
  const pains = [
    {
      emoji: '😩',
      title: '혼자 영상 만들어봤는데',
      line1: '6시간 걸려 만들었는데',
      line2: '조회수 47회',
      accent: '#ef4444',
    },
    {
      emoji: '💸',
      title: '강의 들어봤는데',
      line1: '수십만 원 썼는데',
      line2: '돌아온 건 "노력 부족"',
      accent: '#f59e0b',
    },
    {
      emoji: '🤖',
      title: 'AI 써봤는데',
      line1: '쇼츠 공식 모르는 AI',
      line2: '조회수 안 나옴',
      accent: '#6b7280',
    },
  ];

  return (
    <Box
      component="section"
      py={100}
      style={{
        background: 'linear-gradient(180deg, #f9fafb 0%, #fff 100%)',
      }}
    >
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 42px)',
              fontWeight: 800,
              color: '#111827',
              marginBottom: '56px',
              letterSpacing: '-0.02em',
            }}
          >
            그런데 대부분은 이 길을{' '}
            <span style={{ color: '#ef4444', textDecoration: 'underline', textDecorationColor: 'rgba(239, 68, 68, 0.3)', textUnderlineOffset: '6px' }}>
              돌아가고
            </span>{' '}
            있습니다
          </Title>

          {/* 3카드 — 가로 고정, 모바일 스크롤 */}
          <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Box style={{ display: 'flex', gap: '24px', minWidth: '780px' }}>
              {pains.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  style={{ flex: '1 1 0' }}
                >
                  <Paper
                    p={32}
                    radius="xl"
                    style={{
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      textAlign: 'center',
                      height: '100%',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <Text style={{ fontSize: '52px', marginBottom: '20px' }}>{p.emoji}</Text>
                    <Text
                      fw={700}
                      style={{
                        fontSize: '19px',
                        color: '#111827',
                        marginBottom: '12px',
                      }}
                    >
                      {p.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: '15px',
                        color: '#6b7280',
                        lineHeight: 1.7,
                      }}
                    >
                      {p.line1}
                      <br />
                      <span style={{ color: p.accent, fontWeight: 600 }}>{p.line2}</span>
                    </Text>
                  </Paper>
                </motion.div>
              ))}
            </Box>
          </Box>

          <Text
            ta="center"
            style={{
              color: '#9ca3af',
              fontSize: '16px',
              marginTop: '40px',
              fontStyle: 'italic',
            }}
          >
            공식 없이 시작하면 전부 돌아가는 길입니다.
          </Text>
        </motion.div>
      </Container>
    </Box>
  );
}


// ============================================================
// 섹션 3: WhyFlowSpot — 스토리 + 수익 증명
// ============================================================
function WhyFlowSpotSection() {
  const revenues = [
    { label: '채널A 지식/정보', amount: '₩488만', color: '#8b5cf6' },
    { label: '채널B 게임', amount: '₩1,567만', color: '#3b82f6' },
    { label: '채널C 해외반응', amount: '₩923만', color: '#10b981' },
    { label: '네이버 클립', amount: '₩1,920만', color: '#f59e0b' },
    { label: '다음 숏폼', amount: '₩149만', color: '#6366f1' },
  ];

  return (
    <Box component="section" py={100} style={{ background: '#fff' }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stack align="center" gap={0}>
            {/* 타이틀 */}
            <Title
              order={2}
              ta="center"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 42px)',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.02em',
                marginBottom: '16px',
              }}
            >
              저도 돌아가는 길 다 걸어봤습니다
            </Title>
            <Text
              ta="center"
              style={{
                fontSize: '17px',
                color: '#9ca3af',
                marginBottom: '48px',
              }}
            >
              그리고 결국 공식을 찾았습니다.
            </Text>

            {/* 수익 캡처 그리드 — 가로 고정 */}
            <Box style={{ width: '100%', maxWidth: '960px' }}>
              {/* Row 1: 3 */}
              <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Box style={{ display: 'flex', gap: '20px', minWidth: '720px', marginBottom: '20px' }}>
                  {revenues.slice(0, 3).map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      style={{ flex: '1 1 0' }}
                    >
                      <Paper
                        p="lg"
                        radius="xl"
                        style={{
                          background: '#f9fafb',
                          border: '2px dashed #d1d5db',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {/* 이미지 플레이스홀더 */}
                        <Box
                          style={{
                            height: '120px',
                            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <Stack align="center" gap={4}>
                            <Text style={{ fontSize: '24px' }}>📊</Text>
                            <Text size="xs" style={{ color: '#9ca3af' }}>수익 캡처 이미지</Text>
                          </Stack>
                        </Box>
                        <Text size="sm" fw={500} style={{ color: '#6b7280', marginBottom: '4px' }}>
                          {r.label}
                        </Text>
                        <Text fw={800} style={{ fontSize: '24px', color: r.color }}>
                          {r.amount}
                        </Text>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </Box>

              {/* Row 2: 2 */}
              <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Box style={{ display: 'flex', gap: '20px', minWidth: '500px', justifyContent: 'center' }}>
                  {revenues.slice(3).map((r, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                      style={{ flex: '0 1 300px' }}
                    >
                      <Paper
                        p="lg"
                        radius="xl"
                        style={{
                          background: '#f9fafb',
                          border: '2px dashed #d1d5db',
                          textAlign: 'center',
                        }}
                      >
                        <Box
                          style={{
                            height: '120px',
                            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '16px',
                            border: '1px solid #e5e7eb',
                          }}
                        >
                          <Stack align="center" gap={4}>
                            <Text style={{ fontSize: '24px' }}>📊</Text>
                            <Text size="xs" style={{ color: '#9ca3af' }}>수익 캡처 이미지</Text>
                          </Stack>
                        </Box>
                        <Text size="sm" fw={500} style={{ color: '#6b7280', marginBottom: '4px' }}>
                          {r.label}
                        </Text>
                        <Text fw={800} style={{ fontSize: '24px', color: r.color }}>
                          {r.amount}
                        </Text>
                      </Paper>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* 브릿지 텍스트 */}
            <Box
              mt={64}
              p={48}
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.08) 100%)',
                borderRadius: '24px',
                border: '1px solid rgba(139, 92, 246, 0.12)',
                maxWidth: '700px',
                width: '100%',
                textAlign: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  fontWeight: 800,
                  color: '#111827',
                  lineHeight: 1.4,
                  marginBottom: '16px',
                }}
              >
                분야가 달라도 통하는 공식이 있었습니다
              </Text>
              <Text
                style={{
                  fontSize: '17px',
                  color: '#6b7280',
                  lineHeight: 1.7,
                  marginBottom: '24px',
                }}
              >
                체계화한 뒤, 채널 1개 주 4시간으로 월 200-300
              </Text>
              <Text
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#8b5cf6',
                }}
              >
                그 체계가 59강 강의와 AI 스크립트 도구입니다 →
              </Text>
            </Box>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}


// ============================================================
// 섹션 4: HowItWorks — 진단형 플로우차트
// ============================================================
function HowItWorksSection() {
  const [selected, setSelected] = useState<number | null>(null);

  const questions = [
    {
      id: 0,
      question: '쇼츠, 처음 시작이에요',
      icon: '🌱',
      label: '입문',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.06)',
      borderColor: '#8b5cf6',
      answer: '걱정 마세요. 기획부터 수익화까지 순서대로 알려드립니다.',
      includes: ['전자책 (기초 가이드)', 'VOD 59강 (순차 학습)', 'AI 스크립트 6개월'],
    },
    {
      id: 1,
      question: '하고 있는데 성장이 안 돼요',
      icon: '📈',
      label: '성장',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.06)',
      borderColor: '#10b981',
      answer: '터지는 영상에는 공식이 있습니다. 그 공식을 드립니다.',
      includes: ['채널 리스트 (벤치마크)', 'AI 스크립트 (검증된 구조)', 'VOD 59강 (심화)'],
    },
    {
      id: 2,
      question: '혼자 하려니 너무 힘들어요',
      icon: '⚙️',
      label: '시스템화',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.06)',
      borderColor: '#3b82f6',
      answer: '반복 작업은 AI에게. 당신은 기획만 하세요.',
      includes: ['노션 운영 템플릿', 'AI 스크립트 (자동화)', '채널 리스트 (트렌드)'],
    },
  ];

  return (
    <Box
      component="section"
      id="how-it-works"
      py={100}
      style={{
        background: 'linear-gradient(180deg, #f9fafb 0%, #fff 100%)',
      }}
    >
      <Container size="md">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* 타이틀 */}
          <Stack align="center" gap="sm" mb={56}>
            <Badge
              size="lg"
              variant="light"
              color="violet"
              radius="xl"
              style={{ padding: '8px 20px', fontSize: '14px' }}
            >
              자가 진단
            </Badge>
            <Title
              order={2}
              ta="center"
              style={{
                fontSize: 'clamp(28px, 4.5vw, 42px)',
                fontWeight: 800,
                color: '#111827',
                letterSpacing: '-0.02em',
              }}
            >
              지금 어디에 계신가요?
            </Title>
            <Text ta="center" style={{ color: '#9ca3af', fontSize: '16px' }}>
              해당하는 상황을 선택해보세요
            </Text>
          </Stack>

          {/* 질문 카드 3개 */}
          <Stack gap="md">
            {questions.map((q) => {
              const isOpen = selected === q.id;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: q.id * 0.1 }}
                >
                  <Paper
                    radius="xl"
                    style={{
                      border: isOpen ? `2px solid ${q.borderColor}` : '2px solid #e5e7eb',
                      background: isOpen ? q.bgColor : '#fff',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      boxShadow: isOpen ? `0 4px 24px rgba(0,0,0,0.06)` : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                    onClick={() => setSelected(isOpen ? null : q.id)}
                  >
                    {/* 질문 헤더 */}
                    <Box
                      p={24}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <Text style={{ fontSize: '36px', flexShrink: 0 }}>{q.icon}</Text>
                      <Box style={{ flex: 1 }}>
                        <Text
                          fw={700}
                          style={{
                            fontSize: '18px',
                            color: '#111827',
                          }}
                        >
                          &ldquo;{q.question}&rdquo;
                        </Text>
                      </Box>
                      <Badge
                        variant="filled"
                        size="lg"
                        style={{
                          background: q.color,
                          fontWeight: 700,
                          fontSize: '14px',
                          padding: '8px 20px',
                          height: 'auto',
                          flexShrink: 0,
                        }}
                      >
                        {q.label}
                      </Badge>
                      <ChevronDown
                        size={20}
                        color="#9ca3af"
                        style={{
                          transition: 'transform 0.3s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                          flexShrink: 0,
                        }}
                      />
                    </Box>

                    {/* 답변 (펼침) */}
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          px={24}
                          pb={28}
                          style={{
                            borderTop: `1px solid rgba(0,0,0,0.06)`,
                          }}
                        >
                          <Text
                            mt={20}
                            mb={20}
                            style={{
                              fontSize: '17px',
                              color: '#374151',
                              fontWeight: 600,
                              lineHeight: 1.6,
                            }}
                          >
                            → {q.answer}
                          </Text>
                          <Box
                            p={20}
                            style={{
                              background: '#fff',
                              borderRadius: '16px',
                              border: '1px solid #e5e7eb',
                            }}
                          >
                            <Text size="sm" fw={600} mb="sm" style={{ color: '#6b7280' }}>
                              올인원에 포함된 솔루션:
                            </Text>
                            <Stack gap="xs">
                              {q.includes.map((item, j) => (
                                <Group key={j} gap="sm">
                                  <Check size={16} color={q.color} />
                                  <Text size="sm" style={{ color: '#374151' }}>{item}</Text>
                                </Group>
                              ))}
                            </Stack>
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </Paper>
                </motion.div>
              );
            })}
          </Stack>

          {/* 하단 CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Stack align="center" gap="md" mt={56}>
              <Text
                ta="center"
                style={{
                  fontSize: 'clamp(22px, 3.5vw, 32px)',
                  fontWeight: 800,
                  color: '#111827',
                  letterSpacing: '-0.02em',
                }}
              >
                어떤 단계든,{' '}
                <span style={{ color: '#8b5cf6' }}>올인원 하나</span>면 됩니다
              </Text>
              <Button
                component={Link}
                href="/dashboard"
                size="lg"
                radius="xl"
                style={{
                  background: '#8b5cf6',
                  fontSize: '17px',
                  fontWeight: 700,
                  padding: '14px 44px',
                  height: 'auto',
                  boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4)',
                }}
              >
                무료로 시작하기
              </Button>
            </Stack>
          </motion.div>
        </motion.div>
      </Container>
    </Box>
  );
}


// ============================================================
// 섹션 5~10: Phase 2 (기존 콘텐츠, 화이트 테마)
// ============================================================

function PackageSection() {
  return (
    <Box component="section" py={100} style={{ background: '#fff' }}>
      <Container size="lg">
        <Stack align="center" gap="sm" mb={56}>
          <Badge
            size="lg"
            variant="light"
            color="cyan"
            radius="xl"
            style={{ padding: '8px 20px', fontSize: '14px' }}
          >
            가격 비교
          </Badge>
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(28px, 4.5vw, 42px)',
              fontWeight: 800,
              color: '#111827',
              letterSpacing: '-0.02em',
            }}
          >
            왜 이 가격인가요?
          </Title>
          <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
            비싼 강의 vs 올인원 패스
          </Text>
        </Stack>

        {/* 비교 — 가로 고정 */}
        <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '56px' }}>
          <Box style={{ display: 'flex', gap: '24px', minWidth: '720px', justifyContent: 'center' }}>
            {/* 일반 유료 강의 */}
            <Paper
              p={36}
              radius="xl"
              style={{
                flex: '1 1 0',
                maxWidth: '400px',
                border: '1px solid #fecaca',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Group mb={28} gap="sm">
                <Box style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={20} color="#ef4444" />
                </Box>
                <Text fw={700} style={{ fontSize: '20px', color: '#ef4444' }}>일반 유료 강의</Text>
              </Group>
              <Stack gap="lg">
                {[
                  '가격 99~160만원',
                  '강의만 제공 (실행은 알아서)',
                  '기간 제한 (100일, 기수제)',
                  '대본은 직접 써야 함',
                  'AI 도구 없음',
                ].map((t, i) => (
                  <Group key={i} gap="sm">
                    <X size={16} color="#d1d5db" />
                    <Text style={{ color: '#6b7280', fontSize: '15px' }}>{t}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>

            {/* 올인원 패스 */}
            <Paper
              p={36}
              radius="xl"
              style={{
                flex: '1 1 0',
                maxWidth: '400px',
                border: '2px solid #8b5cf6',
                background: 'linear-gradient(135deg, rgba(139,92,246,0.03) 0%, rgba(139,92,246,0.07) 100%)',
                boxShadow: '0 4px 24px rgba(139, 92, 246, 0.12)',
                position: 'relative',
              }}
            >
              {/* 추천 리본 */}
              <Badge
                color="violet"
                size="md"
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '24px',
                  boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
                }}
              >
                추천
              </Badge>
              <Group mb={28} gap="sm">
                <Box style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={20} color="#22c55e" />
                </Box>
                <Text fw={700} style={{ fontSize: '20px', color: '#111827' }}>올인원 패스</Text>
              </Group>
              <Stack gap="lg">
                {[
                  '가격 50만원 (60% 저렴)',
                  '강의 + AI로 바로 실행',
                  '강의 4개월 수강',
                  'AI가 3분 만에 대본 작성',
                  'AI 스크립트 도구 6개월',
                ].map((t, i) => (
                  <Group key={i} gap="sm">
                    <Check size={16} color="#22c55e" />
                    <Text fw={500} style={{ color: '#111827', fontSize: '15px' }}>{t}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* 부분별 가치 */}
        <Paper
          p={40}
          radius="xl"
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <Title order={3} ta="center" style={{ fontSize: '22px', color: '#111827', marginBottom: '32px', fontWeight: 700 }}>
            뭐가 들어있나요?
          </Title>
          <Stack gap="lg">
            {[
              { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
              { item: 'AI 스크립트 도구 6개월', value: '₩600,000' },
              { item: '채널 분석 피드백', value: '₩100,000' },
              { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
            ].map((row, i) => (
              <Group key={i} justify="space-between" style={{ borderBottom: '1px dashed #d1d5db', paddingBottom: '14px' }}>
                <Text style={{ color: '#374151', fontSize: '15px' }}>{row.item}</Text>
                <Text fw={600} style={{ color: '#8b5cf6', fontSize: '16px' }}>{row.value}</Text>
              </Group>
            ))}
          </Stack>
          <Divider my="xl" color="#e5e7eb" />
          <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <Text fw={700} style={{ color: '#9ca3af', fontSize: '16px', textDecoration: 'line-through' }}>
              총 가치: ₩1,390,000
            </Text>
            <Group gap="md" align="center">
              <Text fw={800} style={{ fontSize: '32px', color: '#22c55e' }}>₩500,000</Text>
              <Badge color="red" size="lg" style={{ fontSize: '14px' }}>64% 할인</Badge>
            </Group>
          </Box>
        </Paper>

        {/* 직원 비유 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Paper
            p={40}
            radius="xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.15)',
              textAlign: 'center',
              maxWidth: '700px',
              margin: '48px auto 0',
            }}
          >
            <Text fw={700} style={{ fontSize: '20px', color: '#111827', marginBottom: '24px' }}>
              이렇게 생각해보세요
            </Text>
            <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Group justify="center" gap={40} wrap="nowrap" style={{ minWidth: '400px' }}>
                <Stack gap={4} align="center">
                  <Text style={{ fontSize: '14px', color: '#6b7280' }}>스크립트 작가 1명</Text>
                  <Text fw={800} style={{ fontSize: '28px', color: '#111827' }}>월 200만원</Text>
                </Stack>
                <Text style={{ fontSize: '28px', color: '#d1d5db', fontWeight: 300 }}>vs</Text>
                <Stack gap={4} align="center">
                  <Text style={{ fontSize: '14px', color: '#6b7280' }}>AI 스크립트 6개월</Text>
                  <Text fw={800} style={{ fontSize: '28px', color: '#8b5cf6' }}>50만원</Text>
                </Stack>
              </Group>
            </Box>
            <Text style={{ marginTop: '24px', fontSize: '17px', color: '#6b7280' }}>
              = <b style={{ color: '#111827' }}>월 4만원</b> = 커피 10잔 값으로{' '}
              <b style={{ color: '#8b5cf6' }}>24시간 일하는 직원</b>
            </Text>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}


function FAQSection() {
  const faqs = [
    { q: 'AI 1도 몰라도 되나요?', a: '네. 버튼 3개만 누르면 됩니다. 원리는 강의에서 알려드려요.' },
    { q: '진짜 수익이 나나요?', a: '전자책 수강생 중 월 700만원 달성자가 있습니다. 실행만 하시면 됩니다.' },
    { q: '환불 되나요?', a: '결제 후 7일 이내, 강의 1강도 수강하지 않은 경우 전액 환불됩니다. 수강을 시작한 경우에도 이러닝 표준약관에 따라 (1강 단가 × 수강 강의 수 + 위약금 10%)를 공제 후 환불됩니다.' },
    { q: '강의 기간은요?', a: '강의는 4개월 수강, AI 도구는 6개월 이용권입니다.' },
    { q: '크레딧을 다 쓰면요?', a: '설정 > 플랜 & 결제에서 크레딧 팩(30개 ₩9,900 / 100개 ₩29,900)을 추가 구매할 수 있습니다.' },
  ];

  return (
    <Box component="section" py={100} style={{ background: '#f9fafb' }} id="faq">
      <Container size="md">
        <Title
          order={2}
          ta="center"
          style={{
            color: '#111827',
            fontSize: 'clamp(28px, 4.5vw, 36px)',
            fontWeight: 800,
            marginBottom: '40px',
            letterSpacing: '-0.02em',
          }}
        >
          자주 묻는 질문
        </Title>
        <Accordion
          variant="separated"
          radius="xl"
          styles={{
            item: {
              background: '#fff',
              border: '1px solid #e5e7eb',
              marginBottom: '12px',
            },
            control: {
              color: '#111827',
              fontWeight: 600,
              fontSize: '16px',
              padding: '20px 24px',
            },
            panel: {
              color: '#6b7280',
              fontSize: '15px',
              lineHeight: 1.7,
              padding: '0 24px 20px',
            },
          }}
        >
          {faqs.map((f, i) => (
            <Accordion.Item key={i} value={f.q}>
              <Accordion.Control>{f.q}</Accordion.Control>
              <Accordion.Panel>{f.a}</Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Container>
    </Box>
  );
}


function CTASection() {
  return (
    <Box
      component="section"
      py={100}
      style={{
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* 배경 글로우 */}
      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap="lg">
          <Title
            order={2}
            ta="center"
            style={{
              color: '#111827',
              fontSize: 'clamp(28px, 4.5vw, 40px)',
              fontWeight: 800,
              lineHeight: 1.35,
              letterSpacing: '-0.02em',
            }}
          >
            지금 시작하지 않으면,
            <br />
            내일도 같은 고민을 하게 됩니다
          </Title>
          <Button
            component={Link}
            href="/dashboard"
            size="xl"
            radius="xl"
            style={{
              background: '#8b5cf6',
              fontSize: '18px',
              fontWeight: 700,
              padding: '16px 56px',
              height: 'auto',
              boxShadow: '0 4px 24px rgba(139, 92, 246, 0.4)',
            }}
          >
            무료로 시작하기
          </Button>
          <Stack align="center" gap={4}>
            <Text size="sm" style={{ color: '#9ca3af' }}>
              30크레딧 무료 · 7일 환불 보장
            </Text>
            <Text size="sm" style={{ color: '#9ca3af' }}>
              문의: hmys0205hmys@gmail.com
            </Text>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}


function Footer() {
  return (
    <Box component="footer" py={48} style={{ background: '#111827' }}>
      <Container size="lg">
        <Stack align="center" gap="md">
          <Group gap="sm">
            <Bot size={22} color="#8b5cf6" />
            <Text size="lg" fw={600} style={{ color: '#fff' }}>FlowSpot</Text>
          </Group>
          <Group gap="lg" justify="center">
            <Anchor component={Link} href="/terms" size="sm" style={{ color: '#9ca3af' }}>이용약관</Anchor>
            <Anchor component={Link} href="/privacy" size="sm" style={{ color: '#9ca3af' }}>개인정보처리방침</Anchor>
            <Anchor component={Link} href="/refund" size="sm" style={{ color: '#9ca3af' }}>환불 규정</Anchor>
          </Group>
          <Stack align="center" gap={4}>
            <Text size="xs" style={{ color: '#6b7280' }}>
              플로우스팟 | 대표: 이하민, 김예성 | 사업자등록번호: 693-07-02115
            </Text>
            <Text size="xs" style={{ color: '#6b7280' }}>
              통신판매업 신고번호: 2022-충남천안-0095 | 전화: 070-8027-2849
            </Text>
            <Text size="xs" style={{ color: '#6b7280' }}>
              주소: 충남 천안시 서북구 두정동 1225, 401호
            </Text>
          </Stack>
          <Text size="sm" style={{ color: '#4b5563' }}>
            © 2026 FlowSpot. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}


// ============================================================
// FloatingCTA
// ============================================================
function FloatingCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > 600);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isVisible) return null;

  if (isMobile) {
    return (
      <Box
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#fff',
          borderTop: '1px solid #e5e7eb',
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Stack gap={2}>
            <Text style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>₩700,000</Text>
            <Text style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6' }}>₩500,000</Text>
          </Stack>
          <Button
            component={Link}
            href="/pricing"
            size="md"
            radius="xl"
            style={{
              background: '#8b5cf6',
              fontWeight: 700,
              fontSize: '15px',
              flexShrink: 0,
              boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
            }}
          >
            신청하기
          </Button>
        </Group>
      </Box>
    );
  }

  return (
    <Box
      style={{
        position: 'fixed',
        top: '50%',
        right: '24px',
        transform: 'translateY(-50%)',
        zIndex: 1000,
        width: '260px',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          p="xl"
          radius="xl"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
          }}
        >
          <Stack gap="md">
            <Text fw={700} style={{ fontSize: '17px', color: '#111827' }}>
              올인원 패스
            </Text>
            <Stack gap={4}>
              <Text style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>₩700,000</Text>
              <Text style={{ fontSize: '30px', fontWeight: 800, color: '#8b5cf6' }}>₩500,000</Text>
            </Stack>
            <Button
              component={Link}
              href="/pricing"
              size="md"
              fullWidth
              radius="xl"
              style={{
                background: '#8b5cf6',
                fontWeight: 700,
                boxShadow: '0 2px 12px rgba(139, 92, 246, 0.3)',
              }}
            >
              신청하기
            </Button>
            <Text size="xs" ta="center" style={{ color: '#9ca3af' }}>
              무료 체험 30크레딧 포함
            </Text>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}


// ============================================================
// Export
// ============================================================
export default function LandingPage() {
  return (
    <main style={{ background: '#fff' }}>
      <LandingHeader />
      <HeroSection />
      <PainSection />
      <WhyFlowSpotSection />
      <HowItWorksSection />
      <PackageSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingCTA />
    </main>
  );
}
