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
import { motion, AnimatePresence } from 'framer-motion';
import { MONTHLY_SUBSCRIPTION_PREVIEW, TOSSPAY_PLAN_CONFIG } from '@/lib/plans/config';

/* ─── Design tokens ─── */
const ease = [0.25, 0.1, 0.25, 1] as const;
const primaryProgram = TOSSPAY_PLAN_CONFIG.allinone;
const monthlySubscription = MONTHLY_SUBSCRIPTION_PREVIEW;

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
   PricingBar — 비용 구조 비교 바
   ═══════════════════════════════════════════════════════════════ */
function PricingBar({ name, price, nameColor, priceColor, barWidth, mobileBarWidth, segments, isMobile }: {
  name: string; price: string; nameColor: string; priceColor: string;
  barWidth: string; mobileBarWidth?: string; isMobile: boolean;
  segments: { label: string; sublabel?: string; flex: number; bg: string; color: string; bold?: boolean }[];
}) {
  const w = isMobile ? (mobileBarWidth || '100%') : barWidth;
  return (
    <Box style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 8 : 24, marginBottom: 20, flexDirection: isMobile ? 'column' : 'row' }}>
      <Box style={{ width: isMobile ? '100%' : 160, flexShrink: 0, textAlign: isMobile ? 'left' : 'right', display: 'flex', alignItems: 'baseline', gap: 8, flexDirection: isMobile ? 'row' : 'column' }}>
        <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: 800, letterSpacing: '-0.3px', color: nameColor }}>{name}</Text>
        <Text style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, letterSpacing: '-0.5px', color: priceColor }}>{price}</Text>
      </Box>
      <Box style={{ flex: 1, width: '100%' }}>
        <Box style={{ display: 'flex', height: isMobile ? 44 : 52, borderRadius: 8, overflow: 'hidden', width: w }}>
          {segments.map((seg, i) => (
            <Box key={i} style={{
              flex: seg.flex, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? (seg.bold ? 10 : 9) : (seg.bold ? 12 : 11),
              fontWeight: seg.bold ? 800 : 700,
              padding: '0 4px', whiteSpace: 'nowrap', lineHeight: 1.2,
              borderRight: i < segments.length - 1 ? '1px solid rgba(0,0,0,0.2)' : 'none',
              background: seg.bg, color: seg.color, letterSpacing: '-0.3px',
            }}>
              {seg.label}
              {seg.sublabel && <span style={{ fontSize: isMobile ? 7 : 9, fontWeight: 600, opacity: 0.7, marginTop: 1 }}>{seg.sublabel}</span>}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
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
              AI 스크립트 도구 + 월간 트렌드 채널 데이터 + VOD 강의 40강 + 전자책 + 노션 템플릿
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

            {/* 가격 */}
            <Stack align="center" gap={4} style={{ marginBottom: 'clamp(16px, 3vw, 24px)' }}>
              <Group gap={8} align="baseline">
                <Text style={{
                  fontSize: 'clamp(14px, 3vw, 16px)', color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'line-through',
                }}>
                  ₩{primaryProgram.listAmount.toLocaleString()}
                </Text>
                <Text style={{
                  fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 900, color: '#ffffff',
                }}>
                  ₩{primaryProgram.amount.toLocaleString()}
                </Text>
                <Text style={{
                  fontSize: 'clamp(14px, 3vw, 16px)', fontWeight: 800, color: '#f87171',
                }}>
                  {Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100)}%
                </Text>
              </Group>
              <Text style={{
                fontSize: 'clamp(13px, 3vw, 15px)', color: 'rgba(255,255,255,0.5)',
              }}>
                12개월 할부 시 월 {Math.ceil(primaryProgram.amount / 12).toLocaleString()}원
              </Text>
            </Stack>

            {/* CTA 버튼 */}
            <Button
              id="hero-cta"
              component={Link} href="/checkout/allinone" size="xl" radius="xl"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: '#ffffff', color: '#18181b',
                fontSize: 'clamp(15px, 2.5vw, 17px)', fontWeight: 700,
                padding: '16px 40px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(255,255,255,0.15)',
              }}
            >
              올인원 패스 신청하기
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

            {/* HTML 라벨들 — 원 노드 바로 옆 배치 */}
            {[
              { label: '뭘 올리지 고민', top: '10%', left: '50%', transform: 'translateX(-50%)', fail: false },
              { label: '몇 시간 투자', top: '33%', right: '4%', transform: 'none', fail: false },
              { label: '떨리는 업로드', bottom: '14%', right: '12%', transform: 'none', fail: false },
              { label: '조회수 47회', bottom: '14%', left: '12%', transform: 'none', fail: true },
              { label: '다시 처음부터', top: '33%', left: '4%', transform: 'none', fail: true },
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

          {/* 질문 — 갇혀 계신가요? */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4, ease }}
            style={{ marginTop: 'clamp(40px, 8vw, 64px)', textAlign: 'center' }}
          >
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(32px, 9vw, 56px)',
              fontWeight: 900, color: '#18181b',
              lineHeight: 1.2, letterSpacing: '-0.03em',
            }}>
              혹시 지금도
              <br />
              이 무한 루프 속에
              <br />
              갇혀 계신가요?
            </Title>
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
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const pains = [
    {
      num: '01', title: '혼자 영상 만들어봤는데',
      desc: '6시간 넘게 매달려서 올렸더니', metric: '조회수 100회 미만',
      accent: '#ef4444', bg: '#fef2f2', border: '#fecaca',
    },
    {
      num: '02', title: '강의 들어봤는데',
      desc: '강의비만 수백만원, 알맹이는 없고', metric: '조회수 100회 미만',
      accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a',
    },
    {
      num: '03', title: 'AI가 다 해준다길래',
      desc: 'AI가 뽑아준 대로 그대로 올렸는데 결국', metric: '조회수는 100~1,000회',
      accent: '#52525b', bg: '#f4f4f5', border: '#d4d4d8',
    },
  ];

  return (
    <>
    <Box component="section" style={{ background: '#ffffff', padding: 'clamp(72px, 12vw, 140px) 0' }}>
      <Container size="lg">
        {/* 제목 — 먼 길을 돌아가는 중 */}
        <motion.div {...fadeUp}>
          <Title order={2} ta="center" style={{
            fontSize: 'clamp(28px, 7.5vw, 44px)', fontWeight: 900,
            color: '#18181b', letterSpacing: '-0.02em', lineHeight: 1.3,
            marginBottom: 'clamp(36px, 7vw, 64px)',
          }}>
            이 3가지 중 하나라도 해당된다면,
            <br />
            여러분은 지금{' '}
            <span style={{
              color: '#ef4444', textDecoration: 'underline',
              textDecorationColor: 'rgba(239,68,68,0.25)',
              textUnderlineOffset: '6px', textDecorationThickness: '3px',
            }}>
              먼 길을 돌아가는 중
            </span>
            입니다
          </Title>
        </motion.div>

        {/* Pain 카드 */}
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
                <Box style={{
                  flexShrink: 0, width: 'clamp(48px, 8vw, 64px)', height: 'clamp(48px, 8vw, 64px)',
                  borderRadius: '50%', background: p.accent,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{
                    fontSize: 'clamp(18px, 3vw, 24px)',
                    fontWeight: 900, color: '#ffffff',
                  }}>
                    {p.num}
                  </Text>
                </Box>
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
                    fontSize: 'clamp(20px, 4.5vw, 26px)', color: p.accent,
                  }}>
                    {p.metric}
                  </Text>
                </Box>
              </Box>
            </motion.div>
          ))}
        </Stack>
      </Container>
    </Box>

    {/* Todd Brown 위로 + 브릿지 — 보라 틴트 */}
    <Box style={{
      background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.03) 40%, #faf5ff 70%)',
      padding: 'clamp(80px, 15vw, 160px) 0',
      position: 'relative',
    }}>
      <Container size="lg">
        {/* Stage 1: 인정 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease }}
          style={{ textAlign: 'center' }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(15px, 3.5vw, 19px)',
            fontWeight: 400, color: '#a1a1aa',
            letterSpacing: '0.08em',
            marginBottom: 'clamp(48px, 10vw, 80px)',
          }}>
            맞습니다. 쉽지 않습니다.
          </Text>
        </motion.div>

        {/* Stage 2: 위로 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          style={{ textAlign: 'center' }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(20px, 5.5vw, 30px)',
            fontWeight: 500, color: '#52525b',
            lineHeight: 1.6,
            marginBottom: 'clamp(56px, 12vw, 96px)',
          }}>
            하지만 포기하지 않으면,
            <br />성과와 실력은 <span style={{ color: '#18181b', fontWeight: 800 }}>분명</span> 따라옵니다.
          </Text>
        </motion.div>

        {/* Stage 3: 때림 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.4, ease }}
          style={{ textAlign: 'center' }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(32px, 9vw, 56px)',
            fontWeight: 900, color: '#18181b',
            lineHeight: 1.2, letterSpacing: '-0.03em',
            marginBottom: 'clamp(64px, 14vw, 112px)',
          }}>
            다만 그 <span style={{
              color: '#ef4444',
              textDecoration: 'underline',
              textDecorationColor: 'rgba(239,68,68,0.3)',
              textUnderlineOffset: '6px',
              textDecorationThickness: '3px',
            }}>&lsquo;천천히&rsquo;</span>가
            <br />1년이 될 수도, 4년이 될 수도 있습니다.
          </Text>
        </motion.div>

        {/* Stage 4: 최단거리 훅 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6, ease }}
          style={{ textAlign: 'center' }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(24px, 6.5vw, 38px)',
            fontWeight: 700, color: '#8b5cf6',
            lineHeight: 1.35,
            textShadow: '0 0 60px rgba(139,92,246,0.2)',
          }}>
            <span style={{ fontWeight: 900 }}>쇼츠 수익화의 최단거리</span>를
            <br /><span style={{ opacity: 0.7 }}>모른다면요.</span>
          </Text>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            marginTop: 'clamp(72px, 15vw, 120px)',
          }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(26px, 7vw, 38px)',
            fontWeight: 800, color: '#8b5cf6',
            lineHeight: 1.4,
          }}>
            어떻게 알았냐고요?
          </Text>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ marginTop: '16px' }}
          >
            <ChevronDown size={28} color="#8b5cf6" />
          </motion.div>
        </motion.div>
      </Container>
    </Box>

    {/* 파운더 스토리 — 실패 증거 */}
    <Box style={{
      background: 'linear-gradient(180deg, #f9fafb 0%, #f3f4f6 100%)',
      padding: 'clamp(48px, 8vw, 80px) 0',
      borderTop: '1px solid #e5e7eb',
    }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease }}
          style={{ textAlign: 'center' }}
        >
          <Text ta="center" style={{
            fontSize: 'clamp(30px, 8vw, 48px)',
            fontWeight: 900, color: '#18181b',
            lineHeight: 1.25, letterSpacing: '-0.02em',
          }}>
            저도 돌아가봤으니까요
          </Text>

          <Text ta="center" style={{
            fontSize: 'clamp(18px, 4.5vw, 22px)',
            fontWeight: 500, color: '#71717a', lineHeight: 1.6,
            marginTop: 'clamp(16px, 4vw, 28px)',
          }}>
            4년간 채널 운영하며 겪은 실패의 기록입니다
          </Text>

          <Stack gap={16} style={{ maxWidth: '520px', margin: 'clamp(32px, 6vw, 48px) auto 0' }}>
            {[
              { src: '/images/fail-stats-1.png', caption: '첫 번째 채널 — 조회수 524, 구독자 +11' },
              { src: '/images/fail-stats-2.png', caption: '두 번째 채널 — 26.6만 조회 후 급락' },
            ].map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15, ease }}
              >
                <Box style={{
                  borderRadius: '12px', overflow: 'hidden',
                  border: '2px solid #fecaca',
                  boxShadow: '0 4px 20px rgba(239,68,68,0.1), 0 2px 8px rgba(0,0,0,0.06)',
                  position: 'relative',
                }}>
                  <img
                    src={img.src}
                    alt={img.caption}
                    style={{ width: '100%', display: 'block' }}
                  />
                  {/* 실패 오버레이 그래디언트 */}
                  <Box style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: '40%',
                    background: 'linear-gradient(transparent, rgba(239,68,68,0.06))',
                    pointerEvents: 'none',
                  }} />
                </Box>
                <Text ta="center" style={{
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  color: '#a1a1aa', marginTop: '8px',
                }}>
                  {img.caption}
                </Text>
              </motion.div>
            ))}
          </Stack>
        </motion.div>
      </Container>
    </Box>

    {/* 성과 증거 — 전환점 + 스크린샷 */}
    <Box style={{
      background: '#18181b',
      padding: 'clamp(72px, 12vw, 140px) 0',
    }}>
      <Container size="lg">
        {/* 전환 멘트 */}
        <motion.div {...fadeUp} style={{ textAlign: 'center' }}>
          {/* 하.지.만 극적 전환 */}
          <Text ta="center" style={{
            fontSize: 'clamp(36px, 9vw, 56px)',
            fontWeight: 900, color: '#a78bfa',
            lineHeight: 1.2, letterSpacing: '0.15em',
          }}>
            하 . 지 . 만
          </Text>

          {/* 세로선 */}
          <Box style={{
            width: '1px', height: 'clamp(40px, 8vw, 64px)',
            background: 'linear-gradient(180deg, #a78bfa 0%, rgba(167,139,250,0.2) 100%)',
            margin: 'clamp(20px, 4vw, 32px) auto',
          }} />

          <Text ta="center" style={{
            fontSize: 'clamp(24px, 6.5vw, 34px)',
            fontWeight: 600, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5,
          }}>
            가설을 세우고 끊임없이
            <br />테스트한 결과,
          </Text>
        </motion.div>

        {/* 성과 카드들 — 체크 + 수익 + 풀 스크린샷 */}
        <Stack gap={48} style={{ maxWidth: '560px', margin: 'clamp(56px, 10vw, 80px) auto 0' }}>
          {[
            { label: '채널A 게임', amount: '1,567만원', views: '5,937만회', src: '/images/success-ch-b.png' },
            { label: '채널B 해외반응', amount: '923만원', views: '2,375만회', src: '/images/success-ch-c.png' },
            { label: '채널C 해외반응', amount: '488만원', views: '3,005만회', src: '/images/success-ch-d.png' },
            { label: '채널D 지식/정보', amount: '159만원', views: '46만회', src: '/images/success-ch-a.png' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease }}
            >
              <Group gap={10} align="center" mb={14} wrap="nowrap">
                <Box style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={16} color="#ffffff" strokeWidth={3} />
                </Box>
                <Text style={{
                  fontSize: 'clamp(15px, 3.8vw, 18px)',
                  fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
                }}>
                  {item.label}
                </Text>
                <Text style={{
                  fontSize: 'clamp(20px, 5.5vw, 26px)',
                  fontWeight: 900, color: '#ffffff', lineHeight: 1.2,
                }}>
                  {item.amount}
                </Text>
                <Text style={{
                  fontSize: 'clamp(20px, 5.5vw, 26px)',
                  fontWeight: 900, color: '#ffffff', lineHeight: 1.2,
                }}>
                  <span style={{ fontSize: 'clamp(12px, 3vw, 14px)', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginRight: '4px' }}>조회수</span>{item.views}
                </Text>
              </Group>
              <Box style={{
                borderRadius: '12px', overflow: 'hidden',
                border: i === 0
                  ? '1.5px solid rgba(34,197,94,0.4)'
                  : '1px solid rgba(34,197,94,0.2)',
                boxShadow: i === 0
                  ? '0 4px 20px rgba(0,0,0,0.3), 0 0 24px rgba(34,197,94,0.12)'
                  : '0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(34,197,94,0.06)',
              }}>
                <img src={item.src} alt={`${item.label} 수익 ${item.amount}`} style={{ width: '100%', display: 'block' }} />
              </Box>
            </motion.div>
          ))}
        </Stack>

        {/* 전환: 유튜브 성과 */}
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginTop: 'clamp(64px, 12vw, 96px)' }}>
          <Text style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: 700, color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#FF4444', fontWeight: 800 }}>유튜브</span>에서 <span style={{ color: '#a78bfa', fontWeight: 800 }}>성과</span>가 나오기 시작했고
          </Text>
        </motion.div>

        {/* 네이버 클립 — 2개 합산 1,945만원 */}
        <Box style={{ maxWidth: '560px', margin: 'clamp(48px, 8vw, 64px) auto 0' }}>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
          >
            <Group gap={10} align="center" mb={14} wrap="nowrap">
              <Box style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                background: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={16} color="#ffffff" strokeWidth={3} />
              </Box>
              <Text style={{
                fontSize: 'clamp(15px, 3.8vw, 18px)',
                fontWeight: 600, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4,
              }}>
                네이버 클립
              </Text>
              <Text style={{
                fontSize: 'clamp(20px, 5.5vw, 26px)',
                fontWeight: 900, color: '#ffffff', lineHeight: 1.2,
              }}>
                1,945만원
              </Text>
            </Group>
            <Stack gap={16}>
              <Box style={{
                borderRadius: '12px', overflow: 'hidden',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(34,197,94,0.06)',
                background: '#ffffff',
              }}>
                <img src="/images/success-naver-clip.png" alt="네이버 클립 수익" style={{ width: '100%', display: 'block' }} />
              </Box>
              <Box style={{
                borderRadius: '12px', overflow: 'hidden',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(34,197,94,0.06)',
                background: '#ffffff',
              }}>
                <img src="/images/success-naver-revenue.jpg" alt="네이버 클립 월별 수익" style={{ width: '100%', display: 'block' }} />
              </Box>
            </Stack>
          </motion.div>
        </Box>

        {/* 전환: 네이버뿐만 아니라 */}
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginTop: 'clamp(64px, 12vw, 96px)' }}>
          <Text style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: 700, color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#03C75A', fontWeight: 800 }}>네이버</span>뿐만 아니라
          </Text>
        </motion.div>

        {/* ── 인스타 릴스 성과 ── */}
        <motion.div {...fadeUp} style={{
          marginTop: 'clamp(48px, 8vw, 64px)',
        }}>
          <Box style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            overflow: 'hidden',
            maxWidth: '560px',
            margin: '0 auto',
          }}>
            <Group gap="sm" p="md" pb={0}>
              <Box style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="none" stroke="white" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="5" fill="none" stroke="white" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
                </svg>
              </Box>
              <Text style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', fontWeight: 700, color: '#ffffff' }}>
                인스타 릴스
              </Text>
              <Text style={{ fontSize: 'clamp(13px, 3.2vw, 15px)', fontWeight: 600, color: '#a78bfa' }}>
                월 800만 조회
              </Text>
            </Group>
            <Box style={{ padding: '12px 16px 16px' }}>
              <img
                src="/images/success-instagram-monthly.jpg"
                alt="인스타 릴스 월 800만 조회"
                style={{ width: '100%', display: 'block', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}
              />
            </Box>
          </Box>
        </motion.div>

        {/* 전환: 인스타 성과 확인 */}
        <motion.div {...fadeUp} style={{ textAlign: 'center', marginTop: 'clamp(64px, 12vw, 96px)' }}>
          <Text style={{
            fontSize: 'clamp(22px, 5.5vw, 28px)',
            fontWeight: 700, color: 'rgba(255,255,255,0.88)',
            lineHeight: 1.5,
          }}>
            <span style={{ color: '#E4405F', fontWeight: 800 }}>인스타</span>에서까지 유의미한 <span style={{ color: '#a78bfa', fontWeight: 800 }}>성과</span>가<br />나오기 시작했습니다.
          </Text>
        </motion.div>

        {/* ── 플랫폼 아이콘 + 메시지 ── */}
        <motion.div {...fadeUp} style={{
          textAlign: 'center',
          marginTop: 'clamp(80px, 14vw, 120px)',
        }}>
          <Group justify="center" gap="clamp(16px, 4vw, 32px)">
            {/* YouTube */}
            <Box style={{ textAlign: 'center' }}>
              <Box style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#FF0000">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </Box>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>유튜브</Text>
            </Box>
            {/* 네이버 */}
            <Box style={{ textAlign: 'center' }}>
              <Box style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#03C75A">
                  <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727z"/>
                </svg>
              </Box>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>네이버</Text>
            </Box>
            {/* 인스타 */}
            <Box style={{ textAlign: 'center' }}>
              <Box style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#E4405F">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </Box>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>인스타</Text>
            </Box>
            {/* 다음 */}
            <Box style={{ textAlign: 'center' }}>
              <Box style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
              }}>
                <Text style={{ fontSize: '16px', fontWeight: 900, color: '#FF6600' }}>D</Text>
              </Box>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>다음</Text>
            </Box>
            {/* 틱톡 */}
            <Box style={{ textAlign: 'center' }}>
              <Box style={{
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 6px',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13.4a8.16 8.16 0 005.58 2.17V12.1a4.83 4.83 0 01-3.77-1.84V6.69h3.77z"/>
                </svg>
              </Box>
              <Text style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>틱톡</Text>
            </Box>
          </Group>

          <Text ta="center" style={{
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            fontWeight: 800, color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
            marginTop: 'clamp(24px, 5vw, 40px)',
          }}>
            유튜브든, 인스타든, 네이버든.
            <br /><span style={{ color: '#a78bfa', fontWeight: 900 }}>터지는 구조는 같습니다.</span>
          </Text>
        </motion.div>

        {/* 총 합산 */}
        <motion.div {...fadeUp} style={{
          textAlign: 'center',
          marginTop: 'clamp(80px, 14vw, 120px)',
        }}>
          <Text style={{
            fontSize: 'clamp(15px, 3.8vw, 17px)',
            fontWeight: 600, color: 'rgba(255,255,255,0.4)',
          }}>
            5개 채널 총 성과
          </Text>
          <Group justify="center" gap="clamp(24px, 6vw, 48px)" mt={6}>
            <Box style={{ textAlign: 'center' }}>
              <Text style={{
                fontSize: 'clamp(32px, 9vw, 48px)',
                fontWeight: 900, color: '#ffffff',
                lineHeight: 1.2,
              }}>
                5,082만원
              </Text>
              <Text style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                marginTop: '4px',
              }}>
                수익
              </Text>
            </Box>
            <Box style={{
              width: '1px', height: 'clamp(36px, 8vw, 52px)',
              background: 'rgba(255,255,255,0.12)',
            }} />
            <Box style={{ textAlign: 'center' }}>
              <Text style={{
                fontSize: 'clamp(32px, 9vw, 48px)',
                fontWeight: 900, color: '#ffffff',
                lineHeight: 1.2,
              }}>
                1.1억회
              </Text>
              <Text style={{
                fontSize: 'clamp(12px, 3vw, 14px)',
                fontWeight: 600, color: 'rgba(255,255,255,0.35)',
                marginTop: '4px',
              }}>
                조회수
              </Text>
            </Box>
          </Group>
          <Text style={{
            fontSize: 'clamp(11px, 2.8vw, 13px)',
            fontWeight: 500, color: 'rgba(255,255,255,0.25)',
            marginTop: '12px',
          }}>
            (판매된 채널의 성과는 포함하지 않았습니다)
          </Text>
        </motion.div>

        {/* ── 반론 제기 + 수강생 후기 ── */}
        <motion.div {...fadeUp} style={{
          textAlign: 'center',
          marginTop: 'clamp(80px, 14vw, 140px)',
        }}>
          <Text style={{
            fontSize: 'clamp(28px, 7.5vw, 44px)',
            fontWeight: 900, color: '#ffffff',
            lineHeight: 1.3,
          }}>
            제가 유튜브 천재라서
            <br />가능했을까요?
          </Text>

          <Box style={{
            width: '1px', height: 'clamp(32px, 6vw, 48px)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%)',
            margin: 'clamp(16px, 3vw, 24px) auto',
          }} />

          <Text style={{
            fontSize: 'clamp(24px, 6.5vw, 36px)',
            fontWeight: 900, color: '#a78bfa',
            lineHeight: 1.3,
          }}>
            아닙니다.
          </Text>

          <Text ta="center" style={{
            fontSize: 'clamp(17px, 4.3vw, 22px)',
            fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.7, marginTop: 'clamp(12px, 3vw, 20px)',
            maxWidth: '360px', marginLeft: 'auto', marginRight: 'auto',
          }}>
            수백 시간 돌아가며 벽에 부딪혀봤기에
            <br />최단거리를 뚫어낼 수 있었던 겁니다.
          </Text>

          <Text ta="center" style={{
            fontSize: 'clamp(18px, 4.5vw, 24px)',
            fontWeight: 700, color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.5, marginTop: 'clamp(32px, 6vw, 48px)',
          }}>
            그리고 그 최단거리를 그대로 전달했습니다.
          </Text>

          <Text ta="center" style={{
            fontSize: 'clamp(17px, 4.3vw, 22px)',
            fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            lineHeight: 1.5, marginTop: 'clamp(16px, 3vw, 24px)',
          }}>
            먼저 실행한 수강생들의 결과입니다.
          </Text>
        </motion.div>

        {/* 수강생 후기 — 성과 인증 */}
        <Stack gap={40} style={{ maxWidth: '400px', margin: 'clamp(48px, 8vw, 72px) auto 0' }}>
          {[
            { src: '/images/reviews/review_1_revenue.png', caption: '월 1,356만 수익', sub: '조회수 7,613만회', alt: '수강생 성과 — 월 1356만 수익' },
            { src: '/images/reviews/review_3_kakao.png', caption: '월 700만 수익', alt: '수강생 성과 — 월 700만 수익' },
            { src: '/images/reviews/review_7_kakao.png', caption: '구독자 1,000명 돌파', alt: '수강생 성과 — 구독자 1000 달성' },
            { src: '/images/reviews/review_6_youtube.png', caption: '조회수 폭발', alt: '수강생 성과 — 조회수 폭발' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
            >
              <Group gap={10} align="center" mb={12} justify="center" wrap="nowrap">
                <Box style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                  background: '#22c55e',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Check size={15} color="#ffffff" strokeWidth={3} />
                </Box>
                <Box>
                  <Text style={{
                    fontSize: 'clamp(20px, 5.5vw, 28px)',
                    fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                  }}>
                    {item.caption}
                  </Text>
                  {item.sub && (
                    <Text style={{
                      fontSize: 'clamp(13px, 3.2vw, 15px)',
                      fontWeight: 600, color: 'rgba(255,255,255,0.4)',
                      marginTop: '2px',
                    }}>
                      {item.sub}
                    </Text>
                  )}
                </Box>
              </Group>
              <Box
                onClick={() => setLightboxSrc(item.src)}
                style={{
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  cursor: 'zoom-in',
                  position: 'relative',
                }}
              >
                <img src={item.src} alt={item.alt} style={{ width: '100%', display: 'block' }} />
                {i === 0 && (
                  <Text style={{
                    position: 'absolute', bottom: '10px', right: '12px',
                    fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(0,0,0,0.5)', borderRadius: '4px',
                    padding: '3px 8px',
                  }}>
                    탭하여 확대
                  </Text>
                )}
              </Box>
            </motion.div>
          ))}
        </Stack>

        {/* 수강생 후기 — 감성 후기 */}
        <Stack gap={40} style={{ maxWidth: '400px', margin: 'clamp(56px, 10vw, 80px) auto 0' }}>
          {[
            { src: '/images/reviews/comment_osy.png', caption: '300만원 유료강의보다 낫습니다', alt: '수강생 후기 — 유료강의급' },
            { src: '/images/reviews/review_4_kakao.png', caption: '귀인을 만난 기분입니다', alt: '수강생 후기 — 귀인' },
          ].map((item, i) => (
            <motion.div
              key={`voice-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.06, ease }}
            >
              <Text ta="center" style={{
                fontSize: 'clamp(20px, 5.5vw, 28px)',
                fontWeight: 700, color: 'rgba(167,139,250,0.85)',
                marginBottom: '12px',
                lineHeight: 1.4,
              }}>
                &ldquo;{item.caption}&rdquo;
              </Text>
              <Box
                onClick={() => setLightboxSrc(item.src)}
                style={{
                  borderRadius: '12px', overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                  border: '1px solid rgba(167,139,250,0.15)',
                  cursor: 'zoom-in',
                }}
              >
                <img src={item.src} alt={item.alt} style={{ width: '100%', display: 'block' }} />
              </Box>
            </motion.div>
          ))}
        </Stack>

      </Container>
    </Box>

    {/* ── 라이트박스 오버레이 ── */}
    <AnimatePresence>
      {lightboxSrc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => setLightboxSrc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
            cursor: 'zoom-out',
          }}
        >
          <motion.img
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            src={lightboxSrc}
            alt="후기 확대"
            style={{
              maxWidth: '100%', maxHeight: '85vh',
              borderRadius: '8px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 3: ProductReveal — 최단거리의 정체 (강의 + AI 소개)
   ═══════════════════════════════════════════════════════════════ */
function ProductRevealSection() {
  const items = [
    {
      tag: 'AI',
      num: '01',
      title: 'AI 스크립트 프로그램',
      timeSave: '월 30시간 절약',
      desc: '대본 1편에 1~2시간 → 3분이면 초안 완성.',

      features: ['FlowSpot', '4개월 이용권'],
      src: '/images/product-ai-script.gif',
      accent: '#8b5cf6',
      featured: true,
    },
    {
      tag: '데이터',
      num: '02',
      title: '월간 채널 추천 리스트',
      timeSave: '월 40시간 절약',
      desc: '숏폼은 트렌드를 빨리 캐치하는 자가 이깁니다. 잘하는 채널은 뭘 만드는지 직접 수집·정리해서 알려드립니다.',
      features: ['구독자 수', '평균 조회수', '중위값', '분류', '제작 형식'],
      src: '/images/product-channel-list.gif',
      accent: '#22c55e',
    },
    {
      tag: '전 과정',
      num: '03',
      title: 'VOD 강의 40강',
      timeSave: '시행착오 1~4년 → 40강',
      desc: '기획·제작·편집 노하우를 전부 담았습니다.',
      features: ['채널 설계', '소재 발굴', '스크립트 공식', '소스', '편집 마스터', '쇼핑 수익화'],
      src: '/images/product-vod.gif',
      accent: '#f59e0b',
    },
    {
      tag: '기본기',
      num: '04',
      title: '전자책',
      timeSave: '독학 수개월 → 133p 한 권',
      desc: '채널 기획부터 수익화까지, 기본기를 133p 한 권에 담았습니다.',
      features: ['채널 기획', '주제 선정', '후킹', '소스', '편집', '수익화'],
      src: '/images/product-ebook.gif',
      accent: '#8b5cf6',
    },
    {
      tag: '시스템',
      num: '05',
      title: '노션 운영 템플릿',
      timeSave: '월 10시간 절약',
      desc: '조회수 1억회 채널을 운영하는 시스템 그대로 드립니다.',
      features: ['개인 운영', '편집자 협업', '제작 프로세스', '업로드 일정'],
      src: '/images/product-notion.gif',
      accent: '#3b82f6',
    },
  ];

  return (
    <Box component="section" style={{
      background: '#faf5ff',
      padding: 'clamp(80px, 15vw, 160px) 0',
    }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Stack align="center" gap={12} mb={56}>
            <Text style={{
              fontSize: 'clamp(18px, 4.5vw, 22px)',
              fontWeight: 700, color: '#8b5cf6',
            }}>
              그래서 그 최단거리가 뭐냐고요?
            </Text>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 7.5vw, 40px)', fontWeight: 900,
              color: '#18181b', letterSpacing: '-0.03em', lineHeight: 1.3,
            }}>
              시간이 오래 걸리는 구간을
              <br />하나씩 줄여주는 원초적 인사이트만의 방법을 소개합니다.
            </Title>
          </Stack>
        </motion.div>

        <Stack gap={40} style={{ maxWidth: '480px', margin: '0 auto' }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease }}
            >
              <Box style={{
                background: item.featured ? '#18181b' : '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: item.featured
                  ? '0 8px 32px rgba(139,92,246,0.2), 0 2px 8px rgba(0,0,0,0.1)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
                border: item.featured ? '1.5px solid rgba(139,92,246,0.3)' : '1px solid rgba(0,0,0,0.06)',
              }}>
                {/* GIF 이미지 영역 */}
                <Box style={{
                  width: '100%',
                  borderBottom: item.featured ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(0,0,0,0.04)',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <img
                    src={item.src}
                    alt={item.title}
                    loading="lazy"
                    style={{ width: '100%', display: 'block' }}
                  />
                </Box>

                {/* 텍스트 영역 */}
                <Box style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
                  <Group gap={8} align="center" mb={6}>
                    <Badge size="sm" variant="light" radius="xl" style={{
                      background: item.featured ? 'rgba(139,92,246,0.15)' : `${item.accent}15`,
                      color: item.featured ? '#a78bfa' : item.accent,
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '11px',
                    }}>
                      {item.tag}
                    </Badge>
                  </Group>
                  <Text style={{
                    fontSize: 'clamp(20px, 5vw, 24px)',
                    fontWeight: 800, color: item.featured ? '#ffffff' : '#18181b',
                    lineHeight: 1.3, marginBottom: '8px',
                  }}>
                    {item.title}
                  </Text>
                  {/* 시간 절약 강조 */}
                  {item.timeSave && (
                    <Box style={{
                      display: 'inline-block',
                      background: item.featured ? 'rgba(139,92,246,0.25)' : '#f0fdf4',
                      border: item.featured ? '1px solid rgba(139,92,246,0.4)' : '1px solid #bbf7d0',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      marginBottom: '8px',
                    }}>
                      <Text style={{
                        fontSize: 'clamp(14px, 3.5vw, 16px)',
                        fontWeight: 800,
                        color: item.featured ? '#a78bfa' : '#16a34a',
                      }}>
                        {item.timeSave}
                      </Text>
                    </Box>
                  )}
                  <Text style={{
                    fontSize: 'clamp(15px, 3.8vw, 17px)',
                    fontWeight: 500,
                    color: item.featured ? 'rgba(255,255,255,0.75)' : '#52525b',
                    lineHeight: 1.6,
                  }}>
                    {item.desc}
                  </Text>
                  {item.features && (
                    <Group gap={6} mt={10} wrap="wrap">
                      {item.features.map((f: string, fi: number) => (
                        <Badge key={fi} size="xs" variant="light" radius="sm" style={{
                          background: item.featured ? 'rgba(255,255,255,0.12)' : '#f0f0f2',
                          color: item.featured ? 'rgba(255,255,255,0.7)' : '#52525b',
                          border: 'none',
                          fontWeight: 600,
                          fontSize: '12px',
                        }}>
                          {f}
                        </Badge>
                      ))}
                    </Group>
                  )}
                </Box>
              </Box>
            </motion.div>
          ))}
        </Stack>

        {/* 시간 절약 팩트 요약 — 2분할 */}
        <motion.div {...fadeUp}>
          <Box style={{
            maxWidth: '480px', margin: '0 auto',
            marginTop: 'clamp(48px, 10vw, 72px)',
            display: 'flex', gap: 'clamp(12px, 3vw, 16px)',
          }}>
            <Box style={{
              flex: 1, background: '#ffffff', borderRadius: '16px',
              border: '1px solid #e4e4e7', padding: 'clamp(20px, 4vw, 28px)',
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 600, color: '#71717a', marginBottom: '4px' }}>
                매달 절약
              </Text>
              <Text style={{ fontSize: 'clamp(36px, 9vw, 44px)', fontWeight: 900, color: '#8b5cf6', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                80<span style={{ fontSize: '0.5em', fontWeight: 700 }}>시간+</span>
              </Text>
            </Box>
            <Box style={{
              flex: 1, background: '#ffffff', borderRadius: '16px',
              border: '1px solid #e4e4e7', padding: 'clamp(20px, 4vw, 28px)',
              textAlign: 'center',
            }}>
              <Text style={{ fontSize: 'clamp(13px, 3vw, 15px)', fontWeight: 600, color: '#71717a', marginBottom: '4px' }}>
                독학하면 4년
              </Text>
              <Text style={{ fontSize: 'clamp(32px, 8vw, 40px)', fontWeight: 900, color: '#8b5cf6', lineHeight: 1.1 }}>
                2주면 끝
              </Text>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 3.5: WhySpecial — 이 코스가 특별한 이유 (비교 + 커리큘럼)
   ═══════════════════════════════════════════════════════════════ */
function WhySpecialSection() {
  const isMobile = useIsMobile();

  const curriculum = [
    {
      part: 'Part 1', title: '채널 기획',
      subtitle: '시작부터 수익 구조를 설계합니다',
      count: 4,
      vods: [
        '주제보다 먼저 정해야 할 한 가지',
        '양산형 vs 직접 촬영, 어떻게 만들 것인가?',
        '레드오션도 블루오션으로 바꾸는 채널 조합법',
        '내 취향은 빼고, 벤치마크 채널 찾는 법',
      ],
    },
    {
      part: 'Part 2', title: '영상 주제 선정 & 분석',
      subtitle: '뭘 만들지 고민하는 시간을 줄입니다',
      count: 6,
      vods: [
        '영상 주제 선정 기준 2가지',
        '남들은 모르는 떡상하는 주제 찾는 방법',
        '영상 주제 찾기 실전 예시 (쇼핑 채널)',
        '영상 주제 찾기 실전 예시 (잡학 지식 / 공부 입시 채널)',
        '영상 주제 찾기 실전 예시 (해외반응/덕질/취미 채널)',
        '주제 찾는 시간을 줄여주는 실전 툴 활용법',
      ],
    },
    {
      part: 'Part 3', title: '후킹 & 대본 작성',
      subtitle: '3초 안에 잡고, 끝까지 보게 만듭니다',
      count: 6,
      vods: [
        '초반 3초를 사로잡는 후킹의 6가지 조각',
        '후킹이 무너지는 4가지 패턴',
        '대본 작성시 지켜야할 필수 원칙',
        '영상을 끝까지 보게 만드는 본문 작성 4가지 공식',
        '터진 영상을 내 것으로 만드는 방법',
        '프로그램 사용법',
      ],
    },
    {
      part: 'Part 4', title: '영상 소스 & AI 비주얼',
      subtitle: '다른 사람들은 이렇게 화면을 채웁니다',
      count: 8,
      vods: [
        '빈 화면 채우기 전에 알아야 할 소스 배치 기준',
        '유튜브 쇼츠 소스 확보 전략 3가지',
        '공정 사용 소스를 찾는 4가지 방법',
        'AI로 일관성 있게 사진을 뽑는 비결',
        'AI 실전 : 한 장씩 뽑기',
        'AI 실전 : 9장 한 번에 뽑기',
        'AI로 멈춰 있는 사진 소스를 움직이는 영상 소스로 만드는 방법',
        'AI 실전 : 내가 원하는 영상 소스를 만드는 실전 워크 플로우',
      ],
    },
    {
      part: 'Part 5', title: '편집 실전',
      subtitle: '조회수를 만드는 편집 공식',
      count: 6,
      vods: [
        '영상 시청 지속 시간을 올려주는 편집 방법',
        '편집 시간을 반으로 줄이는 편집 워크 플로우',
        '실전 편집 A to Z : 잡학 지식형 (1)',
        '실전 편집 A to Z : 잡학 지식형 (2)',
        '실전 편집 A to Z : 커뮤니티형',
        '실전 편집 A to Z : 썰형',
      ],
    },
    {
      part: 'Part 6', title: '수익화',
      subtitle: '광고 수익 그 다음 단계',
      count: 3,
      vods: [
        '쇼츠로 돈 버는 3가지 방법',
        '쇼핑 채널 운영 방법 : 내 채널은 뭘 팔아야 할까?',
        '쇼핑 채널 운영 방법 : 쇼핑 태그를 넘어서 나만의 제품으로',
      ],
    },
    {
      part: 'Part 7', title: '자동화',
      subtitle: '부업에서 사업으로 확장합니다',
      count: 2,
      vods: [
        '남들보다 빠르게 수익화를 달성하는 방법',
        '부업을 넘어 사업으로',
      ],
    },
    {
      part: '부록', title: '활용 가이드',
      subtitle: '제공 툴 200% 활용법',
      count: 2,
      vods: [
        '편집자 협업 노션 템플릿 활용 방법',
        '이 달의 채널 추천 리스트 활용 방법',
      ],
    },
  ];

  return (
    <Box component="section" style={{
      background: '#ffffff',
      padding: 'clamp(56px, 10vw, 100px) 0',
      position: 'relative',
    }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        {/* 커리큘럼 헤딩 */}
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56}>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 7.5vw, 40px)', fontWeight: 700,
              color: '#18181b', letterSpacing: '-0.02em', lineHeight: 1.3,
            }}>
              강의는 이렇게 구성되어 있습니다
            </Title>
          </Stack>
        </motion.div>

        {/* 커리큘럼 리스트 */}
        <Stack gap={24} style={{ maxWidth: '540px', margin: '0 auto' }}>
          {curriculum.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease }}
            >
              <Box style={{
                background: '#ffffff', border: '1px solid #d4d4d8',
                borderRadius: '16px', padding: 'clamp(20px, 5vw, 28px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <Group gap={10} wrap="nowrap" justify="space-between" mb={12}>
                  <Group gap={10} wrap="nowrap">
                    <Text style={{
                      fontSize: '12px', fontWeight: 800,
                      color: '#8b5cf6', flexShrink: 0,
                    }}>
                      {c.part}
                    </Text>
                    <Text fw={700} style={{ fontSize: 'clamp(16px, 3.5vw, 18px)', color: '#18181b' }}>
                      {c.title}
                    </Text>
                  </Group>
                  <Badge size="sm" variant="light" color="gray" radius="xl">{c.count}강</Badge>
                </Group>
                <Text style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#52525b', marginBottom: '16px' }}>{c.subtitle}</Text>
                <Stack gap={8}>
                  {c.vods.map((vod, j) => (
                    <Group key={j} gap={8} wrap="nowrap" align="flex-start">
                      <Text style={{ fontSize: '13px', color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }}>
                        {String(j + 1).padStart(2, '0')}
                      </Text>
                      <Text style={{ fontSize: 'clamp(15px, 3.8vw, 16px)', color: '#27272a', lineHeight: 1.6 }}>{vod}</Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          ))}
        </Stack>

        {/* ═══ 비용 구조 비교 ═══ */}
        <motion.div {...fadeUp}>
          <Box style={{
            background: '#0a0a0a',
            borderRadius: '20px',
            padding: isMobile ? '48px 20px' : '72px 56px',
            marginTop: 'clamp(64px, 12vw, 100px)',
          }}>
            {/* 헤드라인 */}
            <Box style={{ textAlign: 'center', marginBottom: isMobile ? 48 : 64 }}>
              <Text style={{
                fontSize: 'clamp(28px, 7.5vw, 36px)', fontWeight: 900,
                color: '#fff', lineHeight: 1.4, letterSpacing: '-1.5px',
              }}>
                300만원 이상의 가치를{isMobile ? <br /> : ' '}
                <span style={{ color: '#8b5cf6' }}>합리적인 가격</span>에.
              </Text>
              <Text style={{
                marginTop: 40, fontSize: 'clamp(16px, 4vw, 22px)',
                color: '#aaa', lineHeight: 1.8, letterSpacing: '-0.5px',
              }}>
                수강료가 <strong style={{ color: '#fff', fontWeight: 700 }}>어디에 쓰이는지</strong>를 보셔야 합니다.<br />
                플랫폼 수수료와 광고비는, <strong style={{ color: '#fff', fontWeight: 700 }}>수강생에게 돌아오지 않기 때문</strong>입니다.
              </Text>
              <Text style={{
                marginTop: 28, fontSize: 'clamp(16px, 4vw, 22px)',
                color: '#777', lineHeight: 1.8, letterSpacing: '-0.5px',
              }}>
                플랫폼 수수료와 광고비 대신,<br />
                전부 강의와 도구에 쓰면 —<br />
                <strong style={{ color: '#e2e2e2', fontWeight: 700 }}>가격은 낮아지고, 가치는 높아집니다.</strong>
              </Text>
            </Box>

            {/* ── 내는 돈 ── */}
            <Text style={{
              fontSize: 12, fontWeight: 700, color: '#555',
              letterSpacing: 2, marginBottom: 20,
              paddingLeft: isMobile ? 0 : 184,
            }}>내는 돈</Text>

            {/* 타 강의 A */}
            <PricingBar name="타 강의 A" price="160만원" nameColor="#777" priceColor="#999" barWidth="53%" mobileBarWidth="80%" isMobile={isMobile}
              segments={[
                { label: '강의 제작', flex: 2, bg: '#333', color: '#999' },
                { label: '플랫폼 수수료', flex: 1.8, bg: '#444', color: '#bbb' },
                { label: '광고', flex: 1.3, bg: '#444', color: '#bbb' },
                { label: '인건비', flex: 0.8, bg: '#333', color: '#999' },
                { label: '마진', flex: 0.6, bg: '#333', color: '#999' },
              ]}
            />
            <Box style={{ marginLeft: isMobile ? 0 : 184, paddingLeft: 40, borderLeft: '2px dashed rgba(255,255,255,0.08)', height: 12 }} />

            {/* 타 강의 B */}
            <PricingBar name="타 강의 B" price="300만원" nameColor="#777" priceColor="#999" barWidth="100%" isMobile={isMobile}
              segments={[
                { label: '강의 제작', flex: 2, bg: '#333', color: '#999' },
                { label: '플랫폼 수수료', flex: 2.2, bg: '#444', color: '#bbb' },
                { label: '광고·마케팅', flex: 2, bg: '#444', color: '#bbb' },
                { label: '인건비', flex: 1.2, bg: '#333', color: '#999' },
                { label: '마진', flex: 1, bg: '#333', color: '#999' },
              ]}
            />
            <Box style={{ marginLeft: isMobile ? 0 : 184, paddingLeft: 40, borderLeft: '2px dashed rgba(255,255,255,0.08)', height: 12 }} />

            {/* 원초적 인사이트 — 내는 돈 */}
            <Box style={{
              background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 14, padding: '20px 24px', marginLeft: -24, marginRight: -24,
            }}>
              <PricingBar name="원초적 인사이트" price="50만원" nameColor="#a78bfa" priceColor="#8b5cf6" barWidth="28%" mobileBarWidth="55%" isMobile={isMobile}
                segments={[
                  { label: '강의 제작', flex: 2, bg: '#7c3aed', color: '#e9d5ff' },
                  { label: 'AI 개발', flex: 1.5, bg: '#7c3aed', color: '#e9d5ff' },
                  { label: '서버', flex: 0.8, bg: '#7c3aed', color: '#e9d5ff' },
                  { label: '마진', flex: 0.5, bg: '#7c3aed', color: '#e9d5ff' },
                ]}
              />
            </Box>

            {/* ── 구분선 ── */}
            <Box style={{
              display: 'flex', alignItems: 'center', gap: 16,
              margin: '48px 0', paddingLeft: isMobile ? 0 : 184,
            }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', letterSpacing: 2 }}>그런데</Text>
              <Box style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(139,92,246,0.3), transparent)' }} />
            </Box>

            {/* ── 받는 것 ── */}
            <Text style={{
              fontSize: 12, fontWeight: 700, color: '#555',
              letterSpacing: 2, marginBottom: 20,
              paddingLeft: isMobile ? 0 : 184,
            }}>받는 것</Text>

            {/* 타 강의 A — 받는 것 */}
            <PricingBar name="타 강의 A" price="160만원" nameColor="#777" priceColor="#555" barWidth="14%" mobileBarWidth="25%" isMobile={isMobile}
              segments={[
                { label: '강의 영상', flex: 1, bg: '#222', color: '#555' },
              ]}
            />
            <Box style={{ marginLeft: isMobile ? 0 : 184, paddingLeft: 40, borderLeft: '2px dashed rgba(255,255,255,0.08)', height: 12 }} />

            {/* 타 강의 B — 받는 것 */}
            <PricingBar name="타 강의 B" price="300만원" nameColor="#777" priceColor="#555" barWidth="20%" mobileBarWidth="35%" isMobile={isMobile}
              segments={[
                { label: '강의 영상', flex: 2, bg: '#222', color: '#555' },
                { label: '커뮤니티', flex: 1, bg: '#222', color: '#555' },
              ]}
            />
            <Box style={{ marginLeft: isMobile ? 0 : 184, paddingLeft: 40, borderLeft: '2px dashed rgba(255,255,255,0.08)', height: 12 }} />

            {/* 원초적 인사이트 — 받는 것 */}
            <Box style={{
              background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)',
              borderRadius: 14, padding: '20px 24px', marginLeft: -24, marginRight: -24,
            }}>
              <PricingBar name="원초적 인사이트" price="50만원" nameColor="#a78bfa" priceColor="#8b5cf6" barWidth="100%" isMobile={isMobile}
                segments={[
                  { label: '강의 40강', flex: 1.8, bg: '#8b5cf6', color: '#fff' },
                  { label: '전자책', flex: 1.3, bg: '#8b5cf6', color: '#fff' },
                  { label: 'FlowSpot', sublabel: '(AI 스크립트 도구)', flex: 2.2, bg: '#a78bfa', color: '#1a1a2e', bold: true },
                  { label: '채널 트렌드 데이터', sublabel: '(매달 업데이트)', flex: 2, bg: '#a78bfa', color: '#1a1a2e', bold: true },
                  { label: '노션 템플릿', flex: 1.5, bg: '#8b5cf6', color: '#fff' },
                ]}
              />
            </Box>

            {/* ── 마무리 카피 ── */}
            <Text style={{
              marginTop: 72, fontSize: 'clamp(18px, 4.5vw, 24px)',
              fontWeight: 700, color: '#8b5cf6',
              lineHeight: 1.7, letterSpacing: '-0.5px',
              padding: '0 20px', textAlign: 'center',
            }}>
              원초적 인사이트는 플랫폼 수수료와 광고비를 걷어내고,<br />
              그 비용을 강의와 도구에 직접 담았습니다.
            </Text>
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
      includes: ['전자책 (기초 가이드)', 'VOD 40강 (순차 학습)', 'AI 스크립트 4개월'],
    },
    {
      qNum: 'Q2', question: '하고 있는데 성장이 안 되나요?',
      label: '성장', color: '#22c55e',
      answer: '터지는 영상에는 공식이 있습니다. 그 공식을 드립니다.',
      includes: ['채널 리스트 (벤치마크)', 'AI 스크립트 (검증된 구조)', 'VOD 40강 (심화)'],
    },
    {
      qNum: 'Q3', question: '혼자 하려니 지치셨나요?',
      label: '시스템화', color: '#3b82f6',
      answer: '반복 작업은 AI에게. 당신은 기획만 하세요.',
      includes: ['노션 운영 템플릿', 'AI 스크립트 (자동화)', '채널 리스트 (트렌드)'],
    },
  ];

  return (
    <Box component="section" id="how-it-works" style={{ background: '#ffffff', padding: 'clamp(72px, 12vw, 140px) 0' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56}>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 7.5vw, 40px)', fontWeight: 700,
              color: '#18181b', letterSpacing: '-0.02em', lineHeight: 1.3,
            }}>
              혹시 여러분은 어디서 헤매고 계신가요?
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
                  <Text style={{ fontSize: 'clamp(16px, 3vw, 18px)', fontWeight: 900, color: '#ffffff' }}>
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
                    <Text style={{ fontSize: '10px', fontWeight: 800, color: '#ffffff' }}>YES</Text>
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
                    <Text style={{ fontSize: '11px', fontWeight: 700, color: '#71717a' }}>NO ↓</Text>
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
              fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 900,
              color: '#18181b', letterSpacing: '-0.02em', lineHeight: 1.2,
            }}>
              어떤 단계든,{' '}
              <span style={{ color: '#8b5cf6' }}>올인원 하나</span>면 됩니다
            </Text>
            <Button
              component={Link} href="/checkout/allinone" size="lg" radius="xl"
              style={{
                background: '#8b5cf6', fontSize: '16px', fontWeight: 700,
                padding: '14px 40px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(139,92,246,0.2)',
              }}
            >
              올인원 패스 신청하기
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
    <Box component="section" style={{ background: '#fafafa', padding: 'clamp(56px, 10vw, 100px) 0', position: 'relative' }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        {/* 최단거리 클로저 */}
        <motion.div {...fadeUp}>
          <Box style={{ textAlign: 'center', marginBottom: 'clamp(48px, 10vw, 72px)' }}>
            <Text style={{
              fontSize: 'clamp(24px, 6.5vw, 36px)',
              fontWeight: 800, color: '#3f3f46', lineHeight: 1.5,
            }}>
              <span style={{ color: '#8b5cf6', fontWeight: 900 }}>4</span>년의 시행착오를 앞지르고,
              <br />
              매달 <span style={{ color: '#8b5cf6', fontWeight: 900 }}>80</span>시간을 절약하는 것.
            </Text>
            <Text style={{
              fontSize: 'clamp(28px, 7.5vw, 42px)',
              fontWeight: 900, color: '#18181b', lineHeight: 1.3,
              marginTop: 'clamp(12px, 3vw, 20px)',
            }}>
              그게{' '}
              <span style={{ color: '#8b5cf6', position: 'relative', display: 'inline-block' }}>
                최단거리
                <Box component="span" style={{
                  position: 'absolute', bottom: '2px', left: '-2px', right: '-2px',
                  height: '8px', background: 'rgba(139,92,246,0.25)',
                  borderRadius: '4px', zIndex: -1,
                }} />
              </span>
              입니다.
            </Text>
          </Box>
        </motion.div>

        {/* Pro 구독 안내 */}
        <motion.div {...fadeUp}>
          <Text ta="center" style={{
            fontSize: 'clamp(13px, 3.2vw, 14px)',
            color: '#a1a1aa',
            marginTop: '24px',
          }}>
            4개월 종료 후에는 월 ₩{monthlySubscription.amount.toLocaleString()} 구독 상품이 열릴 예정입니다.
          </Text>
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
    { q: 'AI 1도 몰라도 되나요?', a: '네, 전혀 몰라도 괜찮습니다. 소재만 입력하면 AI가 스크립트를 자동으로 만들어줍니다. 사용법도 강의에서 처음부터 알려드리니까 걱정 마세요.' },
    { q: '이것만 구매하면 바로 성공하나요?', a: '솔직히 말씀드리면, 노력 없이 큰 결과를 기대하시는 분에게는 추천드리지 않습니다. 이 과정은 4년 걸릴 길을 최단거리로 바꿔드릴 뿐, 그 길은 직접 걸으셔야 합니다. 빠르게 실행할 의지가 있는 분이라면 충분히 결과를 만들 수 있습니다.' },
    { q: '어떤 사람에게 맞나요?', a: '쇼츠를 처음 시작하는 분, 올리고 있는데 조회수가 안 나오는 분, 혼자 하다 지치신 분 모두를 고려해서 설계했습니다. 다만 컴퓨터 사용이 미숙하거나 편집을 한 번도 해보지 않으신 분은 기본 세팅과 프로그램까지 함께 익히셔야 하므로 시간이 조금 더 걸릴 수 있습니다.' },
    { q: '올인원 4개월 끝나면 어떻게 되나요?', a: `4개월 종료 후에는 월 ₩${monthlySubscription.amount.toLocaleString()} 구독 상품을 열 예정입니다. 그 전까지는 강의와 프로그램, 매달 400cr 지급 기준으로 이용하시면 됩니다.` },
    { q: '환불 되나요?', a: '이러닝 표준약관을 따릅니다. 결제 후 7일 이내, 강의를 1강도 수강하지 않은 경우 전액 환불됩니다. 수강을 시작한 경우 (1강 단가 × 수강 강의 수 + 위약금 10%)를 공제 후 환불됩니다. 이용기한(4개월) 경과 후에는 환불이 불가합니다.' },
  ];

  return (
    <Box component="section" id="faq" style={{ background: '#ffffff', padding: 'clamp(56px, 10vw, 100px) 0' }}>
      <Container size={640}>
        <motion.div {...fadeUp}>
          <Title order={2} ta="center" style={{
            color: '#18181b', fontSize: 'clamp(32px, 9vw, 52px)',
            fontWeight: 900, marginBottom: '56px', letterSpacing: '-0.03em',
            lineHeight: 1.2,
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
      background: '#fafafa', padding: 'clamp(80px, 15vw, 160px) 0', position: 'relative', overflow: 'hidden',
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
              color: '#18181b', fontSize: 'clamp(32px, 9vw, 52px)',
              fontWeight: 900, lineHeight: 1.2, letterSpacing: '-0.03em',
            }}>
              지금 시작하지 않으면,
              <br />
              내일도 같은 고민을 하게 됩니다
            </Title>
            <Button
              component={Link} href="/checkout/allinone" size="xl" radius="xl"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: '#8b5cf6', fontSize: '17px', fontWeight: 700,
                padding: '18px 44px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(139,92,246,0.2)',
              }}
            >
              올인원 패스 시작하기
            </Button>
            <Stack align="center" gap={4}>
              <Text size="sm" style={{ color: '#71717a', fontSize: '15px' }}>
                7일 환불 보장 · 문의: hmys0205hmys@gmail.com
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
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // 히어로 CTA가 화면에서 사라지면 FloatingCTA 표시
    const heroCta = document.getElementById('hero-cta');
    if (!heroCta) {
      // fallback: 히어로 CTA 없으면 스크롤 기반
      const handleScroll = () => setIsVisible(window.scrollY > 400);
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(heroCta);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  if (!isVisible) return null;

  if (isMobile) {
    return (
      <Box style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff', borderTop: '1px solid #d4d4d8',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}>
        {/* 펼침 영역 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              style={{ overflow: 'hidden' }}
            >
              <Box style={{
                padding: '16px 16px 0',
                borderBottom: '1px solid #f4f4f5',
              }}>
                <Stack gap={8}>
                  {[
                    { label: '총 금액', value: `₩${primaryProgram.amount.toLocaleString()} (${Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100)}% 할인)` },
                    { label: '구성', value: 'VOD 40강 + 전자책 133p' },
                    { label: '이용기간', value: '4개월 올인원' },
                    { label: '크레딧', value: '매달 400cr × 4회' },
                    { label: '환불', value: '7일 이내 전액 환불' },
                  ].map((item) => (
                    <Group key={item.label} justify="space-between" wrap="nowrap">
                      <Text style={{ fontSize: '13px', color: '#71717a' }}>{item.label}</Text>
                      <Text style={{ fontSize: '13px', fontWeight: 700, color: '#27272a' }}>{item.value}</Text>
                    </Group>
                  ))}
                </Stack>
                <Box style={{ height: '12px' }} />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 바 */}
        <Box style={{ padding: '10px 16px' }}>
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Group gap={8} align="center" wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => setIsExpanded((v) => !v)}>
              <Stack gap={0}>
                <Group gap={6} align="baseline">
                  <Text style={{ fontSize: '19px', fontWeight: 800, color: '#8b5cf6', lineHeight: 1.2 }}>
                    ₩{primaryProgram.amount.toLocaleString()}
                  </Text>
                  <Text style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444' }}>
                    {Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100)}%
                  </Text>
                </Group>
                <Text style={{ fontSize: '11px', color: '#71717a' }}>
                  12개월 할부 시 월 {Math.ceil(primaryProgram.amount / 12).toLocaleString()}원
                </Text>
              </Stack>
              <ChevronDown
                size={16}
                color="#a1a1aa"
                style={{
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 200ms ease',
                }}
              />
            </Group>
            <Button
              component={Link} href="/checkout/allinone" size="md" radius="xl"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
              }}
            >
              신청하기
            </Button>
          </Group>
        </Box>
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
              <Group gap={6} align="center">
                <Text style={{ fontSize: '12px', color: '#71717a', textDecoration: 'line-through' }}>
                  ₩{primaryProgram.listAmount.toLocaleString()}
                </Text>
                <Text style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444' }}>
                  {Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100)}%
                </Text>
              </Group>
              <Text style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>
                ₩{primaryProgram.amount.toLocaleString()}
              </Text>
              <Text style={{ fontSize: '13px', color: '#52525b' }}>
                12개월 할부 시 월 {Math.ceil(primaryProgram.amount / 12).toLocaleString()}원
              </Text>
            </Stack>
            <Button
              component={Link} href="/checkout/allinone" size="sm" fullWidth radius="lg"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
              }}
            >
              신청하기
            </Button>
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
      <ProductRevealSection />
      <WhySpecialSection />
      <HowItWorksSection />
      <PackageSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <FloatingCTA />
    </main>
  );
}
