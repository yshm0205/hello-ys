'use client';

/**
 * FlowSpot 랜딩 페이지 — v3 (frontend-design skill 적용)
 * Refined Editorial: zinc neutrals, monospace data accents, intentional violet
 */

import { useState, useEffect, type ReactNode } from 'react';
import {
  Container,
  Title,
  Text,
  Group,
  Stack,
  Box,
  Badge,
  Paper,
  Accordion,
  Anchor,
} from '@mantine/core';
import { Check, Bot, ChevronDown, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { MarketingTracker } from '@/components/analytics/MarketingTracker';
import { AuthAwareButton } from '@/components/landing/AuthAwareButton';
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

type LandingEarlybirdSummary = {
  currentTier: 'phase1' | 'phase2' | 'ended';
  phase1SoldCount: number;
  phase1Remaining: number;
  phase1Total: number;
  phase2SoldCount: number;
  phase2Remaining: number;
  phase2Total: number;
  tier1Deadline: string;
};

const EARLYBIRD_FALLBACK_SUMMARY: LandingEarlybirdSummary = {
  currentTier: 'phase1',
  phase1SoldCount: 0,
  phase1Remaining: 30,
  phase1Total: 30,
  phase2SoldCount: 0,
  phase2Remaining: 70,
  phase2Total: 70,
  tier1Deadline: '2026-05-08T23:59:59+09:00',
};

function useLandingEarlybirdSummary(initialSummary: LandingEarlybirdSummary) {
  const [summary, setSummary] = useState<LandingEarlybirdSummary>(initialSummary);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/marketing/earlybird', { cache: 'no-store' });
        if (!res.ok) return;

        const data = (await res.json()) as Partial<LandingEarlybirdSummary>;
        if (cancelled) return;

        if (
          typeof data.currentTier === 'string' &&
          typeof data.phase1Remaining === 'number' &&
          typeof data.phase1Total === 'number' &&
          typeof data.phase2Remaining === 'number' &&
          typeof data.phase2Total === 'number'
        ) {
          setSummary({
            currentTier:
              data.currentTier === 'phase2' || data.currentTier === 'ended'
                ? data.currentTier
                : 'phase1',
            phase1SoldCount: Number(data.phase1SoldCount ?? 0),
            phase1Remaining: Number(data.phase1Remaining),
            phase1Total: Number(data.phase1Total),
            phase2SoldCount: Number(data.phase2SoldCount ?? 0),
            phase2Remaining: Number(data.phase2Remaining),
            phase2Total: Number(data.phase2Total),
            tier1Deadline: String(data.tier1Deadline ?? EARLYBIRD_FALLBACK_SUMMARY.tier1Deadline),
          });
        }
      } catch {
        // keep fallback summary
      }
    };

    void load();
    const interval = window.setInterval(load, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return summary;
}

function getActiveEarlybirdView(summary: LandingEarlybirdSummary) {
  if (summary.currentTier === 'phase2') {
    const remaining = summary.phase2Remaining;
    const total = summary.phase2Total;
    return {
      currentTier: 'phase2' as const,
      remaining,
      total,
      claimed: total - remaining,
      claimedPct: Math.round(((total - remaining) / total) * 100),
      isUrgent: remaining <= 5,
      badgeLabel: '현재 2차 혜택',
      bonusValue: '39,000원 상당',
      headline: '2차 얼리버드',
      progressHint: '2차 종료 후 얼리버드 혜택은 종료됩니다.',
    };
  }

  if (summary.currentTier === 'ended') {
    return {
      currentTier: 'ended' as const,
      remaining: 0,
      total: summary.phase2Total,
      claimed: summary.phase2Total,
      claimedPct: 100,
      isUrgent: false,
      badgeLabel: '얼리버드 종료',
      bonusValue: '혜택 종료',
      headline: '얼리버드 종료',
      progressHint: '이제 정가 구성으로만 신청할 수 있습니다.',
    };
  }

  const remaining = summary.phase1Remaining;
  const total = summary.phase1Total;
  return {
    currentTier: 'phase1' as const,
    remaining,
    total,
    claimed: total - remaining,
    claimedPct: Math.round(((total - remaining) / total) * 100),
    isUrgent: remaining <= 5,
    badgeLabel: '현재 1차 혜택',
    bonusValue: '78,000원 상당',
    headline: '1차 얼리버드',
    progressHint: '1차 마감되면 2차로 전환되고, 보너스 크레딧은 절반으로 줄어듭니다.',
  };
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
   섹션 1: Hero — Cinematic Dark 3D (풀블리드 모래시계)
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <Box
      component="section"
      id="landing-hero"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '760px',
        height: '100vh',
        overflow: 'hidden',
        background: '#0a0a0f',
        color: '#f4f4f5',
        isolation: 'isolate',
      }}
    >
      {/* Inline scoped styles for responsive image/overlay treatment */}
      <style>{`
        .fs-hero-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center right;
          z-index: 0;
          user-select: none;
          -webkit-user-drag: none;
        }
        .fs-hero-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: linear-gradient(to right,
            rgba(10,10,15,0.88) 0%,
            rgba(10,10,15,0.55) 40%,
            rgba(10,10,15,0.0) 65%);
        }
        @media (max-width: 768px) {
          .fs-hero-img {
            opacity: 0.35;
            filter: blur(1.5px) brightness(0.55);
          }
          .fs-hero-overlay {
            background:
              radial-gradient(ellipse at center, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0) 70%),
              rgba(10,10,15,0.78);
          }
        }
        .fs-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #a78bfa;
          box-shadow: 0 0 10px #a78bfa, 0 0 20px #8b5cf6;
          animation: fs-pulse 2.4s ease-in-out infinite;
        }
        @keyframes fs-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.8); }
        }
        .fs-headline-accent::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -0.08em;
          height: 0.08em;
          background: linear-gradient(90deg, transparent, rgba(139,92,246,0.5), transparent);
          filter: blur(3px);
        }
      `}</style>

      {/* Full-bleed background image */}
      <Image
        src="/images/hero-hourglass.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="fs-hero-img"
      />

      {/* Overlay */}
      <Box className="fs-hero-overlay" />

      {/* Copy container */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease }}
        style={{
          position: 'relative',
          zIndex: 5,
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          padding: 'clamp(80px, 12vw, 140px) clamp(24px, 6vw, 80px) clamp(48px, 8vw, 120px)',
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          style={{
            maxWidth: '560px',
            width: '100%',
            textAlign: 'left',
          }}
          className="fs-hero-copy"
        >
          {/* Mobile center alignment via media query */}
          <style>{`
            @media (max-width: 768px) {
              .fs-hero-copy { text-align: center; margin: 0 auto; max-width: 340px; }
              .fs-hero-copy .fs-ctas, .fs-hero-copy .fs-social { justify-content: center; }
              .fs-hero-copy .fs-sub { margin-left: auto; margin-right: auto; }
            }
          `}</style>

          {/* Eyebrow pill */}
          <Box
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px 8px 14px',
              borderRadius: '9999px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(250,250,250,0.88)',
              background: 'linear-gradient(180deg, rgba(139,92,246,0.14), rgba(139,92,246,0.06))',
              border: '1px solid rgba(167,139,250,0.35)',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.02) inset, 0 0 24px rgba(139,92,246,0.25)',
              marginBottom: '28px',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <span className="fs-eyebrow-dot" />
            <span>AI 스크립트 · 트렌드 데이터 · VOD 40강 · 전자책 · 노션 템플릿</span>
          </Box>

          {/* Headline */}
          <Title
            order={1}
            style={{
              margin: 0,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.035em',
              color: '#fafafa',
              fontSize: 'clamp(44px, 7vw, 78px)',
            }}
          >
            <Box
              component="span"
              style={{
                display: 'block',
                color: 'rgba(250,250,250,0.75)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                fontSize: 'clamp(32px, 5vw, 62px)',
                marginBottom: '8px',
              }}
            >
              쇼츠 수익화
            </Box>
            <Box
              component="span"
              style={{
                display: 'block',
                background: 'linear-gradient(180deg, #ffffff 0%, #d4d4d8 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                color: 'transparent',
              }}
            >
              <Box
                component="span"
                className="fs-headline-accent"
                style={{
                  position: 'relative',
                  background: 'linear-gradient(120deg, #c4b5fd 0%, #8b5cf6 40%, #f0abfc 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                최단거리
              </Box>
              {' '}패키지
            </Box>
          </Title>

          {/* CTA */}
          <Box
            className="fs-ctas"
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: 'clamp(28px, 4vw, 40px)',
              flexWrap: 'wrap',
            }}
          >
            <AuthAwareButton
              id="hero-cta"
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="xl"
              radius="md"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: 'linear-gradient(180deg, #a78bfa 0%, #8b5cf6 45%, #7c3aed 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 600,
                padding: '16px 26px',
                height: 'auto',
                border: 'none',
                letterSpacing: '-0.01em',
                boxShadow:
                  '0 0 0 1px rgba(167,139,250,0.6) inset, 0 1px 0 rgba(255,255,255,0.4) inset, 0 0 24px rgba(139,92,246,0.45), 0 8px 28px rgba(139,92,246,0.35)',
              }}
            >
              올인원 패스 신청하기
            </AuthAwareButton>
          </Box>

          {/* Social proof */}
          <Box
            className="fs-social"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: 'clamp(28px, 4vw, 40px)',
            }}
          >
            <Text
              style={{
                color: 'rgba(228,228,231,0.7)',
                fontSize: '14px',
              }}
            >
              <b style={{ color: '#fafafa', fontWeight: 700 }}>얼리버드 특가</b> · 선착순 진행 중
            </Text>
          </Box>
        </Box>
      </motion.div>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 1.7: LoopPainSection — 무한 루프 원형 시각화 + 갇혀 계신가요?
   ═══════════════════════════════════════════════════════════════ */
function LoopPainSection() {
  return (
    <Box
      component="section"
      id="loop-pain"
      style={{
        width: '100%',
        padding: 'clamp(64px, 10vw, 110px) 16px clamp(48px, 8vw, 80px)',
        background: '#fafafa',
      }}
    >
      <Box style={{ maxWidth: '520px', margin: '0 auto' }}>
        {/* 원형 루프 시각화 — SVG 원 + HTML 라벨 */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: '380px', margin: '0 auto' }}>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease }}
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
    <Box component="section" id="pain" style={{ background: '#ffffff', padding: 'clamp(72px, 12vw, 140px) 0', scrollMarginTop: '120px' }}>
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
                  <Image
                    src={img.src}
                    alt={img.caption}
                    width={776}
                    height={384}
                    sizes="(max-width: 520px) 100vw, 520px"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
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
                <Image
                  src={item.src}
                  alt={`${item.label} 수익 ${item.amount}`}
                  width={350}
                  height={270}
                  sizes="(max-width: 560px) 100vw, 560px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
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
                <Image
                  src="/images/success-naver-clip.png"
                  alt="네이버 클립 수익"
                  width={602}
                  height={320}
                  sizes="(max-width: 560px) 100vw, 560px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </Box>
              <Box style={{
                borderRadius: '12px', overflow: 'hidden',
                border: '1px solid rgba(34,197,94,0.2)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 12px rgba(34,197,94,0.06)',
                background: '#ffffff',
              }}>
                <Image
                  src="/images/success-naver-revenue.jpg"
                  alt="네이버 클립 월별 수익"
                  width={864}
                  height={710}
                  sizes="(max-width: 560px) 100vw, 560px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
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
              <Image
                src="/images/success-instagram-monthly.jpg"
                alt="인스타 릴스 월 800만 조회"
                width={1080}
                height={683}
                sizes="(max-width: 560px) 100vw, 528px"
                style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}
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
            { src: '/images/reviews/review_1_revenue.png', caption: '월 1,356만 수익', sub: '조회수 7,613만회', alt: '수강생 성과 — 월 1356만 수익', w: 1024, h: 563 },
            { src: '/images/reviews/review_3_kakao.png', caption: '월 700만 수익', alt: '수강생 성과 — 월 700만 수익', w: 1000, h: 500 },
            { src: '/images/reviews/review_7_kakao.png', caption: '구독자 1,000명 돌파', alt: '수강생 성과 — 구독자 1000 달성', w: 1000, h: 1000 },
            { src: '/images/reviews/review_6_youtube.png', caption: '조회수 폭발', alt: '수강생 성과 — 조회수 폭발', w: 1000, h: 500 },
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
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.w}
                  height={item.h}
                  sizes="(max-width: 400px) 100vw, 400px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
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
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={1000}
                  height={300}
                  sizes="(max-width: 400px) 100vw, 400px"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
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
      w: 1920, h: 1080,
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
      w: 1080, h: 608,
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
      w: 1920, h: 1080,
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
      w: 1920, h: 1080,
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
      w: 1920, h: 1080,
      accent: '#3b82f6',
    },
  ];

  return (
    <Box component="section" id="offer" style={{
      background: '#faf5ff', scrollMarginTop: '120px',
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
                  <Image
                    src={item.src}
                    alt={item.title}
                    width={item.w}
                    height={item.h}
                    unoptimized
                    sizes="(max-width: 480px) 100vw, 480px"
                    style={{ width: '100%', height: 'auto', display: 'block' }}
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

        {/* 최단거리 헤드라인 */}
        <motion.div {...fadeUp}>
          <Box style={{
            textAlign: 'center',
            marginTop: 'clamp(56px, 11vw, 88px)',
            marginBottom: 'clamp(24px, 5vw, 32px)',
          }}>
            <Text style={{
              fontSize: 'clamp(22px, 5.5vw, 30px)',
              fontWeight: 800, color: '#3f3f46', lineHeight: 1.5,
            }}>
              <span style={{ color: '#8b5cf6', fontWeight: 900 }}>4</span>년의 시행착오를 앞지르고,
              <br />
              매달 <span style={{ color: '#8b5cf6', fontWeight: 900 }}>80</span>시간을 절약하는 것.
            </Text>
            <Text style={{
              fontSize: 'clamp(26px, 6.8vw, 36px)',
              fontWeight: 900, color: '#18181b', lineHeight: 1.3,
              marginTop: 'clamp(10px, 2.5vw, 16px)',
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

        {/* 시간 절약 팩트 요약 — 2분할 */}
        <motion.div {...fadeUp}>
          <Box style={{
            maxWidth: '480px', margin: '0 auto',
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
      part: 'Part 0', title: '소개',
      subtitle: '이 강의를 최대한 뽑아먹는 법',
      count: 1,
      vods: [
        '이 강의를 100% 활용해서 4년을 2주로 줄이는 법',
      ],
    },
    {
      part: 'Part 1', title: '채널 기획',
      subtitle: '시작부터 수익 구조를 설계합니다',
      count: 4,
      vods: [
        '주제로 타겟 잡으면 90%가 망합니다',
        '얼굴 안 나와도 되는 채널 vs 나와야 되는 채널',
        '4가지만 섞으면 아무도 없는 카테고리가 만들어집니다',
        '제대로 된 벤치마크 채널 찾는 법',
      ],
    },
    {
      part: 'Part 2', title: '영상 주제 선정 & 분석',
      subtitle: '뭘 만들지 고민하는 시간을 줄입니다',
      count: 7,
      vods: [
        '내가 만든 영상이 안 터지는 진짜 이유 2가지',
        '커뮤니티 게시글 하나에서 시작한 떡상 영상',
        '실전 예시 — 쇼핑 채널은 여기부터 봅니다',
        '실전 예시 — 지식 채널의 핵심은 역추적',
        '실전 예시 — 애니·스포츠 채널은 접근법이 다릅니다',
        '프로그램 하나로 주제 찾는 시간 10분의 1로 줄이기',
        '주제선정 프로그램 설치 가이드',
      ],
    },
    {
      part: 'Part 3', title: '후킹 & 대본 작성',
      subtitle: '3초 안에 잡고, 끝까지 보게 만듭니다',
      count: 6,
      vods: [
        '터진 후킹을 뜯어보니 공통적으로 들어있는 6개의 조각',
        '이 실수 하나면 후킹은 전부 무너집니다',
        '조회수 터진 영상에만 있는 본문 구조 4가지',
        '끝까지 보게 만드는 쇼츠에는 이게 있습니다',
        '터진 영상을 7개로 분해해서 내 주제로 가져오는 방법',
        'FlowSpot 프로그램 사용법',
      ],
    },
    {
      part: 'Part 4', title: '영상 소스 & AI 비주얼',
      subtitle: '다른 사람들은 이렇게 화면을 채웁니다',
      count: 9,
      vods: [
        '조회수 잘 나오는 쇼츠의 소스 배치는 이 3가지로 움직입니다',
        '소스가 바닥나지 않는 3가지 확보 루트',
        '공정 사용은 이 4가지 방법으로 해야 합니다',
        'AI 캐릭터 일관성 유지하는 설정',
        'AI 사진 뽑는 속도를 10배 올려주는 4단계 워크플로우',
        'AI 사진 9장 한 번에 뽑으면 작업 속도가 10배 빨라집니다',
        'AI 영상 만드는 3가지 공식',
        '사진 한 장이 8초짜리 영상 클립으로 완성되는 전 과정',
        'AI 심화: 미드저니 사용법',
      ],
    },
    {
      part: 'Part 5', title: '편집 실전',
      subtitle: '조회수를 만드는 편집 공식',
      count: 6,
      vods: [
        '시청자 눈을 피곤하게 만드는 편집의 함정 2가지',
        '편집 시간 절반으로 줄이는 6단계 루틴',
        '편집 실전: 잡학 지식형 쇼츠 완성하기 ① 음성·자막',
        '편집 실전: 잡학 지식형 쇼츠 완성하기 ② 영상 소스·효과음',
        '편집 실전: 커뮤니티형 쇼츠 처음부터 끝까지',
        '편집 실전: 썰형 쇼츠 처음부터 끝까지',
      ],
    },
    {
      part: 'Part 6', title: '수익화',
      subtitle: '광고 수익 그 다음 단계',
      count: 3,
      vods: [
        '쇼츠로 돈 버는 3가지 루트',
        '시청자가 살 수밖에 없는 상품은 데이터로 찾아냅니다',
        '쇼핑 태그를 넘어서 나만의 제품으로',
      ],
    },
    {
      part: 'Part 7', title: '자동화',
      subtitle: '부업에서 사업으로 확장합니다',
      count: 2,
      vods: [
        '남들보다 빠르게 수익화를 달성하는 방법',
        '취미를 넘어 사업으로',
      ],
    },
    {
      part: '부록', title: '활용 가이드',
      subtitle: '제공 툴 200% 활용법',
      count: 2,
      vods: [
        '편집자 협업 노션 템플릿 활용법',
        '매달 40시간짜리 떡상 채널 리스트 100% 활용법',
      ],
    },
  ];

  return (
    <Box component="section" id="compare" style={{
      background: '#ffffff', scrollMarginTop: '120px',
      padding: 'clamp(56px, 10vw, 100px) 0',
      position: 'relative',
    }}>
      <Box style={{ position: 'absolute', inset: 0, ...gridBg, pointerEvents: 'none' }} />

      <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
        {/* ═══ 브리지: 시간 → 가격 전환 ═══ */}
        <motion.div {...fadeUp}>
          <Box style={{
            textAlign: 'center',
            maxWidth: '520px',
            margin: '0 auto',
            marginBottom: 'clamp(40px, 8vw, 64px)',
          }}>
            <Text style={{
              fontSize: 'clamp(17px, 4.3vw, 20px)',
              fontWeight: 600, color: '#71717a',
              lineHeight: 1.6,
            }}>
              여기서 드는 질문은 하나.
            </Text>
            <Text style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              fontWeight: 800, color: '#18181b',
              lineHeight: 1.4,
              marginTop: 'clamp(8px, 2vw, 12px)',
              letterSpacing: '-0.02em',
            }}>
              &ldquo;그래서, 얼마인가요?&rdquo;
            </Text>
          </Box>
        </motion.div>

        {/* ═══ 비용 구조 비교 ═══ */}
        <motion.div {...fadeUp}>
          <Box style={{
            background: '#0a0a0a',
            borderRadius: '20px',
            padding: isMobile ? '48px 20px' : '72px 56px',
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

        {/* 커리큘럼 헤딩 */}
        <motion.div {...fadeUp}>
          <Stack align="center" gap={8} mb={56} style={{ marginTop: 'clamp(64px, 12vw, 100px)' }}>
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
                    <Group key={j} gap={10} wrap="nowrap" align="flex-start">
                      <Text
                        style={{
                          fontSize: '13px',
                          color: '#8b5cf6',
                          flexShrink: 0,
                          marginTop: '2px',
                          minWidth: '22px',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                          fontWeight: 600,
                        }}
                      >
                        {String(j + 1).padStart(2, '0')}
                      </Text>
                      <Text
                        style={{
                          fontSize: 'clamp(14px, 3.6vw, 16px)',
                          color: '#27272a',
                          lineHeight: 1.55,
                          flex: 1,
                          minWidth: 0,
                          wordBreak: 'keep-all',
                        }}
                      >
                        {vod}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </Box>
            </motion.div>
          ))}
        </Stack>
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
      includes: ['전자책', 'VOD 40강', 'AI 스크립트'],
    },
    {
      qNum: 'Q2', question: '하고 있는데 성장이 안 되나요?',
      label: '성장', color: '#22c55e',
      answer: '터지는 영상에는 공식이 있습니다. 그 공식을 드립니다.',
      includes: ['채널 리스트', 'AI 스크립트', 'VOD 40강'],
    },
    {
      qNum: 'Q3', question: '혼자 하려니 지치셨나요?',
      label: '시스템화', color: '#3b82f6',
      answer: '반복 작업은 AI에게. 당신은 기획만 하세요.',
      includes: ['노션 운영 템플릿', 'AI 스크립트', '채널 리스트'],
    },
  ];

  return (
    <Box component="section" id="how-it-works" style={{ background: '#ffffff', padding: 'clamp(72px, 12vw, 140px) 0', scrollMarginTop: '120px' }}>
      <Container size="lg">
        <motion.div {...fadeUp}>
          <Stack align="center" gap={14} mb={56}>
            <Title order={2} ta="center" style={{
              fontSize: 'clamp(28px, 7.5vw, 40px)', fontWeight: 700,
              color: '#18181b', letterSpacing: '-0.02em', lineHeight: 1.3,
            }}>
              혹시 여러분은 어디서 헤매고 계신가요?
            </Title>
            <Text ta="center" style={{
              fontSize: 'clamp(14px, 2.5vw, 16px)', color: '#71717a',
              lineHeight: 1.6, maxWidth: 520, letterSpacing: '-0.01em',
            }}>
              모든 단계의 솔루션이 <b style={{ color: '#18181b' }}>올인원 패스 하나</b>에 전부 포함됩니다.<br />
              단계별로 지금 가장 빛날 솔루션을 먼저 보여드립니다.
            </Text>
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
                      이 단계 핵심 솔루션
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

      </Container>
    </Box>
  );
}



/* ═══════════════════════════════════════════════════════════════
   섹션 6: FAQ
   ═══════════════════════════════════════════════════════════════ */
function renderWithLinks(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const [, label, href] = match;
    const isExternal = /^https?:\/\//.test(href);
    parts.push(
      isExternal ? (
        <Anchor
          key={`lnk-${key++}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#8b5cf6', fontWeight: 600 }}
        >
          {label}
        </Anchor>
      ) : (
        <Anchor
          key={`lnk-${key++}`}
          component={Link}
          href={href}
          style={{ color: '#8b5cf6', fontWeight: 600 }}
        >
          {label}
        </Anchor>
      ),
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function FAQSection() {
  const groups: { label: string; items: { q: string; a: string }[] }[] = [
    {
      label: '강의',
      items: [
        {
          q: 'AI 1도 몰라도 되나요?',
          a: '네, 전혀 몰라도 괜찮습니다. 소재만 입력하면 AI가 스크립트를 자동으로 만들어드리며, 사용법도 강의에서 기초부터 차근차근 안내해드립니다.',
        },
        {
          q: '이것만 구매하면 바로 성공하나요?',
          a: '솔직히 말씀드리면, 노력 없이 큰 결과를 기대하시는 분에게는 추천드리지 않습니다.\n\n이 과정은 4년 걸릴 길을 최단거리로 바꿔드릴 뿐, 그 길은 직접 걸으셔야 합니다. 빠르게 실행할 의지가 있는 분이라면 충분히 결과를 만들 수 있습니다.',
        },
        {
          q: '어떤 사람에게 맞나요?',
          a: '쇼츠를 처음 시작하는 분, 올리고 있는데 조회수가 안 나오는 분, 혼자 하다 지치신 분 모두를 고려해서 설계했습니다.\n\n다만 컴퓨터 사용이 미숙하거나 편집을 한 번도 해보지 않으신 분은 기본 세팅과 프로그램까지 함께 익히셔야 하므로 시간이 조금 더 걸릴 수 있습니다.',
        },
        {
          q: '얼굴을 공개해야 하나요?',
          a: '아니요, 얼굴 공개 없이 운영할 수 있는 채널 유형도 강의에서 다룹니다. Part 1에서 얼굴 노출 여부에 따른 채널 구조와 장단점을 비교해드리고, 본인에게 맞는 방향을 고르실 수 있게 설계했습니다.',
        },
        {
          q: '촬영 장비나 편집 프로그램이 없어도 되나요?',
          a: '고가 촬영 장비 없이 스마트폰만으로 시작할 수 있습니다. 편집은 캡컷(CapCut) 기반 워크플로우를 Part 5 실전 예시로 보여드리며, 편집 시간을 절반으로 줄이는 루틴도 포함됩니다.',
        },
        {
          q: '수강 기한은 언제까지인가요?',
          a: '올인원 패스는 결제일로부터 4개월간 강의와 프로그램을 이용할 수 있습니다.\n\n기간 내에는 자유롭게 복습 가능하며, 정상적인 학습 범위를 넘는 과도한 반복 재생(예: 비정상적 자동 재생)은 제한될 수 있습니다.',
        },
        {
          q: '강의는 어떻게 제공되나요?',
          a: 'VOD 온라인 스트리밍 방식입니다. 로그인 후 대시보드의 강의 플레이어에서 바로 재생할 수 있고, DRM 보호 영상이라 다운로드는 제공되지 않습니다. PC/모바일 모두 시청 가능합니다.',
        },
      ],
    },
    {
      label: '프로그램',
      items: [
        {
          q: '크레딧은 어떻게 사용되나요?',
          a: '스크립트 1회 생성 = 10크레딧 차감 방식입니다.\n\n올인원 패스는 결제 즉시 400cr 지급되고, 이후 매달 400cr씩 총 4회(1,600cr) 지급됩니다. 1달에 약 40회 생성 분량입니다.',
        },
        {
          q: '크레딧이 부족하면 어떻게 되나요?',
          a: '강의와 월간 트렌드 데이터는 계속 이용 가능하며, 스크립트 생성만 제한됩니다. 대시보드에서 추가 크레딧을 따로 구매할 수 있습니다.',
        },
        {
          q: '어떤 주제든 생성할 수 있나요?',
          a: '현재는 "지식 정보형"과 "썰/설렘형" 두 가지 주제에 최적화되어 있습니다.\n\n두 카테고리에 해당하는 소재라면 자유롭게 생성할 수 있고, 새로운 주제가 추가될 경우 해당 페이지에 안내드립니다.',
        },
        {
          q: 'AI로 만든 스크립트의 저작권은 누구에게 있나요?',
          a: '생성된 스크립트는 사용자가 자유롭게 활용하실 수 있습니다. 상업적 이용, 수정, 재배포 모두 제한 없이 가능합니다.\n\n다만 결과물은 초안 성격이니, 본인 스타일에 맞게 다듬어 최종 업로드 전 한 번 검토해 주세요.',
        },
      ],
    },
    {
      label: '결제·환불',
      items: [
        {
          q: '올인원 4개월 끝나면 어떻게 되나요?',
          a: `4개월 종료 후에는 올인원 구매자 한정 특전으로 월 ₩${monthlySubscription.amount.toLocaleString()} 구독 상품을 이어서 이용하실 수 있도록 열어드릴 예정입니다.\n\n그 전까지는 강의와 프로그램, 매달 400cr 지급 기준으로 이용하시면 됩니다.`,
        },
        {
          q: '환불 되나요?',
          a: '환불을 원하시는 경우 [환불 신청서](https://docs.google.com/forms/d/e/1FAIpQLSebxsymyHg8TKn5N_3XGr6CgTt0d-8tbmyDgqJkdNL3vbkzGg/viewform)를 작성해 주세요.\n\n결제 카드 변경은 환불 신청서 작성 후 재결제해 주세요.',
        },
        {
          q: '크레딧만 따로 구매할 수 있나요?',
          a: '네, 올인원 결제 이후 대시보드에서 크레딧 단독 충전이 가능합니다.\n\n다만 강의와 프로그램까지 포함된 올인원이 크레딧만 기준으로 환산해도 더 저렴하게 설계되어 있습니다.',
        },
        {
          q: '결제 수단은 뭐가 있나요?',
          a: '신용/체크카드와 계좌이체를 지원합니다. 결제는 토스페이먼츠(PG)를 통해 안전하게 처리됩니다.',
        },
        {
          q: '세금계산서나 현금영수증 발행되나요?',
          a: '개인은 결제 시 토스페이먼츠 결제창에서 현금영수증을 자동 발행하실 수 있습니다.\n\n사업자 세금계산서 발행은 화면 우측 하단 채널톡으로 사업자등록증과 결제 정보를 보내주시면 영업일 기준 1~2일 내 발행해드립니다.',
        },
        {
          q: '해외에서도 결제/수강 가능한가요?',
          a: '해외에서도 한국 발급 카드 또는 해외 카드로 결제 가능합니다. 강의와 프로그램 모두 웹 기반이라 국가 제한 없이 접속 가능하며, 고객 응대는 한국어로만 제공됩니다.',
        },
      ],
    },
    {
      label: '지원',
      items: [
        {
          q: '문의는 어디로 하면 되나요?',
          a: '화면 우측 하단의 채널톡으로 문의 주시면 영업일 기준 24~48시간 내 답변드립니다. 결제/환불, 수강, 프로그램 오류 모두 같은 창구로 문의 가능합니다.',
        },
        {
          q: '계정 공유가 가능한가요?',
          a: '계정 공유는 금지됩니다. 1인 1계정 원칙이며, 비정상적인 동시 접속이 감지될 경우 이용이 제한될 수 있습니다. 자료의 외부 공유/유출 또한 약관상 금지됩니다.',
        },
      ],
    },
  ];

  return (
    <Box component="section" id="faq" style={{ background: '#ffffff', padding: 'clamp(72px, 12vw, 120px) 0', scrollMarginTop: '120px' }}>
      <Container size={720}>
        <motion.div {...fadeUp}>
          <Stack align="center" gap={14} mb={64}>
            <Title
              order={2}
              ta="center"
              style={{
                color: '#09090b',
                fontSize: 'clamp(32px, 8vw, 52px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
              }}
            >
              자주 묻는 질문
            </Title>
            <Text ta="center" c="#71717a" size="md" style={{ maxWidth: 480 }}>
              궁금하신 점이 더 있다면 화면 우측 하단 채널톡으로 문의해 주세요.
            </Text>
          </Stack>
        </motion.div>

        <Stack gap={56}>
          {groups.map((group) => (
            <Box key={group.label}>
              <Group gap={14} mb={20} align="center">
                <Text
                  style={{
                    fontSize: '19px',
                    color: '#18181b',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {group.label}
                </Text>
                <Box
                  style={{
                    flex: 1,
                    height: 1,
                    background: '#e4e4e7',
                  }}
                />
              </Group>
              <Accordion
                variant="default"
                chevron={<ChevronDown size={18} strokeWidth={2.2} />}
                styles={{
                  item: {
                    background: '#ffffff',
                    border: 'none',
                    borderBottom: '1px solid #e4e4e7',
                    borderRadius: 0,
                  },
                  control: {
                    color: '#18181b',
                    fontWeight: 600,
                    fontSize: 'clamp(15px, 4vw, 17px)',
                    lineHeight: 1.5,
                    padding: '20px 4px',
                    letterSpacing: '-0.01em',
                    wordBreak: 'keep-all',
                  },
                  panel: {
                    color: '#52525b',
                    fontSize: 'clamp(14.5px, 3.8vw, 15.5px)',
                    lineHeight: 1.8,
                    padding: '0 4px 24px',
                    letterSpacing: '-0.005em',
                  },
                  chevron: {
                    color: '#a1a1aa',
                  },
                }}
              >
                {group.items.map((f) => (
                  <Accordion.Item key={f.q} value={f.q}>
                    <Accordion.Control>{f.q}</Accordion.Control>
                    <Accordion.Panel>
                      {f.a.split('\n\n').map((para, i) => (
                        <Text
                          key={i}
                          component="p"
                          style={{
                            margin: i === 0 ? 0 : '14px 0 0',
                            whiteSpace: 'pre-line',
                            wordBreak: 'keep-all',
                            color: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: 'inherit',
                          }}
                        >
                          {renderWithLinks(para)}
                        </Text>
                      ))}
                    </Accordion.Panel>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Box>
          ))}
        </Stack>
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
            <AuthAwareButton
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="xl" radius="xl"
              rightSection={<ArrowRight size={18} strokeWidth={2.5} />}
              style={{
                background: '#8b5cf6', fontSize: '17px', fontWeight: 700,
                padding: '18px 44px', height: 'auto', border: 'none',
                boxShadow: '0 2px 12px rgba(139,92,246,0.2)',
              }}
            >
              올인원 패스 시작하기
            </AuthAwareButton>
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
function LegacyFloatingCTA_DoNotUse({ earlybirdSummary }: { earlybirdSummary: LandingEarlybirdSummary }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const earlybird = getActiveEarlybirdView(earlybirdSummary);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    // 모바일: 진입 순간부터 항상 표시 (화면 좁아서 얼리버드 CTA와 겹침 부담 적음)
    // 데스크탑: 얼리버드 섹션을 완전히 지나간 이후에만 표시 (우측 카드와 섹션 CTA 중복 방지)
    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setIsVisible(true);
        return;
      }
      const eb = document.getElementById('earlybird');
      if (eb) {
        setIsVisible(eb.getBoundingClientRect().bottom < 0);
        return;
      }
      setIsVisible(window.scrollY > 400);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  if (isMobile) {
    const monthly12Orig = Math.ceil(primaryProgram.listAmount / 12);
    const monthly12Now = Math.ceil(primaryProgram.amount / 12);
    const discountPct = Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100);

    return (
      <Box style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff', borderTop: '1px solid #e4e4e7',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}>
        {/* 상단 chevron (독립 배치) */}
        <Box
          onClick={() => setIsExpanded((v) => !v)}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '6px 0 2px', cursor: 'pointer',
          }}
        >
          <ChevronDown
            size={20}
            color="#a1a1aa"
            style={{
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </Box>

        {/* 펼침 영역 — 선착순 카운터 */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              style={{ overflow: 'hidden' }}
            >
              <Box style={{ padding: '0 16px 14px' }}>
                <Box style={{
                  background: '#f4f4f5', borderRadius: '10px',
                  padding: '14px 16px',
                }}>
                  <Group justify="space-between" align="baseline" wrap="nowrap" mb={8}>
                    <Text style={{ fontSize: '12px', fontWeight: 700, color: '#52525b' }}>
                      1차 얼리버드 선착순
                    </Text>
                    <Text style={{
                      fontSize: '13px', fontWeight: 800, color: '#8b5cf6',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {EARLYBIRD_TIER1_REMAINING} / {EARLYBIRD_TIER1_TOTAL}명 남음
                    </Text>
                  </Group>
                  <Box style={{
                    width: '100%', height: 6, borderRadius: 999,
                    background: '#e4e4e7', overflow: 'hidden', marginBottom: 8,
                  }}>
                    <Box style={{
                      width: `${Math.round(((EARLYBIRD_TIER1_TOTAL - EARLYBIRD_TIER1_REMAINING) / EARLYBIRD_TIER1_TOTAL) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg,#8b5cf6,#d946ef)',
                      transition: 'width 600ms ease',
                    }} />
                  </Box>
                  <Text style={{
                    fontSize: '11.5px', color: '#71717a',
                    textAlign: 'center', lineHeight: 1.45,
                  }}>
                    마감되면 2차 얼리버드(보너스 절반)로 전환됩니다
                  </Text>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 메인 바 — 2줄 (위: 할부 원가+할인% / 아래: 최종 월 가격 크게) */}
        <Box style={{ padding: '4px 16px 12px' }}>
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                <span>12개월 할부 시 </span>
                <span style={{ color: '#a1a1aa', textDecoration: 'line-through' }}>월 {monthly12Orig.toLocaleString()}원</span>
              </Text>
              <Group gap={6} align="baseline" wrap="nowrap" style={{ marginTop: 1 }}>
                <Text style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', lineHeight: 1.1 }}>
                  {discountPct}%
                </Text>
                <Text style={{ fontSize: '18px', fontWeight: 800, color: '#18181b', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                  월 {monthly12Now.toLocaleString()}원
                </Text>
              </Group>
            </Box>
            <AuthAwareButton
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="md" radius="xl"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
              }}
            >
              신청하기
            </AuthAwareButton>
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
            <AuthAwareButton
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="sm" fullWidth radius="lg"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
              }}
            >
              신청하기
            </AuthAwareButton>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Sticky 섹션 탭 네비
   ═══════════════════════════════════════════════════════════════ */
function FloatingCTA({ earlybirdSummary }: { earlybirdSummary: LandingEarlybirdSummary }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const earlybird = getActiveEarlybirdView(earlybirdSummary);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      if (window.innerWidth < 768) {
        setIsVisible(true);
        return;
      }

      const earlybirdSection = document.getElementById('earlybird');
      if (earlybirdSection) {
        setIsVisible(earlybirdSection.getBoundingClientRect().bottom < 0);
        return;
      }

      setIsVisible(window.scrollY > 400);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (!isVisible) return null;

  const monthly12Orig = Math.ceil(primaryProgram.listAmount / 12);
  const monthly12Now = Math.ceil(primaryProgram.amount / 12);
  const discountPct = Math.round((1 - primaryProgram.amount / primaryProgram.listAmount) * 100);
  const floatingLabel =
    earlybird.currentTier === 'phase1'
      ? '1차 얼리버드'
      : earlybird.currentTier === 'phase2'
        ? '2차 얼리버드'
        : '얼리버드 종료';
  const floatingCountLabel =
    earlybird.currentTier === 'ended'
      ? '혜택 종료'
      : `선착순 ${earlybird.total}명 한정`;

  if (isMobile) {
    return (
      <Box style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#ffffff', borderTop: '1px solid #e4e4e7',
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
      }}>
        <Box
          onClick={() => setIsExpanded((prev) => !prev)}
          style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            padding: '6px 0 2px', cursor: 'pointer',
          }}
        >
          <ChevronDown
            size={20}
            color="#a1a1aa"
            style={{
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </Box>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease }}
              style={{ overflow: 'hidden' }}
            >
              <Box style={{ padding: '0 16px 14px' }}>
                <Box style={{
                  background: '#f4f4f5', borderRadius: '10px',
                  padding: '14px 16px',
                }}>
                  <Group justify="space-between" align="baseline" wrap="nowrap" mb={8}>
                    <Text style={{ fontSize: '12px', fontWeight: 700, color: '#52525b' }}>
                      {floatingLabel}
                    </Text>
                    <Text style={{
                      fontSize: '13px', fontWeight: 800, color: '#8b5cf6',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {floatingCountLabel}
                    </Text>
                  </Group>
                  <Text style={{
                    fontSize: '11.5px', color: '#71717a',
                    textAlign: 'center', lineHeight: 1.45,
                    wordBreak: 'keep-all',
                  }}>
                    {earlybird.progressHint}
                  </Text>
                </Box>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        <Box style={{ padding: '4px 16px 12px' }}>
          <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: '11px', color: '#71717a', lineHeight: 1.3, whiteSpace: 'nowrap' }}>
                <span>12개월 분할 시</span>
                <span style={{ color: '#a1a1aa', textDecoration: 'line-through' }}> 월 {monthly12Orig.toLocaleString()}원</span>
              </Text>
              <Group gap={6} align="baseline" wrap="nowrap" style={{ marginTop: 1 }}>
                <Text style={{ fontSize: '13px', fontWeight: 800, color: '#ef4444', lineHeight: 1.1 }}>
                  {discountPct}%
                </Text>
                <Text style={{ fontSize: '18px', fontWeight: 800, color: '#18181b', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
                  월 {monthly12Now.toLocaleString()}원
                </Text>
              </Group>
            </Box>
            <AuthAwareButton
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="md" radius="xl"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px', flexShrink: 0,
                boxShadow: '0 2px 8px rgba(139,92,246,0.2)',
              }}
            >
              신청하기
            </AuthAwareButton>
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
                  ₩ {primaryProgram.listAmount.toLocaleString()}
                </Text>
                <Text style={{ fontSize: '12px', fontWeight: 800, color: '#ef4444' }}>
                  {discountPct}%
                </Text>
              </Group>
              <Text style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>
                ₩ {primaryProgram.amount.toLocaleString()}
              </Text>
              <Text style={{ fontSize: '13px', color: '#52525b' }}>
                {earlybird.currentTier === 'ended'
                  ? '얼리버드 혜택 종료'
                  : `${earlybird.headline} · ${floatingCountLabel}`}
              </Text>
            </Stack>
            <AuthAwareButton
              authenticatedHref="/checkout/allinone"
              unauthenticatedHref="/login?redirect=/checkout/allinone"
              size="sm" fullWidth radius="lg"
              style={{
                background: '#8b5cf6', fontWeight: 700, fontSize: '14px',
                boxShadow: '0 2px 8px rgba(139,92,246,0.15)',
              }}
            >
              신청하기
            </AuthAwareButton>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
}

const sectionTabs = [
  { id: 'pain', label: '문제' },
  { id: 'offer', label: '구성' },
  { id: 'compare', label: '비교' },
  { id: 'faq', label: 'FAQ' },
];

function StickyTabNav() {
  const [activeId, setActiveId] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 히어로 지나면 표시
      const heroEl = document.getElementById('landing-hero');
      if (heroEl) {
        setShow(window.scrollY > heroEl.offsetTop + heroEl.offsetHeight - 80);
      }

      // 현재 활성 섹션 감지
      let current = '';
      for (const tab of sectionTabs) {
        const el = document.getElementById(tab.id);
        if (el && window.scrollY + 160 >= el.offsetTop) {
          current = tab.id;
        }
      }
      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return (
    <Box style={{
      position: 'sticky', top: 0, zIndex: 90,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(24,24,27,0.08)',
    }}>
      <Container size="lg">
        <Group
          gap={0}
          wrap="nowrap"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {sectionTabs.map((tab) => {
            const active = activeId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => document.getElementById(tab.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                style={{
                  flex: '1 0 auto',
                  padding: '14px 20px',
                  fontSize: '14px',
                  fontWeight: active ? 800 : 600,
                  color: active ? '#6d28d9' : '#71717a',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: active ? '2px solid #6d28d9' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </Group>
      </Container>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   섹션 1.5: EarlyBirdSection — 얼리버드 3단계 (다크 카드)
   ═══════════════════════════════════════════════════════════════ */
// 얼리버드 선착순 설정 — 외부 노출은 선착순 단일, 날짜는 내부 운영용 (UI 노출 X)
// TODO: 실제 결제 데이터에 연결 (예: Supabase view `paid_early_bird_slot_count`)
const EARLYBIRD_TIER1_TOTAL = 30;
const EARLYBIRD_TIER1_REMAINING = 30; // 오픈 직후 — DB 연동 전 실제값 기준
const EARLYBIRD_TIER2_TOTAL = 70;

function LegacyEarlyBirdSection_DoNotUse() {
  const isMobile = useIsMobile(900);
  const remaining = EARLYBIRD_TIER1_REMAINING;
  const total = EARLYBIRD_TIER1_TOTAL;
  const claimed = total - remaining;
  const claimedPct = Math.round((claimed / total) * 100);
  const isUrgent = remaining <= 5;

  return (
    <Box component="section" id="earlybird" style={{
      background: '#ffffff',
      padding: 'clamp(16px, 2.5vw, 28px) 0 clamp(56px, 9vw, 110px)',
    }}>
      <style>{`
        @keyframes ebPulse { 0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,.7);} 70%{box-shadow:0 0 0 10px rgba(167,139,250,0);} }
        @keyframes ebBlink { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.9);} 70%{box-shadow:0 0 0 7px rgba(255,255,255,0);} }
        @keyframes ebGlow { 0%,100%{box-shadow:0 0 0 1px rgba(180,107,255,.25),0 0 40px rgba(180,107,255,.3),0 0 80px rgba(139,92,246,.2),inset 0 0 30px rgba(180,107,255,.08);} 50%{box-shadow:0 0 0 1px rgba(180,107,255,.35),0 0 55px rgba(180,107,255,.45),0 0 100px rgba(139,92,246,.3),inset 0 0 30px rgba(180,107,255,.12);} }
        .eb-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 3px rgba(180,107,255,.3), 0 20px 50px -8px rgba(180,107,255,.7); }
        .eb-cta svg { transition: transform .2s; }
        .eb-cta:hover svg { transform: translateX(3px); }
      `}</style>
      <Container size="lg">
        <Box style={{
          position: 'relative',
          background: '#0a0612',
          borderRadius: 'clamp(20px, 2.5vw, 28px)',
          padding: isMobile ? '32px 20px 40px' : 'clamp(48px, 5.5vw, 72px)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px -20px rgba(24,24,27,.35), 0 10px 30px -10px rgba(0,0,0,.2)',
          backgroundImage: `
            radial-gradient(ellipse 700px 400px at 75% 20%, rgba(139,92,246,.22), transparent 60%),
            radial-gradient(ellipse 600px 350px at 20% 80%, rgba(217,70,239,.14), transparent 60%),
            radial-gradient(ellipse 500px 250px at 80% 90%, rgba(139,92,246,.1), transparent 60%)
          `,
        }}>
          <Box style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
            gap: isMobile ? 36 : 'clamp(36px, 5vw, 72px)',
            alignItems: 'flex-start',
          }}>
            {/* LEFT — 선착순 카운터 */}
            <Box style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : 24 }}>
              <Box style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 999,
                background: 'rgba(139,92,246,.12)',
                border: '1px solid rgba(139,92,246,.25)',
                fontSize: 12, fontWeight: 800, color: '#a78bfa',
                letterSpacing: '-0.01em', marginBottom: 18,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#a78bfa',
                  animation: 'ebPulse 1.4s infinite',
                }} />
                All-in-One Pass · Early Bird
              </Box>
              <Text style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 14 }}>
                1차 얼리버드 <b style={{ color: '#fff' }}>선착순 {total}명</b> 한정
              </Text>
              <Box style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                <Text style={{
                  fontSize: isMobile ? 72 : 'clamp(80px, 9vw, 112px)', fontWeight: 900,
                  letterSpacing: '-0.05em', lineHeight: 0.95,
                  background: 'linear-gradient(180deg,#fff 0%,#a78bfa 100%)',
                  WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                  textShadow: '0 0 40px rgba(139,92,246,.35)',
                  fontVariantNumeric: 'tabular-nums',
                }}>{remaining}</Text>
                <Text style={{
                  fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#a78bfa',
                  letterSpacing: '-0.02em',
                }}>
                  자리 남음
                </Text>
              </Box>
              <Box style={{
                width: '100%', height: 10, borderRadius: 999,
                background: 'rgba(255,255,255,.08)',
                border: '1px solid rgba(255,255,255,.1)',
                overflow: 'hidden', marginBottom: 14,
              }}>
                <Box style={{
                  width: `${claimedPct}%`, height: '100%',
                  background: 'linear-gradient(90deg,#8b5cf6,#d946ef)',
                  boxShadow: '0 0 12px rgba(180,107,255,.6)',
                  transition: 'width 600ms ease',
                }} />
              </Box>
              <Text style={{ fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', marginBottom: 18, letterSpacing: '-0.01em' }}>
                {claimed}명 신청 완료 · 전체 {total}석 중 {claimedPct}%
              </Text>
              <Text style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 600, color: 'rgba(255,255,255,.78)', lineHeight: 1.55 }}>
                {isUrgent ? (
                  <>자리 <b style={{ color: '#fca5a5', fontWeight: 800 }}>마감 임박</b>. 마감되면 다음 대기자는 2차 혜택으로 넘어갑니다.</>
                ) : (
                  <>1차 마감되면 2차 얼리버드로 전환됩니다.<br />
                  <b style={{ color: '#fff', fontWeight: 800 }}>보너스 크레딧이 절반</b>으로 줄어들고, 그 이후엔 <b style={{ color: '#fff', fontWeight: 800 }}>정가 599,000원</b>으로 복귀합니다.</>
                )}
              </Text>
              <Box style={{
                marginTop: 24, padding: isMobile ? '16px 18px' : '20px 22px',
                background: 'rgba(139,92,246,.1)',
                border: '1px solid rgba(139,92,246,.3)',
                borderRadius: 18,
              }}>
                <Text style={{ fontSize: 11, fontWeight: 800, color: '#a78bfa', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
                  Now · 현재 1차 혜택
                </Text>
                <Text style={{ fontSize: isMobile ? 26 : 'clamp(26px, 3.4vw, 34px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff' }}>
                  총 <span style={{ color: '#a78bfa' }}>178,000원</span> 상당
                </Text>
                <Text style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>
                  할인 100,000원 + 보너스 크레딧 78,000원 상당
                </Text>
              </Box>
            </Box>

            {/* RIGHT — Tier Stack */}
            <Box style={{ display: 'flex', flexDirection: 'column' }}>
              <EbTier
                stageNum="01" status="live" statusText={`LIVE · 선착순 ${EARLYBIRD_TIER1_TOTAL}명 한정`}
                tierName={<>1차 <em style={{ fontStyle: 'normal', color: '#a78bfa' }}>얼리버드</em></>}
                feats={[
                  { ok: true, text: <><b>정가 대비 100,000원 할인</b> · 499,000원</> },
                  { ok: true, text: <><b>보너스 크레딧 78,000원 상당</b> 즉시 지급 (Pro 2개월분)</> },
                  { ok: true, text: <>지급된 크레딧은 <b>만료 없이 영구 보존</b></> },
                ]}
                bonusText={<>+ 보너스 <b>78,000원 상당</b></>}
                priceStrike="정가 599,000원" priceNow="499,000원"
                variant="active" isMobile={isMobile}
              />
              <EbChevron />
              <EbTier
                stageNum="02" status="wait" statusText={`1차 마감 후 시작 · 선착순 ${EARLYBIRD_TIER2_TOTAL}명`}
                tierName="2차 얼리버드"
                feats={[
                  { ok: true, text: <>정가 대비 100,000원 할인 · 499,000원</> },
                  { ok: true, text: <>보너스 크레딧 <b>39,000원 상당</b> 지급 (1차 대비 축소)</> },
                  { ok: true, text: <>지급된 크레딧은 만료 없이 보존</> },
                ]}
                bonusText={<>+ 보너스 <b>39,000원 상당</b></>}
                priceStrike="정가 599,000원" priceNow="499,000원"
                variant="dim" isMobile={isMobile}
              />
              <EbChevron />
              <EbTier
                stageNum="03" status="end" statusText="종료 · 가격 인상"
                tierName="얼리버드 종료"
                feats={[
                  { ok: false, muted: true, text: <><b>할인 종료</b> — 정가 599,000원으로 복귀</> },
                  { ok: false, muted: true, text: <><b>보너스 크레딧 지급 없음</b></> },
                  { ok: false, muted: true, text: <>기본 구성만 제공</> },
                ]}
                bonusText={<>보너스 없음</>}
                priceNow="599,000원" priceUp="+100,000원 인상"
                variant="end" isMobile={isMobile}
              />
              <Box style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                <Link href="/checkout/allinone" style={{ textDecoration: 'none' }}>
                  <button className="eb-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: isMobile ? '18px 36px' : '20px 44px',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: isMobile ? 16 : 17, fontWeight: 900, letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
                    color: '#fff', borderRadius: 999,
                    boxShadow: '0 0 0 3px rgba(180,107,255,.2), 0 14px 40px -8px rgba(180,107,255,.6)',
                    transition: 'all .2s ease',
                  }}>
                    지금 1차 얼리버드로 신청하기
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function EarlyBirdSection({ earlybirdSummary }: { earlybirdSummary: LandingEarlybirdSummary }) {
  const isMobile = useIsMobile(900);
  const earlybird = getActiveEarlybirdView(earlybirdSummary);
  const total = earlybird.total;
  const phase1IsLive = earlybird.currentTier === 'phase1';
  const phase2IsLive = earlybird.currentTier === 'phase2';
  const earlybirdEnded = earlybird.currentTier === 'ended';
  const currentStageLabel = phase1IsLive
    ? '1차 얼리버드'
    : phase2IsLive
      ? '2차 얼리버드'
      : '얼리버드 종료';
  const ctaText = phase1IsLive
    ? '지금 1차 얼리버드로 신청하기'
    : phase2IsLive
      ? '지금 2차 얼리버드로 신청하기'
      : '정가로 신청하기';
  const stage1Status: EbTierProps['status'] = phase1IsLive ? 'urgent' : 'end';
  const stage1StatusText = phase1IsLive
    ? '마감 임박'
    : '1차 혜택 종료';
  const stage1Variant: EbTierProps['variant'] = phase1IsLive ? 'active' : 'dim';
  const stage2Status: EbTierProps['status'] = phase1IsLive ? 'wait' : phase2IsLive ? 'live' : 'end';
  const stage2StatusText = phase1IsLive
    ? '1차 마감 후 시작'
    : phase2IsLive
      ? 'LIVE · 진행 중'
      : '2차 혜택 종료';
  const stage2Variant: EbTierProps['variant'] = phase1IsLive ? 'dim' : phase2IsLive ? 'active' : 'dim';
  const stage3Status: EbTierProps['status'] = earlybirdEnded ? 'live' : 'end';
  const stage3StatusText = earlybirdEnded ? 'LIVE · 정가 신청 진행 중' : '종료 · 가격 인상';
  const stage3Variant: EbTierProps['variant'] = earlybirdEnded ? 'active' : 'end';
  const monthlyNote = `12개월 할부 시 월 ${Math.ceil(primaryProgram.amount / 12).toLocaleString()}원`;
  const monthlyNoteEnd = `12개월 할부 시 월 ${Math.ceil(599000 / 12).toLocaleString()}원`;
  const slotGuide = earlybirdEnded
    ? '얼리버드 혜택은 종료되었고, 지금은 정가 신청만 가능합니다.'
    : phase1IsLive
      ? `1차는 선착순 ${total}명 한정이며, 마감 시 2차 얼리버드로 전환됩니다.`
      : `2차는 선착순 ${total}명 한정이며, 마감 시 얼리버드 혜택이 종료됩니다.`;

  return (
    <Box component="section" id="earlybird" style={{
      background: '#0a0a0f',
      padding: 'clamp(16px, 2.5vw, 28px) 0 clamp(56px, 9vw, 110px)',
    }}>
      <style>{`
        @keyframes ebPulse { 0%,100%{box-shadow:0 0 0 0 rgba(167,139,250,.7);} 70%{box-shadow:0 0 0 10px rgba(167,139,250,0);} }
        @keyframes ebBlink { 0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.9);} 70%{box-shadow:0 0 0 7px rgba(255,255,255,0);} }
        @keyframes ebGlow { 0%,100%{box-shadow:0 0 0 1px rgba(180,107,255,.25),0 0 40px rgba(180,107,255,.3),0 0 80px rgba(139,92,246,.2),inset 0 0 30px rgba(180,107,255,.08);} 50%{box-shadow:0 0 0 1px rgba(180,107,255,.35),0 0 55px rgba(180,107,255,.45),0 0 100px rgba(139,92,246,.3),inset 0 0 30px rgba(180,107,255,.12);} }
        .eb-cta:hover { transform: translateY(-2px); box-shadow: 0 0 0 3px rgba(180,107,255,.3), 0 20px 50px -8px rgba(180,107,255,.7); }
        .eb-cta svg { transition: transform .2s; }
        .eb-cta:hover svg { transform: translateX(3px); }
      `}</style>
      <Container size="lg">
        <Box style={{
          position: 'relative',
          background: '#0a0612',
          borderRadius: 'clamp(20px, 2.5vw, 28px)',
          padding: isMobile ? '32px 20px 40px' : 'clamp(48px, 5.5vw, 72px)',
          overflow: 'hidden',
          boxShadow: '0 30px 80px -20px rgba(24,24,27,.35), 0 10px 30px -10px rgba(0,0,0,.2)',
          backgroundImage: `
            radial-gradient(ellipse 700px 400px at 75% 20%, rgba(139,92,246,.22), transparent 60%),
            radial-gradient(ellipse 600px 350px at 20% 80%, rgba(217,70,239,.14), transparent 60%),
            radial-gradient(ellipse 500px 250px at 80% 90%, rgba(139,92,246,.1), transparent 60%)
          `,
        }}>
          <Box style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1.2fr',
            gap: isMobile ? 36 : 'clamp(36px, 5vw, 72px)',
            alignItems: 'flex-start',
          }}>
            <Box style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 0 : 24 }}>
              <Box style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '7px 14px', borderRadius: 999,
                background: 'rgba(139,92,246,.12)',
                border: '1px solid rgba(139,92,246,.25)',
                fontSize: 12, fontWeight: 800, color: '#a78bfa',
                letterSpacing: '-0.01em', marginBottom: 18,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#a78bfa',
                  animation: 'ebPulse 1.4s infinite',
                }} />
                All-in-One Pass · {currentStageLabel}
              </Box>
              <Text style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.7)', marginBottom: 14 }}>
                {currentStageLabel} · <b style={{ color: '#fff' }}>선착순 모집</b>
              </Text>
              <Box style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 18 }}>
                {earlybirdEnded ? (
                  <Text style={{
                    fontSize: isMobile ? 36 : 48,
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    lineHeight: 1,
                    color: '#fff',
                  }}>
                    혜택 종료
                  </Text>
                ) : (
                  <>
                    <Text style={{
                      fontSize: isMobile ? 72 : 'clamp(80px, 9vw, 112px)', fontWeight: 900,
                      letterSpacing: '-0.05em', lineHeight: 0.95,
                      background: 'linear-gradient(180deg,#fff 0%,#a78bfa 100%)',
                      WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                      textShadow: '0 0 40px rgba(139,92,246,.35)',
                      fontVariantNumeric: 'tabular-nums',
                    }}>{total}</Text>
                    <Text style={{
                      fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#a78bfa',
                      letterSpacing: '-0.02em',
                    }}>
                      명 선착순
                    </Text>
                  </>
                )}
              </Box>
              <Text style={{ fontSize: isMobile ? 13.5 : 14.5, fontWeight: 600, color: 'rgba(255,255,255,.78)', lineHeight: 1.55, wordBreak: 'keep-all' }}>
                {slotGuide}
              </Text>
            </Box>

            <Box style={{ display: 'flex', flexDirection: 'column' }}>
              <EbTier
                stageNum="01" status={stage1Status} statusText={stage1StatusText}
                tierName={<>1차<em style={{ fontStyle: 'normal', color: '#a78bfa' }}> 얼리버드</em></>}
                feats={[
                  { ok: true, text: <><b>정가 대비 100,000원 할인</b> · 499,000원</> },
                  { ok: true, text: <>
                    <b>보너스 크레딧 800cr</b> 즉시 지급
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#a78bfa', marginTop: 3 }}>
                      78,000원 상당
                    </span>
                  </> },
                  { ok: true, text: <>지급된 크레딧은 <b>만료 없이 영구 보존</b></> },
                ]}
                bonusText={<>총 <b>178,000원</b> 혜택</>}
                priceStrike="정가 599,000원" priceNow="499,000원" priceNote={monthlyNote}
                variant={stage1Variant} isMobile={isMobile}
              />
              <EbChevron />
              <EbTier
                stageNum="02" status={stage2Status} statusText={stage2StatusText}
                tierName="2차 얼리버드"
                feats={[
                  { ok: true, text: <>정가 대비 100,000원 할인 · 499,000원</> },
                  { ok: true, text: <>
                    보너스 크레딧 <b>400cr</b> 지급
                    <span style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: '#a78bfa', marginTop: 3 }}>
                      39,000원 상당
                    </span>
                  </> },
                  { ok: true, text: <>지급된 크레딧은 만료 없이 보존</> },
                ]}
                bonusText={<>총 <b>139,000원</b> 혜택</>}
                priceStrike="정가 599,000원" priceNow="499,000원" priceNote={monthlyNote}
                variant={stage2Variant} isMobile={isMobile}
              />
              <EbChevron />
              <EbTier
                stageNum="03" status={stage3Status} statusText={stage3StatusText}
                tierName="얼리버드 종료"
                feats={[
                  { ok: false, muted: true, text: <><b>추가 보너스 크레딧 지급 없음</b></> },
                  { ok: false, muted: true, text: <>기본 구성으로만 신청 가능</> },
                  { ok: false, muted: true, text: <>기본 제공 크레딧과 강의 구성은 동일</> },
                ]}
                bonusText={<>보너스 없음</>}
                priceNow="599,000원" priceNote={monthlyNoteEnd}
                variant={stage3Variant} isMobile={isMobile}
              />
              <Box style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
                <Link href="/checkout/allinone" style={{ textDecoration: 'none' }}>
                  <button className="eb-cta" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10,
                    padding: isMobile ? '18px 36px' : '20px 44px',
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: isMobile ? 16 : 17, fontWeight: 900, letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
                    color: '#fff', borderRadius: 999,
                    boxShadow: '0 0 0 3px rgba(180,107,255,.2), 0 14px 40px -8px rgba(180,107,255,.6)',
                    transition: 'all .2s ease',
                  }}>
                    {ctaText}
                    <ArrowRight size={20} />
                  </button>
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

function EbChevron() {
  return (
    <Box style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 96 }}>
      <ChevronDown size={30} color="rgba(255,255,255,.45)" />
    </Box>
  );
}

type EbTierProps = {
  stageNum: string;
  status: 'live' | 'wait' | 'end' | 'urgent';
  statusText: string;
  tierName: React.ReactNode;
  feats: { ok: boolean; text: React.ReactNode; muted?: boolean }[];
  bonusText: React.ReactNode;
  priceStrike?: string;
  priceNow: string;
  priceNote?: string;
  priceUp?: string;
  variant: 'active' | 'dim' | 'end';
  isMobile: boolean;
};

function EbTier(p: EbTierProps) {
  const base: React.CSSProperties = {
    position: 'relative',
    background: 'linear-gradient(180deg,rgba(24,20,34,.9),rgba(18,15,26,.9))',
    border: '1px solid rgba(255,255,255,.14)',
    borderRadius: 22,
    padding: p.isMobile ? '24px 20px' : '30px 34px',
    backdropFilter: 'blur(10px)',
  };
  const variantStyle: React.CSSProperties =
    p.variant === 'active' ? {
      background: 'linear-gradient(180deg,rgba(40,22,70,.55),rgba(24,20,34,.7))',
      border: '2px solid #b46bff',
      animation: 'ebGlow 2.8s ease-in-out infinite',
    } : p.variant === 'dim' ? {
      background: 'linear-gradient(180deg,rgba(24,20,34,.55),rgba(18,15,26,.55))',
      border: '1px solid rgba(255,255,255,.12)',
    } : {
      background: 'linear-gradient(180deg,rgba(24,20,34,.4),rgba(18,15,26,.4))',
      border: '1px solid rgba(255,255,255,.09)',
    };
  const statusStyle: React.CSSProperties =
    p.status === 'live' ? { background: '#b46bff', color: '#fff', boxShadow: '0 0 20px rgba(180,107,255,.5), 0 0 0 3px rgba(180,107,255,.2)' } :
    p.status === 'urgent' ? { background: '#f59e0b', color: '#fff', boxShadow: '0 0 20px rgba(245,158,11,.55), 0 0 0 3px rgba(245,158,11,.2)' } :
    p.status === 'wait' ? { background: 'rgba(255,255,255,.06)', color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.1)' } :
    { background: 'rgba(239,68,68,.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.25)' };
  const bonusStyle: React.CSSProperties =
    p.variant === 'active' ? {
      background: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
      color: '#fff', boxShadow: '0 8px 20px -4px rgba(180,107,255,.5)',
    } : p.variant === 'dim' ? {
      background: 'rgba(139,92,246,.12)', color: '#a78bfa',
      border: '1px solid rgba(139,92,246,.25)',
    } : {
      background: 'transparent', color: 'rgba(255,255,255,.3)',
      border: '1.5px dashed rgba(255,255,255,.15)',
    };

  return (
    <Box style={{ ...base, ...variantStyle }}>
      <Box style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 26, height: 26, borderRadius: 7,
          background: p.variant === 'active' ? '#b46bff' : 'rgba(255,255,255,.06)',
          color: p.variant === 'active' ? '#fff' : 'rgba(255,255,255,.5)',
          fontSize: 11, fontWeight: 900,
          boxShadow: p.variant === 'active' ? '0 0 16px rgba(180,107,255,.7)' : 'none',
        }}>{p.stageNum}</span>
        <span style={{ color: 'rgba(255,255,255,.55)', fontWeight: 700, letterSpacing: '-0.01em', fontSize: 11.5 }}>
          STAGE {p.stageNum} / 03
        </span>
        <span style={{
          marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          fontSize: 10.5, fontWeight: 900, letterSpacing: '.06em',
          ...statusStyle,
        }}>
          {(p.status === 'live' || p.status === 'urgent') && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#fff',
              animation: 'ebBlink 1.2s infinite',
            }} />
          )}
          {p.statusText}
        </span>
      </Box>

      <Box style={{
        display: 'grid',
        gridTemplateColumns: p.isMobile ? '1fr' : '1.2fr auto',
        gap: p.isMobile ? 14 : 20,
        alignItems: 'flex-start',
      }}>
        <Box>
          <Box style={{
            fontSize: p.isMobile ? 22 : 'clamp(24px, 2.6vw, 28px)', fontWeight: 900, letterSpacing: '-0.03em',
            color: p.variant === 'end' ? 'rgba(255,255,255,.6)' : p.variant === 'dim' ? 'rgba(255,255,255,.82)' : '#fff',
            lineHeight: 1.1, marginBottom: 14,
          }}>{p.tierName}</Box>
          <Box component="ul" style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            {p.feats.map((f, i) => (
              <Box component="li" key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                fontSize: p.isMobile ? 13 : 13.5, fontWeight: 600,
                color: f.muted ? 'rgba(255,255,255,.55)' : (p.variant === 'end' ? 'rgba(255,255,255,.6)' : p.variant === 'dim' ? 'rgba(255,255,255,.75)' : 'rgba(255,255,255,.88)'),
                lineHeight: 1.5,
              }}>
                <span style={{
                  width: 19, height: 19, flexShrink: 0, marginTop: 2,
                  borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 900,
                  background: f.ok ? 'rgba(167,139,250,.2)' : 'rgba(239,68,68,.15)',
                  color: f.ok ? '#a78bfa' : '#fca5a5',
                }}>{f.ok ? '✓' : '✕'}</span>
                <span>{f.text}</span>
              </Box>
            ))}
          </Box>
          <Box style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '9px 15px', borderRadius: 999,
            fontSize: 13, fontWeight: 800, letterSpacing: '-0.01em',
            marginTop: 20, whiteSpace: 'nowrap',
            ...bonusStyle,
          }}>{p.bonusText}</Box>
        </Box>
        <Box style={{ textAlign: p.isMobile ? 'left' : 'right', minWidth: p.isMobile ? undefined : 150 }}>
          {p.priceStrike && (
            <Text style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,.55)', textDecoration: 'line-through', letterSpacing: '-0.01em', marginBottom: 4 }}>
              {p.priceStrike}
            </Text>
          )}
          <Text style={{
            fontSize: p.isMobile ? 26 : 'clamp(24px, 3vw, 30px)', fontWeight: 900, letterSpacing: '-0.035em',
            color: p.variant === 'end' ? '#fca5a5' : p.variant === 'dim' ? 'rgba(255,255,255,.82)' : '#fff',
            lineHeight: 1,
            textShadow: p.variant === 'active' ? '0 0 24px rgba(180,107,255,.6)' : 'none',
          }}>{p.priceNow}</Text>
          {p.priceNote && (
            <Text style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,.65)', marginTop: 6, letterSpacing: '-0.01em' }}>
              {p.priceNote}
            </Text>
          )}
          {p.priceUp && (
            <Box style={{
              display: 'inline-block', marginTop: 8,
              fontSize: 11, fontWeight: 900, letterSpacing: '-0.01em',
              background: '#ef4444', color: '#fff',
              padding: '3px 8px', borderRadius: 6,
            }}>{p.priceUp}</Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════════════════ */
export default function LandingPage({ initialSummary }: { initialSummary: LandingEarlybirdSummary }) {
  const earlybirdSummary = useLandingEarlybirdSummary(initialSummary);

  return (
    <main style={{ background: '#ffffff' }}>
      <MarketingTracker pageType="landing" />
      <LandingHeader />
      <HeroSection />
      <EarlyBirdSection earlybirdSummary={earlybirdSummary} />
      <LoopPainSection />
      <PainSection />
      <ProductRevealSection />
      <WhySpecialSection />
      <HowItWorksSection />
      <FAQSection />
      <Footer />
      <FloatingCTA earlybirdSummary={earlybirdSummary} />
    </main>
  );
}
