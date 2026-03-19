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
   섹션 1: Hero — 다크 카드 블록 (크리투스 스타일)
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {

  return (
    <Box
      component="section"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: '#ffffff',
        padding: 'clamp(80px, 12vw, 120px) 0 clamp(48px, 8vw, 80px)',
      }}
    >
      {/* 다크 히어로 카드 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
        style={{ width: '100%', maxWidth: '600px', padding: '0 16px' }}
      >
        <Box style={{
          background: '#18181b',
          borderRadius: '24px',
          padding: 'clamp(32px, 6vw, 48px) clamp(20px, 4vw, 40px)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(24,24,27,0.3), 0 2px 8px rgba(0,0,0,0.1)',
        }}>
          {/* 배경 데코 — violet glow */}
          <Box style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px', borderRadius: '50%',
            background: 'rgba(139,92,246,0.12)', filter: 'blur(40px)',
            pointerEvents: 'none',
          }} />
          <Box style={{
            position: 'absolute', bottom: '-40px', left: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'rgba(139,92,246,0.08)', filter: 'blur(30px)',
            pointerEvents: 'none',
          }} />

          <Stack align="center" gap={0} style={{ position: 'relative', zIndex: 1 }}>
            {/* 구성요소 나열 */}
            <Text ta="center" style={{
              color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(17px, 4vw, 20px)',
              fontWeight: 600, letterSpacing: '0.02em',
              marginBottom: 'clamp(20px, 4vw, 28px)',
            }}>
              VOD강의 + 매달 트렌드 채널 데이터 + 전자책 + AI 스크립트 도구
            </Text>

            {/* 헤드라인 */}
            <Title order={1} ta="center" style={{
              fontSize: 'clamp(32px, 8vw, 56px)',
              fontWeight: 900, color: '#ffffff',
              lineHeight: 1.15, letterSpacing: '-0.03em',
              marginBottom: 'clamp(24px, 5vw, 36px)',
            }}>
              쇼츠 수익화
              <br />
              <span style={{
                color: '#a78bfa', position: 'relative', display: 'inline-block',
              }}>
                최단거리
                <Box style={{
                  position: 'absolute', bottom: '2px', left: '-2px', right: '-2px',
                  height: '8px', background: 'rgba(167,139,250,0.3)',
                  borderRadius: '4px', zIndex: -1,
                }} />
              </span>
              {' '}패키지
            </Title>

            {/* CTA 버튼 */}
            <Button
              component={Link} href="/dashboard" size="xl" radius="xl"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: '#ffffff', color: '#18181b',
                fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 700,
                padding: '16px 40px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(255,255,255,0.15)',
              }}
            >
              무료로 시작하기
            </Button>
          </Stack>
        </Box>
      </motion.div>

      {/* 무한 루프 섹션 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6, ease }}
        style={{
          width: '100%',
          marginTop: 'clamp(56px, 9vw, 80px)',
          padding: 'clamp(48px, 8vw, 80px) 16px clamp(32px, 5vw, 48px)',
          background: '#fafafa',
        }}
      >
        <Box style={{ maxWidth: '520px', margin: '0 auto' }}>
          {/* 원형 루프 시각화 — SVG 원 + HTML 라벨 */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: '380px', margin: '0 auto' }}>
            {/* SVG: 원 + 화살표 + 빨간 점만 */}
            <svg
              viewBox="0 0 200 200"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60%',
                height: '60%',
              }}
            >
              <circle cx={100} cy={100} r={85} fill="none" stroke="#d4d4d8" strokeWidth={1.2} strokeDasharray="7 5">
                <animate attributeName="stroke-dashoffset" from="0" to="-36" dur="3s" repeatCount="indefinite" />
              </circle>
              {[36, 108, 180, 252, 324].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x = 100 + 85 * Math.sin(rad);
                const y = 100 - 85 * Math.cos(rad);
                return (
                  <polygon key={angle} points="0,-4 3,2.5 -3,2.5" fill="#a1a1aa"
                    transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)}) rotate(${angle + 90})`} />
                );
              })}
              <g>
                <animateTransform attributeName="transform" type="rotate"
                  from="0 100 100" to="360 100 100" dur="8s" repeatCount="indefinite" />
                <circle cx={100} cy={15} r={4} fill="#ef4444" opacity={0.9} />
                <circle cx={100} cy={15} r={4} fill="none" stroke="#ef4444" strokeWidth={1.2}>
                  <animate attributeName="r" values="4;11;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
              {/* 원 위 5개 노드 점 */}
              {[0, 72, 144, 216, 288].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const cx = 100 + 85 * Math.sin(rad);
                const cy = 100 - 85 * Math.cos(rad);
                const isFail = angle === 288;
                return (
                  <circle key={angle} cx={cx} cy={cy} r={4}
                    fill={isFail ? '#fef2f2' : '#fff'}
                    stroke={isFail ? '#fca5a5' : '#d4d4d8'} strokeWidth={1.5} />
                );
              })}
            </svg>

            {/* HTML 라벨들 — CSS 절대 배치, clamp 폰트 */}
            {[
              { label: '채널 리서치', top: '2%', left: '50%', transform: 'translateX(-50%)', fail: false },
              { label: '기획', top: '24%', right: '0%', transform: 'none', fail: false },
              { label: '대본 작성', bottom: '4%', right: '2%', transform: 'none', fail: false },
              { label: '촬영·편집', bottom: '4%', left: '2%', transform: 'none', fail: false },
              { label: '실패', top: '24%', left: '0%', transform: 'none', fail: true },
            ].map((node) => (
              <span
                key={node.label}
                style={{
                  position: 'absolute',
                  top: node.top,
                  bottom: node.bottom,
                  left: node.left,
                  right: node.right,
                  transform: node.transform,
                  fontSize: 'clamp(14px, 3.8vw, 17px)',
                  fontWeight: 700,
                  color: node.fail ? '#ef4444' : '#3f3f46',
                  background: node.fail ? '#fef2f2' : '#ffffff',
                  border: `1.5px solid ${node.fail ? '#fca5a5' : '#e4e4e7'}`,
                  borderRadius: '10px',
                  padding: '6px 14px',
                  whiteSpace: 'nowrap',
                }}
              >
                {node.label}
              </span>
            ))}
          </div>

          {/* Todd Brown Copy 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease }}
            style={{ marginTop: 'clamp(24px, 5vw, 40px)', textAlign: 'center' }}
          >
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(30px, 8vw, 52px)',
              fontWeight: 900, color: '#18181b',
              lineHeight: 1.25, letterSpacing: '-0.03em',
            }}>
              혹시 지금도
              <br />
              이 무한 루프 속에
              <br />
              갇혀 계신가요?
            </Title>

            <Text ta="center" style={{
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              color: '#52525b', lineHeight: 1.8,
              marginTop: 'clamp(20px, 4vw, 32px)',
              maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
            }}>
              수십 시간을 쏟아부어도 매번 제자리인 이유,
              <br />
              <strong style={{ color: '#18181b' }}>당신의 노력이 부족해서가 아닙니다.</strong>
            </Text>

            <Text ta="center" style={{
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              color: '#52525b', lineHeight: 1.8,
              marginTop: 'clamp(16px, 3vw, 24px)',
              maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto',
            }}>
              이 잔인한 루프를 단숨에 끊어낼
              <br />
              <span style={{ color: '#8b5cf6', fontWeight: 800, fontSize: 'clamp(20px, 5vw, 26px)' }}>
                &lsquo;검증된 쇼츠 공식&rsquo;
              </span>
              <br />이 없었을 뿐입니다.
            </Text>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.8, ease }}
              style={{ marginTop: 'clamp(32px, 6vw, 48px)' }}
            >
              <Box style={{
                display: 'inline-block',
                padding: '16px 32px',
                background: '#f5f3ff',
                borderRadius: '16px',
                border: '1px solid #ede9fe',
              }}>
                <Text ta="center" style={{
                  fontSize: 'clamp(17px, 4.5vw, 22px)',
                  fontWeight: 700, color: '#8b5cf6',
                  lineHeight: 1.5,
                }}>
                  이제, 최단거리로 빠져나오는
                  <br />길을 보여드리겠습니다
                </Text>
                <motion.div
                  animate={{ y: [0, 6, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}
                >
                  <ChevronDown size={24} color="#8b5cf6" />
                </motion.div>
              </Box>
            </motion.div>
          </motion.div>
        </Box>
      </motion.div>

    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 2: Pain — 돌아가는 길 3가지 (풀폭 임팩트)
   ═══════════════════════════════════════════════════════════════ */
function PainSection() {
  const pains = [
    {
      num: '01', title: '혼자 영상 만들어봤는데',
      desc: '6시간 걸려 만들었는데', metric: '조회수 47회',
      accent: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    },
    {
      num: '02', title: '강의 들어봤는데',
      desc: '수십만 원 썼는데', metric: '돌아온 건 "노력 부족"',
      accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
    },
    {
      num: '03', title: 'AI 써봤는데',
      desc: '쇼츠 공식 모르는 AI', metric: '조회수 안 나옴',
      accent: '#52525b', bg: '#f4f4f5', border: '#d4d4d8',
    },
  ];

  return (
    <Box component="section" style={{ background: '#ffffff', padding: 'clamp(60px, 10vw, 120px) 0' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Title order={2} ta="center" style={{
            fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800,
            color: '#18181b', letterSpacing: '-0.03em', marginBottom: 'clamp(36px, 6vw, 64px)',
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

        <Stack gap={16} style={{ maxWidth: '640px', margin: '0 auto' }}>
          {pains.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12, ease }}
            >
              <Box style={{
                background: p.bg, border: `1.5px solid ${p.border}`,
                borderRadius: '16px', padding: 'clamp(20px, 4vw, 32px)',
                display: 'flex', alignItems: 'center', gap: 'clamp(16px, 3vw, 24px)',
              }}>
                {/* 큰 번호 */}
                <Box style={{
                  flexShrink: 0, width: 'clamp(48px, 8vw, 64px)', height: 'clamp(48px, 8vw, 64px)',
                  borderRadius: '50%', background: p.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    ...mono, fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: 900, color: '#ffffff',
                  }}>
                    {p.num}
                  </Text>
                </Box>
                {/* 텍스트 */}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={700} style={{
                    fontSize: 'clamp(18px, 4vw, 22px)', color: '#18181b',
                    lineHeight: 1.3, marginBottom: '4px',
                  }}>
                    {p.title}
                  </Text>
                  <Text style={{
                    fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#52525b',
                    lineHeight: 1.4, marginBottom: '6px',
                  }}>
                    {p.desc}
                  </Text>
                  <Text fw={800} style={{
                    fontSize: 'clamp(20px, 4.5vw, 26px)', color: p.accent, ...mono,
                  }}>
                    {p.metric}
                  </Text>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Stack>

        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.4, ease }}>
          <Text ta="center" style={{ color: '#71717a', fontSize: 'clamp(16px, 3.5vw, 18px)', marginTop: '48px', fontStyle: 'italic' }}>
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
  const revenues = [
    { label: '채널A 지식/정보', amount: '₩488만', icon: '📊' },
    { label: '채널B 게임', amount: '₩1,567만', icon: '🎮' },
    { label: '채널C 해외반응', amount: '₩923만', icon: '🌍' },
    { label: '네이버 클립', amount: '₩1,920만', icon: '📱' },
    { label: '다음 숏폼', amount: '₩149만', icon: '▶️' },
  ];

  return (
    <Box component="section" style={{ background: '#fafafa', padding: 'clamp(60px, 10vw, 120px) 0', position: 'relative' }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={0}>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em', marginBottom: '12px',
            }}>
              저도 돌아가는 길 다 걸어봤습니다
            </Title>
            <Text ta="center" style={{ fontSize: 'clamp(17px, 4vw, 20px)', color: '#71717a', marginBottom: 'clamp(32px, 5vw, 56px)' }}>
              그리고 결국 공식을 찾았습니다.
            </Text>
          </Stack>
        </motion.div>

        {/* Revenue list — 세로 풀폭 */}
        <Stack gap={12} style={{ maxWidth: '640px', margin: '0 auto' }}>
          {revenues.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease }}
            >
              <Box style={{
                display: 'flex', alignItems: 'center',
                gap: 'clamp(12px, 3vw, 20px)',
                padding: 'clamp(14px, 3vw, 20px) clamp(16px, 3vw, 24px)',
                background: '#ffffff', borderRadius: '14px',
                border: '1px solid #d4d4d8',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <Text style={{ fontSize: 'clamp(24px, 4vw, 32px)', flexShrink: 0 }}>{r.icon}</Text>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{
                    fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#71717a',
                    marginBottom: '2px',
                  }}>
                    {r.label}
                  </Text>
                  <Text fw={800} style={{
                    fontSize: 'clamp(22px, 5vw, 30px)', color: '#18181b', ...mono,
                  }}>
                    {r.amount}
                  </Text>
                </Box>
                <Text style={{
                  fontSize: 'clamp(12px, 2vw, 13px)',
                  color: '#a1a1aa', flexShrink: 0,
                }}>
                  수익 캡처
                </Text>
              </Box>
            </motion.div>
          ))}
        </Stack>

        {/* Bridge — pull-quote style */}
        <motion.div {...fadeUp} transition={{ duration: 0.6, delay: 0.2, ease }}>
          <Box style={{ maxWidth: '640px', margin: 'clamp(48px, 8vw, 72px) auto 0' }}>
            <Box style={{
              padding: 'clamp(24px, 5vw, 40px) clamp(20px, 4vw, 32px)',
              borderLeft: '4px solid #8b5cf6',
              background: '#ffffff',
              borderRadius: '0 16px 16px 0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <Text style={{
                fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800,
                color: '#18181b', lineHeight: 1.35, marginBottom: '16px',
              }}>
                분야가 달라도 통하는 공식이 있었습니다
              </Text>
              <Text style={{ fontSize: 'clamp(17px, 4vw, 20px)', color: '#52525b', lineHeight: 1.7, marginBottom: '20px' }}>
                체계화한 뒤, 채널 1개 주 4시간으로 월 200-300
              </Text>
              <Text fw={700} style={{ fontSize: 'clamp(18px, 4vw, 22px)', color: '#8b5cf6' }}>
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
   섹션 4: HowItWorks — 단계별 진단 (세로 스택)
   ═══════════════════════════════════════════════════════════════ */
function HowItWorksSection() {
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
    <Box component="section" id="how-it-works" style={{ background: '#ffffff', padding: 'clamp(60px, 10vw, 120px) 0' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={48}>
            <Badge size="lg" variant="light" color="violet" radius="xl" style={{
              padding: '8px 18px', fontSize: '14px',
            }}>
              자가 진단
            </Badge>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em',
            }}>
              지금 어디에 계신가요?
            </Title>
          </Stack>
        </motion.div>

        {/* 세로 플로차트 */}
        <Stack gap={0} style={{ maxWidth: '540px', margin: '0 auto' }}>
          {stages.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.15, ease }}
            >
              {/* Q 박스 */}
              <Box style={{
                background: '#18181b', borderRadius: '16px',
                padding: 'clamp(16px, 3vw, 24px) clamp(20px, 4vw, 28px)',
                display: 'flex', alignItems: 'center', gap: 'clamp(12px, 2vw, 16px)',
              }}>
                <Box style={{
                  flexShrink: 0, width: 'clamp(40px, 6vw, 48px)', height: 'clamp(40px, 6vw, 48px)',
                  borderRadius: '12px', background: s.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ ...mono, fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 900, color: '#ffffff' }}>
                    {s.qNum}
                  </Text>
                </Box>
                <Text fw={700} style={{ fontSize: 'clamp(18px, 4vw, 22px)', color: '#ffffff', lineHeight: 1.3 }}>
                  {s.question}
                </Text>
              </Box>

              {/* YES → 답변 카드 */}
              <Box style={{
                display: 'flex', alignItems: 'stretch',
                marginLeft: 'clamp(28px, 4vw, 40px)',
              }}>
                {/* 세로선 + YES 뱃지 */}
                <Box style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: '24px', flexShrink: 0,
                }}>
                  <Box style={{ width: 0, flex: 1, borderLeft: `2px dashed ${s.color}`, opacity: 0.4 }} />
                  <Box style={{
                    background: s.color, borderRadius: '10px',
                    padding: '2px 8px', flexShrink: 0,
                  }}>
                    <Text style={{ ...mono, fontSize: '10px', fontWeight: 800, color: '#ffffff' }}>YES</Text>
                  </Box>
                  <Box style={{ width: 0, flex: 1, borderLeft: `2px dashed ${s.color}`, opacity: 0.4 }} />
                </Box>

                {/* 답변 카드 */}
                <Box style={{
                  flex: 1, margin: '12px 0 12px 12px',
                  background: '#ffffff', border: '1px solid #d4d4d8',
                  borderRadius: '14px', overflow: 'hidden',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  <Box style={{
                    background: s.color, padding: '8px 16px',
                  }}>
                    <Text fw={800} style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#ffffff' }}>
                      {s.label}
                    </Text>
                  </Box>
                  <Box style={{ padding: 'clamp(14px, 3vw, 20px)' }}>
                    <Text style={{
                      fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#52525b',
                      lineHeight: 1.5, marginBottom: '12px',
                    }}>
                      {s.answer}
                    </Text>
                    <Box style={{ height: '1px', background: '#e4e4e7', marginBottom: '12px' }} />
                    <Text fw={600} style={{
                      color: '#71717a', fontSize: '11px', letterSpacing: '0.04em',
                      marginBottom: '8px', textTransform: 'uppercase',
                    }}>
                      포함 솔루션
                    </Text>
                    <Stack gap={6}>
                      {s.includes.map((item, j) => (
                        <Group key={j} gap={8} wrap="nowrap">
                          <Check size={14} color={s.color} strokeWidth={3} style={{ flexShrink: 0 }} />
                          <Text style={{ color: '#3f3f46', fontSize: 'clamp(16px, 3.5vw, 18px)', lineHeight: 1.3 }}>{item}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Box>

              {/* NO 화살표 (마지막 스테이지 제외) */}
              {i < stages.length - 1 && (
                <Box style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  marginLeft: 'clamp(28px, 4vw, 40px)',
                  height: '36px',
                }}>
                  <Box style={{ width: 0, flex: 1, borderLeft: '2px dashed #a1a1aa' }} />
                  <Box style={{
                    background: '#f4f4f5', borderRadius: '12px',
                    padding: '3px 12px', flexShrink: 0,
                  }}>
                    <Text style={{ ...mono, fontSize: '11px', fontWeight: 700, color: '#71717a' }}>NO ↓</Text>
                  </Box>
                  <Box style={{ width: 0, flex: 1, borderLeft: '2px dashed #a1a1aa' }} />
                </Box>
              )}
            </motion.div>
          ))}
        </Stack>

        {/* Convergence CTA */}
        <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3, ease }}>
          <Stack align="center" gap={16} mt={56}>
            <Text ta="center" style={{
              fontSize: 'clamp(22px, 5vw, 32px)', fontWeight: 800,
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
  return (
    <Box component="section" style={{ background: '#fafafa', padding: 'clamp(60px, 10vw, 120px) 0', position: 'relative' }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56}>
            <Badge size="lg" variant="light" color="cyan" radius="xl" style={{ padding: '8px 18px', fontSize: '14px' }}>
              가격 비교
            </Badge>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 6vw, 48px)', fontWeight: 800,
              color: '#18181b', letterSpacing: '-0.03em',
            }}>
              왜 이 가격인가요?
            </Title>
          </Stack>
        </motion.div>

        {/* Comparison — 세로 스택 */}
        <Stack gap={16} style={{ maxWidth: '480px', margin: '0 auto 56px' }}>
          {/* 일반 유료 강의 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
          >
            <Paper radius="lg" style={{
              background: '#ffffff', border: '1px solid #d4d4d8',
              padding: 'clamp(20px, 4vw, 32px)',
            }}>
              <Group mb={20} gap={10}>
                <Box style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <X size={16} color="#ef4444" />
                </Box>
                <Text fw={700} style={{ fontSize: 'clamp(16px, 3vw, 18px)', color: '#52525b' }}>일반 유료 강의</Text>
              </Group>
              <Stack gap={12}>
                {[
                  '가격 99~160만원',
                  '강의만 제공 (실행은 알아서)',
                  '기간 제한 (100일, 기수제)',
                  '대본은 직접 써야 함',
                  'AI 도구 없음',
                ].map((t, i) => (
                  <Group key={i} gap={8} wrap="nowrap">
                    <X size={14} color="#a1a1aa" style={{ flexShrink: 0 }} />
                    <Text style={{ color: '#52525b', fontSize: 'clamp(15px, 3vw, 16px)', lineHeight: 1.4 }}>{t}</Text>
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
          >
            <Paper radius="lg" style={{
              background: '#ffffff', border: '2px solid #8b5cf6',
              position: 'relative', padding: 'clamp(20px, 4vw, 32px)',
              boxShadow: '0 4px 24px rgba(139,92,246,0.1), 0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <Badge color="violet" size="sm" style={{
                position: 'absolute', top: -10, right: 20,
                boxShadow: '0 2px 8px rgba(139,92,246,0.25)',
              }}>
                추천
              </Badge>
              <Group mb={20} gap={10}>
                <Box style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={16} color="#22c55e" />
                </Box>
                <Text fw={700} style={{ fontSize: 'clamp(18px, 4vw, 20px)', color: '#18181b' }}>올인원 패스</Text>
              </Group>
              <Stack gap={12}>
                {[
                  '가격 50만원 (60% 저렴)',
                  '강의 + AI로 바로 실행',
                  '강의 4개월 수강',
                  'AI가 3분 만에 대본 작성',
                  'AI 스크립트 도구 6개월',
                ].map((t, i) => (
                  <Group key={i} gap={8} wrap="nowrap">
                    <Check size={14} color="#22c55e" style={{ flexShrink: 0 }} />
                    <Text fw={500} style={{ color: '#18181b', fontSize: 'clamp(15px, 3vw, 16px)', lineHeight: 1.4 }}>{t}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </motion.div>
        </Stack>

        {/* Value breakdown — receipt */}
        <motion.div {...fadeUp}>
          <Paper radius="lg" style={{
            background: '#ffffff', border: '1px solid #d4d4d8',
            maxWidth: '480px', margin: '0 auto',
            padding: 'clamp(24px, 5vw, 36px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <Text fw={700} ta="center" style={{ fontSize: 'clamp(18px, 3vw, 20px)', color: '#18181b', marginBottom: '24px' }}>
              뭐가 들어있나요?
            </Text>
            <Stack gap={0}>
              {[
                { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
                { item: 'AI 스크립트 도구 6개월', value: '₩600,000' },
                { item: '채널 분석 피드백', value: '₩100,000' },
                { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
              ].map((row, i) => (
                <Group key={i} justify="space-between" wrap="nowrap" style={{
                  padding: '12px 0', borderBottom: i < 3 ? '1px solid #f4f4f5' : 'none',
                }}>
                  <Text style={{ color: '#3f3f46', fontSize: 'clamp(15px, 3vw, 16px)', lineHeight: 1.3 }}>{row.item}</Text>
                  <Text fw={600} style={{ color: '#52525b', fontSize: 'clamp(15px, 3vw, 16px)', ...mono, flexShrink: 0, marginLeft: '8px' }}>{row.value}</Text>
                </Group>
              ))}
            </Stack>
            <Divider my="xl" color="#d4d4d8" />
            <Stack align="center" gap={4}>
              <Text fw={600} style={{ color: '#71717a', fontSize: 'clamp(15px, 3vw, 16px)', textDecoration: 'line-through', ...mono }}>
                총 ₩1,390,000
              </Text>
              <Group gap={12} align="center">
                <Text fw={900} style={{ fontSize: 'clamp(28px, 5vw, 32px)', color: '#18181b', ...mono }}>₩500,000</Text>
                <Badge color="red" size="md" style={{ fontSize: '13px' }}>64%</Badge>
              </Group>
            </Stack>
          </Paper>
        </motion.div>

        {/* Employee comparison */}
        <motion.div {...fadeUp}>
          <Paper radius="lg" style={{
            background: '#ffffff', border: '1px solid #d4d4d8',
            textAlign: 'center', maxWidth: '480px', margin: '40px auto 0',
            padding: 'clamp(24px, 5vw, 36px)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <Text fw={600} style={{ fontSize: 'clamp(15px, 3vw, 17px)', color: '#52525b', marginBottom: '24px' }}>
              이렇게 생각해보세요
            </Text>
            <Group justify="center" gap={24} wrap="wrap">
              <Stack gap={4} align="center">
                <Text style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#71717a' }}>스크립트 작가 1명</Text>
                <Text fw={800} style={{ fontSize: 'clamp(22px, 4vw, 28px)', color: '#18181b', ...mono }}>월 200만원</Text>
              </Stack>
              <Text style={{ fontSize: 'clamp(20px, 3vw, 24px)', color: '#a1a1aa', fontWeight: 300 }}>vs</Text>
              <Stack gap={4} align="center">
                <Text style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#71717a' }}>AI 스크립트 6개월</Text>
                <Text fw={800} style={{ fontSize: 'clamp(22px, 4vw, 28px)', color: '#8b5cf6', ...mono }}>50만원</Text>
              </Stack>
            </Group>
            <Text mt={20} style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#52525b' }}>
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
            color: '#18181b', fontSize: 'clamp(28px, 6vw, 44px)',
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
            control: { color: '#18181b', fontWeight: 600, fontSize: '17px', padding: '18px 20px' },
            panel: { color: '#52525b', fontSize: '16px', lineHeight: 1.7, padding: '0 20px 18px' },
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
              color: '#18181b', fontSize: 'clamp(28px, 6vw, 46px)',
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
              <Text size="sm" style={{ color: '#71717a', fontSize: '15px' }}>
                30크레딧 무료 · 7일 환불 보장
              </Text>
              <Text size="sm" style={{ color: '#71717a', fontSize: '15px' }}>
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
