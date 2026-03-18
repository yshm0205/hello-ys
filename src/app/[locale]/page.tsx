'use client';

/**
 * FlowSpot 랜딩 페이지 — v3 (frontend-design skill 적용)
 * Refined Editorial: zinc neutrals, monospace data accents, intentional violet
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

/* ─── Design tokens ─── */
const ease = [0.25, 0.1, 0.25, 1] as const;
const mono = { fontFamily: 'var(--font-geist-mono), ui-monospace, monospace' };

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease },
};

const gridBg = {
  backgroundImage: `
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)
  `,
  backgroundSize: '56px 56px',
};


/* ═══════════════════════════════════════════════════════════════
   CountUp — 숫자 카운트 애니메이션
   ═══════════════════════════════════════════════════════════════ */
function CountUp({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const delay = setTimeout(() => {
      let n = 0;
      const step = target / (1400 / 16);
      const interval = setInterval(() => {
        n += step;
        if (n >= target) { setCount(target); clearInterval(interval); }
        else setCount(Math.floor(n));
      }, 16);
    }, 900);
    return () => clearTimeout(delay);
  }, [target]);
  return <>{count}</>;
}


/* ═══════════════════════════════════════════════════════════════
   useIsMobile — 반응형 분기 훅
   ═══════════════════════════════════════════════════════════════ */
function useIsMobile(bp = 768) {
  const [m, setM] = useState(false);
  useEffect(() => {
    const c = () => setM(window.innerWidth < bp);
    c(); window.addEventListener('resize', c);
    return () => window.removeEventListener('resize', c);
  }, [bp]);
  return m;
}


/* ═══════════════════════════════════════════════════════════════
   섹션 1: Hero — 최단거리 포지셔닝
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <Box
      component="section"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {/* Ambient glow */}
      <Box style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 50% at 50% 45%, rgba(139,92,246,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid */}
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      {/* Deco ring — top right */}
      <Box style={{
        position: 'absolute', top: '-100px', right: '-100px',
        width: '360px', height: '360px', borderRadius: '50%',
        border: '1px solid rgba(139,92,246,0.12)', pointerEvents: 'none',
      }} />

      {/* Deco ring — bottom left */}
      <Box style={{
        position: 'absolute', bottom: '-60px', left: '-60px',
        width: '240px', height: '240px', borderRadius: '50%',
        border: '1px solid rgba(139,92,246,0.1)', pointerEvents: 'none',
      }} />

      <Container size={620} py={80} style={{ position: 'relative', zIndex: 1 }}>
        <Stack align="center" gap={0}>
          {/* Package components — 한눈에 구성요소 */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
          >
            <Text ta="center" style={{
              color: '#71717a', fontSize: '14px', fontWeight: 600,
              letterSpacing: '0.05em', marginBottom: '24px',
              ...mono,
            }}>
              VOD 59강 · AI 스크립트 · 채널 리스트 · 전자책
            </Text>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35, ease }}
          >
            <Title order={1} ta="center" style={{
              fontSize: 'clamp(38px, 8vw, 72px)',
              fontWeight: 900,
              color: '#18181b',
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              marginBottom: '28px',
            }}>
              쇼츠 수익화의
              <br />
              <span style={{
                color: '#8b5cf6', position: 'relative', display: 'inline-block',
                ...mono,
              }}>
                최단거리
                <Box style={{
                  position: 'absolute', bottom: '2px', left: '-4px', right: '-4px',
                  height: '10px', background: 'rgba(139,92,246,0.22)',
                  borderRadius: '5px', zIndex: -1,
                }} />
              </span>
            </Title>
          </motion.div>

          {/* Subline */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease }}
          >
            <Text ta="center" style={{
              color: '#52525b', fontSize: 'clamp(17px, 2.5vw, 20px)',
              maxWidth: '440px', lineHeight: 1.6, marginBottom: '36px',
            }}>
              뭘 해야 하는지 알려주고, AI가 대신 실행합니다
            </Text>
          </motion.div>

          {/* Badges — 4개 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7, ease }}
          >
            <Group gap={10} justify="center" mb={40} style={{ flexWrap: 'wrap' }}>
              {['📚 VOD 59강', '🤖 AI 스크립트', '📊 채널 리스트', '📖 전자책'].map((label) => (
                <Badge key={label} size="lg" variant="light" radius="xl" style={{
                  padding: '10px 18px', fontSize: '13px', fontWeight: 600,
                  color: '#52525b', background: 'rgba(250,250,250,0.9)',
                  border: '1px solid #d4d4d8',
                }}>
                  {label}
                </Badge>
              ))}
            </Group>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85, ease }}
          >
            <Stack align="center" gap={14}>
              <Button
                component={Link} href="/dashboard" size="xl" radius="xl"
                rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
                style={{
                  background: '#8b5cf6', fontSize: '17px', fontWeight: 700,
                  padding: '18px 44px', height: 'auto', border: 'none',
                  boxShadow: '0 1px 2px rgba(139,92,246,0.15), 0 4px 16px rgba(139,92,246,0.2)',
                }}
              >
                무료로 시작하기
              </Button>
              <Text size="sm" style={{ color: '#71717a', fontSize: '13px' }}>
                30크레딧 무료 · 카드 등록 없음
              </Text>
            </Stack>
          </motion.div>
        </Stack>
      </Container>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)' }}
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChevronDown size={20} color="#a1a1aa" />
        </motion.div>
      </motion.div>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 2: Pain — 돌아가는 길 3가지
   ═══════════════════════════════════════════════════════════════ */
function PainSection() {
  const isMobile = useIsMobile();
  const pains = [
    { num: '01', title: '혼자 영상 만들어봤는데', desc: '6시간 걸려 만들었는데', metric: '조회수 47회', accent: '#ef4444' },
    { num: '02', title: '강의 들어봤는데', desc: '수십만 원 썼는데', metric: '돌아온 건 "노력 부족"', accent: '#f59e0b' },
    { num: '03', title: 'AI 써봤는데', desc: '쇼츠 공식 모르는 AI', metric: '조회수 안 나옴', accent: '#52525b' },
  ];

  return (
    <Box component="section" style={{ background: '#ffffff', padding: '120px 0' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Title order={2} ta="center" style={{
            fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800,
            color: '#18181b', letterSpacing: '-0.03em', marginBottom: '64px',
          }}>
            그런데 대부분은 이 길을{' '}
            <span style={{
              color: '#ef4444', textDecoration: 'underline',
              textDecorationColor: 'rgba(239,68,68,0.25)',
              textUnderlineOffset: '6px', textDecorationThickness: '3px',
            }}>
              돌아가고
            </span>
            {' '}있습니다
          </Title>
        </motion.div>

        <Box style={{ display: 'flex', gap: isMobile ? '8px' : '20px' }}>
            {pains.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12, ease }}
                style={{ flex: '1 1 0', minWidth: 0 }}
              >
                <Paper p={0} radius={isMobile ? 'md' : 'lg'} style={{
                  background: '#ffffff', border: '1px solid #d4d4d8',
                  overflow: 'hidden', height: '100%',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <Box style={{ height: isMobile ? '3px' : '4px', background: p.accent }} />
                  <Box style={{ padding: isMobile ? '12px' : '28px' }}>
                    <Text style={{
                      fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: p.accent,
                      letterSpacing: '0.08em', marginBottom: isMobile ? '8px' : '16px', ...mono,
                    }}>
                      {p.num}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMobile ? '14px' : '18px', color: '#18181b', marginBottom: isMobile ? '6px' : '12px', lineHeight: 1.4 }}>
                      {p.title}
                    </Text>
                    <Text style={{ fontSize: isMobile ? '12px' : '15px', color: '#52525b', lineHeight: 1.5, marginBottom: isMobile ? '4px' : '8px' }}>
                      {p.desc}
                    </Text>
                    <Text fw={700} style={{ fontSize: isMobile ? '13px' : '17px', color: p.accent, ...mono }}>
                      {p.metric}
                    </Text>
                  </Box>
                </Paper>
              </motion.div>
            ))}
          </Box>

        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.4, ease }}>
          <Text ta="center" style={{ color: '#71717a', fontSize: '15px', marginTop: '48px', fontStyle: 'italic' }}>
            공식 없이 시작하면 전부 돌아가는 길입니다.
          </Text>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 3: WhyFlowSpot — 스토리 + 수익 증명
   ═══════════════════════════════════════════════════════════════ */
function WhyFlowSpotSection() {
  const isMobile = useIsMobile();
  const revenues = [
    { label: '채널A 지식/정보', amount: '₩488만', icon: '📊' },
    { label: '채널B 게임', amount: '₩1,567만', icon: '🎮' },
    { label: '채널C 해외반응', amount: '₩923만', icon: '🌍' },
    { label: '네이버 클립', amount: '₩1,920만', icon: '📱' },
    { label: '다음 숏폼', amount: '₩149만', icon: '▶️' },
  ];

  function ScreenFrame({ r, delay }: { r: typeof revenues[0]; delay: number }) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay, ease }}
        style={{ flex: '1 1 0', minWidth: 0 }}
      >
        <Paper radius={isMobile ? 'md' : 'lg'} style={{ border: '2px dashed #a1a1aa', background: '#ffffff', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          {/* Window chrome */}
          <Box style={{
            padding: isMobile ? '5px 6px' : '8px 12px', borderBottom: '1px solid #d4d4d8',
            display: 'flex', alignItems: 'center', gap: isMobile ? '3px' : '6px',
          }}>
            <Box style={{ width: isMobile ? 5 : 7, height: isMobile ? 5 : 7, borderRadius: '50%', background: '#a1a1aa' }} />
            <Box style={{ width: isMobile ? 5 : 7, height: isMobile ? 5 : 7, borderRadius: '50%', background: '#a1a1aa' }} />
            <Box style={{ width: isMobile ? 5 : 7, height: isMobile ? 5 : 7, borderRadius: '50%', background: '#a1a1aa' }} />
            <Text size="xs" style={{ color: '#71717a', marginLeft: isMobile ? '4px' : '8px', fontSize: isMobile ? '10px' : '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</Text>
          </Box>
          {/* Capture area */}
          <Box style={{
            height: isMobile ? '56px' : '100px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#fafafa',
          }}>
            <Stack align="center" gap={2}>
              <Text style={{ fontSize: isMobile ? '18px' : '28px' }}>{r.icon}</Text>
              {!isMobile && <Text size="xs" style={{ color: '#71717a', fontSize: '11px' }}>수익 캡처</Text>}
            </Stack>
          </Box>
          {/* Amount */}
          <Box style={{
            padding: isMobile ? '6px 6px' : '10px 14px', borderTop: '1px solid #d4d4d8',
            display: 'flex', justifyContent: isMobile ? 'center' : 'space-between', alignItems: 'center',
          }}>
            {!isMobile && <Text style={{ color: '#52525b', fontSize: '12px' }}>{r.label}</Text>}
            <Text fw={800} style={{ fontSize: isMobile ? '12px' : '16px', color: '#18181b', ...mono }}>{r.amount}</Text>
          </Box>
        </Paper>
      </motion.div>
    );
  }

  return (
    <Box component="section" style={{ background: '#fafafa', padding: '120px 0', position: 'relative' }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={0}>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em', marginBottom: '12px',
            }}>
              저도 돌아가는 길 다 걸어봤습니다
            </Title>
            <Text ta="center" style={{ fontSize: '16px', color: '#71717a', marginBottom: '56px' }}>
              그리고 결국 공식을 찾았습니다.
            </Text>
          </Stack>
        </motion.div>

        {/* Revenue grid */}
        <Box style={{ maxWidth: '920px', margin: '0 auto' }}>
          <Box style={{ display: 'flex', gap: isMobile ? '6px' : '14px', marginBottom: isMobile ? '6px' : '14px' }}>
            {revenues.slice(0, 3).map((r, i) => (
              <ScreenFrame key={i} r={r} delay={i * 0.1} />
            ))}
          </Box>
          <Box style={{ display: 'flex', gap: isMobile ? '6px' : '14px', justifyContent: 'center' }}>
            {revenues.slice(3).map((r, i) => (
              <ScreenFrame key={i} r={r} delay={0.3 + i * 0.1} />
            ))}
          </Box>
        </Box>

        {/* Bridge — pull-quote style */}
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2, ease }}>
          <Box style={{ maxWidth: '640px', margin: '72px auto 0' }}>
            <Box style={{
              padding: '40px 32px',
              borderLeft: '4px solid #8b5cf6',
              background: '#ffffff',
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <Text style={{
                fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800,
                color: '#18181b', lineHeight: 1.35, marginBottom: '16px',
              }}>
                분야가 달라도 통하는 공식이 있었습니다
              </Text>
              <Text style={{ fontSize: '16px', color: '#52525b', lineHeight: 1.7, marginBottom: '20px' }}>
                체계화한 뒤, 채널 1개 주 4시간으로 월 200-300
              </Text>
              <Text fw={700} style={{ fontSize: '18px', color: '#8b5cf6' }}>
                그 체계가 59강 강의와 AI 스크립트 도구입니다 →
              </Text>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 4: HowItWorks — 플로우차트 진단 (Q→NO→Q→YES↓→카드)
   ═══════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const isMobile = useIsMobile();
  const stages = [
    {
      qNum: 'Q1', question: '쇼츠, 처음이신가요?',
      label: '입문', color: '#8b5cf6',
      answer: '기획부터 수익화까지 순서대로 알려드립니다.',
      includes: ['전자책 (기초 가이드)', 'VOD 59강 (순차 학습)', 'AI 스크립트 6개월'],
    },
    {
      qNum: 'Q2', question: '하고 있는데 성장이 안 되나요?',
      label: '성장', color: '#22c55e',
      answer: '터지는 영상에는 공식이 있습니다. 그 공식을 드립니다.',
      includes: ['채널 리스트 (벤치마크)', 'AI 스크립트 (검증된 구조)', 'VOD 59강 (심화)'],
    },
    {
      qNum: 'Q3', question: '혼자 하려니 지치셨나요?',
      label: '시스템화', color: '#3b82f6',
      answer: '반복 작업은 AI에게. 당신은 기획만 하세요.',
      includes: ['노션 운영 템플릿', 'AI 스크립트 (자동화)', '채널 리스트 (트렌드)'],
    },
  ];

  return (
    <Box component="section" id="how-it-works" style={{ background: '#ffffff', padding: '120px 0' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56}>
            <Badge size="lg" variant="light" color="violet" radius="xl" style={{
              padding: '8px 18px', fontSize: '13px',
            }}>
              자가 진단
            </Badge>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em',
            }}>
              지금 어디에 계신가요?
            </Title>
          </Stack>
        </motion.div>

        {/* Flowchart */}
        <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Box style={{ minWidth: isMobile ? '600px' : '900px', padding: '0 20px' }}>

            {/* ── Row 1: Question boxes + NO arrows ── */}
            <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
              {stages.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.15, ease }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  {/* Question box */}
                  <Box style={{
                    width: isMobile ? '160px' : '240px',
                    background: '#18181b',
                    borderRadius: isMobile ? '12px' : '16px',
                    padding: isMobile ? '14px 10px' : '24px 20px',
                    textAlign: 'center',
                    position: 'relative',
                  }}>
                    <Text style={{
                      ...mono, fontSize: isMobile ? '11px' : '12px', fontWeight: 800,
                      color: s.color, letterSpacing: '0.1em',
                      marginBottom: isMobile ? '6px' : '10px',
                    }}>
                      {s.qNum}
                    </Text>
                    <Text fw={700} style={{
                      fontSize: isMobile ? '12px' : '15px', color: '#ffffff', lineHeight: 1.4,
                    }}>
                      {s.question}
                    </Text>
                  </Box>

                  {/* NO → arrow */}
                  {i < stages.length - 1 && (
                    <Box style={{
                      display: 'flex', alignItems: 'center', padding: isMobile ? '0 4px' : '0 8px',
                      flexShrink: 0,
                    }}>
                      <Box style={{ width: isMobile ? '16px' : '40px', height: '0', borderTop: '2px dashed #a1a1aa' }} />
                      <Box style={{
                        background: '#f4f4f5', borderRadius: '20px',
                        padding: isMobile ? '3px 8px' : '4px 12px', whiteSpace: 'nowrap',
                      }}>
                        <Text style={{ ...mono, fontSize: isMobile ? '10px' : '11px', fontWeight: 700, color: '#71717a' }}>
                          NO →
                        </Text>
                      </Box>
                      <Box style={{ width: isMobile ? '16px' : '40px', height: '0', borderTop: '2px dashed #a1a1aa' }} />
                    </Box>
                  )}
                </motion.div>
              ))}
            </Box>

            {/* ── Row 2: YES ↓ indicators ── */}
            <Box style={{
              display: 'flex', justifyContent: 'center', gap: 0,
              marginTop: isMobile ? '10px' : '16px',
            }}>
              {stages.map((s, i) => (
                <Box key={i} style={{
                  width: isMobile ? '160px' : '240px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  marginLeft: i > 0 ? (isMobile ? '60px' : '112px') : 0,
                }}>
                  <Box style={{ width: '0', height: isMobile ? '12px' : '20px', borderLeft: `2px dashed ${s.color}`, opacity: 0.4 }} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: 0.3 + i * 0.1, ease }}
                  >
                    <Box style={{
                      background: s.color, borderRadius: '20px',
                      padding: isMobile ? '3px 10px' : '4px 16px',
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                    }}>
                      <Text style={{ ...mono, fontSize: isMobile ? '10px' : '11px', fontWeight: 800, color: '#ffffff' }}>
                        YES ↓
                      </Text>
                    </Box>
                  </motion.div>
                  <Box style={{ width: '0', height: isMobile ? '12px' : '20px', borderLeft: `2px dashed ${s.color}`, opacity: 0.4 }} />
                </Box>
              ))}
            </Box>

            {/* ── Row 3: Answer cards ── */}
            <Box style={{ display: 'flex', justifyContent: 'center', gap: 0 }}>
              {stages.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: 0.4 + i * 0.12, ease }}
                  style={{
                    width: isMobile ? '160px' : '240px',
                    marginLeft: i > 0 ? (isMobile ? '60px' : '112px') : 0,
                  }}
                >
                  <Paper radius={isMobile ? 'md' : 'lg'} p={0} style={{
                    background: '#ffffff', border: '1px solid #d4d4d8',
                    overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}>
                    <Box style={{
                      background: s.color,
                      padding: isMobile ? '6px 10px' : '10px 20px',
                      textAlign: 'center',
                    }}>
                      <Text fw={800} style={{ fontSize: isMobile ? '12px' : '14px', color: '#ffffff', letterSpacing: '0.02em' }}>
                        {s.label}
                      </Text>
                    </Box>

                    <Box style={{ padding: isMobile ? '10px' : '20px' }}>
                      <Text style={{
                        fontSize: isMobile ? '11px' : '13px', color: '#52525b', lineHeight: 1.5, marginBottom: isMobile ? '8px' : '16px',
                      }}>
                        {s.answer}
                      </Text>

                      <Box style={{ height: '1px', background: '#d4d4d8', marginBottom: isMobile ? '8px' : '14px' }} />

                      <Text size="xs" fw={600} mb={isMobile ? 6 : 10} style={{
                        color: '#71717a', letterSpacing: '0.04em', fontSize: isMobile ? '9px' : '10px',
                        textTransform: 'uppercase',
                      }}>
                        포함 솔루션
                      </Text>
                      <Stack gap={isMobile ? 4 : 7}>
                        {s.includes.map((item, j) => (
                          <Group key={j} gap={isMobile ? 4 : 7} wrap="nowrap">
                            <Check size={isMobile ? 10 : 13} color={s.color} strokeWidth={3} style={{ flexShrink: 0 }} />
                            <Text style={{ color: '#3f3f46', fontSize: isMobile ? '10px' : '12px', lineHeight: 1.3 }}>{item}</Text>
                          </Group>
                        ))}
                      </Stack>
                    </Box>
                  </Paper>
                </motion.div>
              ))}
            </Box>

          </Box>
        </Box>

        {/* Convergence CTA */}
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3, ease }}>
          <Stack align="center" gap={16} mt={64}>
            <Text ta="center" style={{
              fontSize: 'clamp(22px, 3.5vw, 30px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.02em',
            }}>
              어떤 단계든,{' '}
              <span style={{ color: '#8b5cf6' }}>올인원 하나</span>면 됩니다
            </Text>
            <Button
              component={Link} href="/dashboard" size="lg" radius="xl"
              style={{
                background: '#8b5cf6', fontSize: '16px', fontWeight: 700,
                padding: '14px 40px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(139,92,246,0.2)',
              }}
            >
              무료로 시작하기
            </Button>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 5: Package — 가격 비교 + 부분별 가치
   ═══════════════════════════════════════════════════════════════ */
function PackageSection() {
  const isMobile = useIsMobile();
  return (
    <Box component="section" style={{ background: '#fafafa', padding: '120px 0', position: 'relative' }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56}>
            <Badge size="lg" variant="light" color="cyan" radius="xl" style={{ padding: '8px 18px', fontSize: '13px' }}>
              가격 비교
            </Badge>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em',
            }}>
              왜 이 가격인가요?
            </Title>
          </Stack>
        </motion.div>

        {/* Comparison */}
        <Box style={{ marginBottom: '56px' }}>
          <Box style={{ display: 'flex', gap: isMobile ? '8px' : '20px', justifyContent: 'center', alignItems: 'stretch' }}>
            {/* 일반 유료 강의 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease }}
              style={{ flex: '1 1 0', maxWidth: '380px', minWidth: 0 }}
            >
              <Paper radius={isMobile ? 'md' : 'lg'} style={{
                background: '#ffffff', border: '1px solid #d4d4d8',
                height: '100%', padding: isMobile ? '16px' : '32px',
              }}>
                <Group mb={isMobile ? 12 : 24} gap={isMobile ? 6 : 10}>
                  <Box style={{
                    width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, borderRadius: 8,
                    background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <X size={isMobile ? 14 : 18} color="#ef4444" />
                  </Box>
                  <Text fw={700} style={{ fontSize: isMobile ? '14px' : '18px', color: '#52525b' }}>일반 유료 강의</Text>
                </Group>
                <Stack gap={isMobile ? 8 : 14}>
                  {[
                    '가격 99~160만원',
                    '강의만 제공 (실행은 알아서)',
                    '기간 제한 (100일, 기수제)',
                    '대본은 직접 써야 함',
                    'AI 도구 없음',
                  ].map((t, i) => (
                    <Group key={i} gap={isMobile ? 6 : 10} wrap="nowrap">
                      <X size={isMobile ? 12 : 14} color="#a1a1aa" style={{ flexShrink: 0 }} />
                      <Text style={{ color: '#52525b', fontSize: isMobile ? '12px' : '14px', lineHeight: 1.4 }}>{t}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </motion.div>

            {/* 올인원 패스 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15, ease }}
              style={{ flex: '1 1 0', maxWidth: '380px', minWidth: 0 }}
            >
              <Paper radius={isMobile ? 'md' : 'lg'} style={{
                background: '#ffffff', border: '2px solid #8b5cf6',
                height: '100%', position: 'relative',
                padding: isMobile ? '16px' : '32px',
                boxShadow: '0 4px 24px rgba(139,92,246,0.1), 0 1px 2px rgba(0,0,0,0.04)',
              }}>
                <Badge color="violet" size="sm" style={{
                  position: 'absolute', top: -10, right: isMobile ? 12 : 20,
                  boxShadow: '0 2px 8px rgba(139,92,246,0.25)',
                }}>
                  추천
                </Badge>
                <Group mb={isMobile ? 12 : 24} gap={isMobile ? 6 : 10}>
                  <Box style={{
                    width: isMobile ? 24 : 32, height: isMobile ? 24 : 32, borderRadius: 8,
                    background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Check size={isMobile ? 14 : 18} color="#22c55e" />
                  </Box>
                  <Text fw={700} style={{ fontSize: isMobile ? '14px' : '18px', color: '#18181b' }}>올인원 패스</Text>
                </Group>
                <Stack gap={isMobile ? 8 : 14}>
                  {[
                    '가격 50만원 (60% 저렴)',
                    '강의 + AI로 바로 실행',
                    '강의 4개월 수강',
                    'AI가 3분 만에 대본 작성',
                    'AI 스크립트 도구 6개월',
                  ].map((t, i) => (
                    <Group key={i} gap={isMobile ? 6 : 10} wrap="nowrap">
                      <Check size={isMobile ? 12 : 14} color="#22c55e" style={{ flexShrink: 0 }} />
                      <Text fw={500} style={{ color: '#18181b', fontSize: isMobile ? '12px' : '14px', lineHeight: 1.4 }}>{t}</Text>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </motion.div>
          </Box>
        </Box>

        {/* Value breakdown — receipt */}
        <motion.div {...fadeUp}>
          <Paper p={36} radius="lg" style={{
            background: '#ffffff', border: '1px solid #d4d4d8',
            maxWidth: '720px', margin: '0 auto',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <Text fw={700} ta="center" style={{ fontSize: '20px', color: '#18181b', marginBottom: '28px' }}>
              뭐가 들어있나요?
            </Text>
            <Stack gap={0}>
              {[
                { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
                { item: 'AI 스크립트 도구 6개월', value: '₩600,000' },
                { item: '채널 분석 피드백', value: '₩100,000' },
                { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
              ].map((row, i) => (
                <Group key={i} justify="space-between" style={{
                  padding: '14px 0', borderBottom: i < 3 ? '1px solid #f4f4f5' : 'none',
                }}>
                  <Text style={{ color: '#3f3f46', fontSize: '14px' }}>{row.item}</Text>
                  <Text fw={600} style={{ color: '#52525b', fontSize: '14px', ...mono }}>{row.value}</Text>
                </Group>
              ))}
            </Stack>
            <Divider my="xl" color="#d4d4d8" />
            <Group justify="space-between" align="center" wrap="wrap" gap={12}>
              <Text fw={600} style={{ color: '#71717a', fontSize: '15px', textDecoration: 'line-through', ...mono }}>
                총 ₩1,390,000
              </Text>
              <Group gap={12} align="center">
                <Text fw={900} style={{ fontSize: '32px', color: '#18181b', ...mono }}>₩500,000</Text>
                <Badge color="red" size="md" style={{ fontSize: '13px' }}>64%</Badge>
              </Group>
            </Group>
          </Paper>
        </motion.div>

        {/* Employee comparison */}
        <motion.div {...fadeUp}>
          <Paper p={36} radius="lg" style={{
            background: '#ffffff', border: '1px solid #d4d4d8',
            textAlign: 'center', maxWidth: '600px', margin: '40px auto 0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <Text fw={600} style={{ fontSize: '16px', color: '#52525b', marginBottom: '24px' }}>
              이렇게 생각해보세요
            </Text>
            <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Group justify="center" gap={36} wrap="nowrap" style={{ minWidth: '380px' }}>
                <Stack gap={4} align="center">
                  <Text style={{ fontSize: '13px', color: '#71717a' }}>스크립트 작가 1명</Text>
                  <Text fw={800} style={{ fontSize: '26px', color: '#18181b', ...mono }}>월 200만원</Text>
                </Stack>
                <Text style={{ fontSize: '24px', color: '#a1a1aa', fontWeight: 300 }}>vs</Text>
                <Stack gap={4} align="center">
                  <Text style={{ fontSize: '13px', color: '#71717a' }}>AI 스크립트 6개월</Text>
                  <Text fw={800} style={{ fontSize: '26px', color: '#8b5cf6', ...mono }}>50만원</Text>
                </Stack>
              </Group>
            </Box>
            <Text mt={20} style={{ fontSize: '15px', color: '#52525b' }}>
              = <b style={{ color: '#18181b' }}>월 4만원</b> = 커피 10잔 값으로{' '}
              <b style={{ color: '#8b5cf6' }}>24시간 일하는 직원</b>
            </Text>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 6: FAQ
   ═══════════════════════════════════════════════════════════════ */
function FAQSection() {
  const faqs = [
    { q: 'AI 1도 몰라도 되나요?', a: '네. 버튼 3개만 누르면 됩니다. 원리는 강의에서 알려드려요.' },
    { q: '진짜 수익이 나나요?', a: '전자책 수강생 중 월 700만원 달성자가 있습니다. 실행만 하시면 됩니다.' },
    { q: '환불 되나요?', a: '결제 후 7일 이내, 강의 1강도 수강하지 않은 경우 전액 환불됩니다. 수강을 시작한 경우에도 이러닝 표준약관에 따라 (1강 단가 × 수강 강의 수 + 위약금 10%)를 공제 후 환불됩니다.' },
    { q: '강의 기간은요?', a: '강의는 4개월 수강, AI 도구는 6개월 이용권입니다.' },
    { q: '크레딧을 다 쓰면요?', a: '설정 > 플랜 & 결제에서 크레딧 팩(30개 ₩9,900 / 100개 ₩29,900)을 추가 구매할 수 있습니다.' },
  ];

  return (
    <Box component="section" id="faq" style={{ background: '#ffffff', padding: '120px 0' }}>
      <Container size={640}>
        <motion.div {...fadeUp}>
          <Title order={2} ta="center" style={{
            color: '#18181b', fontSize: 'clamp(28px, 5vw, 40px)',
            fontWeight: 800, marginBottom: '48px', letterSpacing: '-0.03em',
          }}>
            자주 묻는 질문
          </Title>
        </motion.div>
        <Accordion
          variant="separated"
          radius="lg"
          styles={{
            item: { background: '#ffffff', border: '1px solid #d4d4d8', marginBottom: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' },
            control: { color: '#18181b', fontWeight: 600, fontSize: '15px', padding: '18px 20px' },
            panel: { color: '#52525b', fontSize: '14px', lineHeight: 1.7, padding: '0 20px 18px' },
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


/* ═══════════════════════════════════════════════════════════════
   섹션 7: CTA — 최종 전환
   ═══════════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <Box component="section" style={{
      background: '#fafafa', padding: '120px 0', position: 'relative', overflow: 'hidden',
    }}>
      <Box style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '500px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <Container size="md" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={20}>
            <Title order={2} ta="center" style={{
              color: '#18181b', fontSize: 'clamp(28px, 5vw, 42px)',
              fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.03em',
            }}>
              지금 시작하지 않으면,
              <br />
              내일도 같은 고민을 하게 됩니다
            </Title>
            <Button
              component={Link} href="/dashboard" size="xl" radius="xl"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: '#8b5cf6', fontSize: '17px', fontWeight: 700,
                padding: '18px 44px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(139,92,246,0.2)',
              }}
            >
              무료로 시작하기
            </Button>
            <Stack align="center" gap={4}>
              <Text size="sm" style={{ color: '#71717a', fontSize: '13px' }}>
                30크레딧 무료 · 7일 환불 보장
              </Text>
              <Text size="sm" style={{ color: '#71717a', fontSize: '13px' }}>
                문의: hmys0205hmys@gmail.com
              </Text>
            </Stack>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Footer
   ═══════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <Box component="footer" style={{ background: '#18181b', padding: '48px 0' }}>
      <Container size="lg">
        <Stack align="center" gap={16}>
          <Group gap={8}>
            <Bot size={20} color="#8b5cf6" />
            <Text fw={600} style={{ color: '#ffffff', fontSize: '16px' }}>FlowSpot</Text>
          </Group>
          <Group gap={16} justify="center">
            <Anchor component={Link} href="/terms" size="sm" style={{ color: '#a1a1aa', fontSize: '13px' }}>이용약관</Anchor>
            <Anchor component={Link} href="/privacy" size="sm" style={{ color: '#a1a1aa', fontSize: '13px' }}>개인정보처리방침</Anchor>
            <Anchor component={Link} href="/refund" size="sm" style={{ color: '#a1a1aa', fontSize: '13px' }}>환불 규정</Anchor>
          </Group>
          <Stack align="center" gap={2}>
            <Text size="xs" style={{ color: '#71717a', fontSize: '12px' }}>
              플로우스팟 | 대표: 이하민, 김예성 | 사업자등록번호: 693-07-02115
            </Text>
            <Text size="xs" style={{ color: '#71717a', fontSize: '12px' }}>
              통신판매업 신고번호: 2022-충남천안-0095 | 전화: 070-8027-2849
            </Text>
            <Text size="xs" style={{ color: '#71717a', fontSize: '12px' }}>
              주소: 충남 천안시 서북구 두정동 1225, 401호
            </Text>
          </Stack>
          <Text size="xs" style={{ color: '#71717a', fontSize: '12px' }}>
            © 2026 FlowSpot. All rights reserved.
          </Text>
        </Stack>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Floating CTA
   ═══════════════════════════════════════════════════════════════ */
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
      <Box style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff', borderTop: '1px solid #d4d4d8',
        padding: '12px 16px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
      }}>
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Stack gap={2}>
            <Text style={{ fontSize: '12px', color: '#71717a', textDecoration: 'line-through', ...mono }}>₩700,000</Text>
            <Text style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6', ...mono }}>₩500,000</Text>
          </Stack>
          <Button
            component={Link} href="/pricing" size="md" radius="xl"
            style={{
              background: '#8b5cf6', fontWeight: 700, fontSize: '14px', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
            }}
          >
            신청하기
          </Button>
        </Group>
      </Box>
    );
  }

  return (
    <Box style={{
      position: 'fixed', top: '50%', right: '24px',
      transform: 'translateY(-50%)', zIndex: 1000, width: '240px',
    }}>
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease }}
      >
        <Paper p="lg" radius="lg" style={{
          background: '#ffffff', border: '1px solid #d4d4d8',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <Stack gap={12}>
            <Text fw={700} style={{ fontSize: '15px', color: '#18181b' }}>올인원 패스</Text>
            <Stack gap={2}>
              <Text style={{ fontSize: '12px', color: '#71717a', textDecoration: 'line-through', ...mono }}>₩700,000</Text>
              <Text style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6', ...mono }}>₩500,000</Text>
            </Stack>
            <Button
              component={Link} href="/pricing" size="sm" fullWidth radius="lg"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
              }}
            >
              신청하기
            </Button>
            <Text size="xs" ta="center" style={{ color: '#71717a', fontSize: '11px' }}>
              무료 체험 30크레딧 포함
            </Text>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  return (
    <main style={{ background: '#ffffff' }}>
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
