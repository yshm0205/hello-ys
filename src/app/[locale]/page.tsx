'use client';

/**
 * FlowSpot 랜딩 페이지 — 리디자인 Phase 1
 * 디자인: 순백 배경 + violet(#8b5cf6) 액센트
 * 모바일/데스크톱 동일 레이아웃 (가로 스크롤)
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
import { Check, X, Bot } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { motion } from 'framer-motion';


// ============================================================
// 섹션 1: Hero — 최단거리 포지셔닝
// ============================================================
function HeroSection() {
  return (
    <Box component="section" style={{ background: '#fff', paddingTop: '140px', paddingBottom: '80px' }}>
      <Container size="sm">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <Stack align="center" gap="lg">
            <Text ta="center" size="lg" style={{ color: '#6b7280' }}>
              지금부터 소개해드리는 이 길이,
            </Text>
            <Title
              order={1}
              ta="center"
              style={{
                fontSize: 'clamp(32px, 5vw, 52px)',
                fontWeight: 800,
                color: '#111827',
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              쇼츠 <span style={{ color: '#8b5cf6' }}>월 300</span>까지의
              <br />
              최단거리입니다
            </Title>
            <Text ta="center" style={{ color: '#6b7280', fontSize: '18px', maxWidth: '480px' }}>
              뭘 해야 하는지 알려주고, AI가 대신 실행합니다
            </Text>

            {/* 배지 */}
            <Group gap="sm" justify="center" mt="xs">
              <Badge
                size="lg"
                variant="light"
                color="violet"
                radius="xl"
                style={{ padding: '10px 20px', fontSize: '15px' }}
              >
                📚 VOD 59강
              </Badge>
              <Badge
                size="lg"
                variant="light"
                color="violet"
                radius="xl"
                style={{ padding: '10px 20px', fontSize: '15px' }}
              >
                🤖 AI 스크립트
              </Badge>
            </Group>

            {/* CTA */}
            <Button
              component={Link}
              href="/dashboard"
              size="lg"
              radius="xl"
              mt="md"
              style={{
                background: '#8b5cf6',
                fontSize: '18px',
                fontWeight: 700,
                padding: '14px 48px',
                height: 'auto',
              }}
            >
              무료로 시작하기
            </Button>
            <Text size="sm" style={{ color: '#9ca3af' }}>
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
    },
    {
      emoji: '💸',
      title: '강의 들어봤는데',
      line1: '수십만 원 썼는데',
      line2: '돌아온 건 "노력 부족"',
    },
    {
      emoji: '🤖',
      title: 'AI 써봤는데',
      line1: '쇼츠 공식 모르는 AI',
      line2: '조회수 안 나옴',
    },
  ];

  return (
    <Box component="section" py={80} style={{ background: '#f9fafb' }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '40px',
            }}
          >
            그런데 대부분은 이 길을{' '}
            <span style={{ color: '#ef4444' }}>돌아가고</span> 있습니다
          </Title>

          {/* 3카드 — 가로 고정, 모바일 스크롤 */}
          <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Box style={{ display: 'flex', gap: '20px', minWidth: '760px' }}>
              {pains.map((p, i) => (
                <Paper
                  key={i}
                  p="xl"
                  radius="lg"
                  style={{
                    flex: '1 1 0',
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                  }}
                >
                  <Text style={{ fontSize: '44px', marginBottom: '16px' }}>{p.emoji}</Text>
                  <Text fw={700} style={{ fontSize: '17px', color: '#111827', marginBottom: '10px' }}>
                    {p.title}
                  </Text>
                  <Text style={{ fontSize: '15px', color: '#6b7280', lineHeight: 1.6 }}>
                    {p.line1}
                    <br />
                    {p.line2}
                  </Text>
                </Paper>
              ))}
            </Box>
          </Box>

          <Text ta="center" style={{ color: '#9ca3af', fontSize: '15px', marginTop: '32px' }}>
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
    <Box component="section" py={80} style={{ background: '#fff' }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Stack align="center" gap="xl">
            <Title
              order={2}
              ta="center"
              style={{
                fontSize: 'clamp(24px, 4vw, 36px)',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              저도 돌아가는 길 다 걸어봤습니다
            </Title>

            {/* 수익 캡처 그리드: 3 + 2 — 가로 고정 */}
            <Box style={{ width: '100%', maxWidth: '900px' }}>
              {/* Row 1: 3 */}
              <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Box style={{ display: 'flex', gap: '16px', minWidth: '700px', marginBottom: '16px' }}>
                  {revenues.slice(0, 3).map((r, i) => (
                    <Paper
                      key={i}
                      p="lg"
                      radius="lg"
                      style={{
                        flex: '1 1 0',
                        background: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        style={{
                          height: '100px',
                          background: '#e5e7eb',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <Text size="xs" style={{ color: '#9ca3af' }}>수익 캡처</Text>
                      </Box>
                      <Text size="sm" fw={500} style={{ color: '#6b7280' }}>{r.label}</Text>
                      <Text fw={800} style={{ fontSize: '22px', color: r.color }}>{r.amount}</Text>
                    </Paper>
                  ))}
                </Box>
              </Box>

              {/* Row 2: 2 */}
              <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Box style={{ display: 'flex', gap: '16px', minWidth: '480px', justifyContent: 'center' }}>
                  {revenues.slice(3).map((r, i) => (
                    <Paper
                      key={i}
                      p="lg"
                      radius="lg"
                      style={{
                        flex: '0 1 280px',
                        background: '#f9fafb',
                        border: '1px dashed #d1d5db',
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        style={{
                          height: '100px',
                          background: '#e5e7eb',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <Text size="xs" style={{ color: '#9ca3af' }}>수익 캡처</Text>
                      </Box>
                      <Text size="sm" fw={500} style={{ color: '#6b7280' }}>{r.label}</Text>
                      <Text fw={800} style={{ fontSize: '22px', color: r.color }}>{r.amount}</Text>
                    </Paper>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* 브릿지 텍스트 */}
            <Stack align="center" gap="md" mt="xl">
              <Text
                ta="center"
                style={{
                  fontSize: 'clamp(18px, 3vw, 24px)',
                  fontWeight: 700,
                  color: '#111827',
                }}
              >
                분야가 달라도 통하는 공식이 있었습니다
              </Text>
              <Text ta="center" style={{ fontSize: '16px', color: '#6b7280', maxWidth: '500px', lineHeight: 1.7 }}>
                체계화한 뒤, 채널 1개 주 4시간으로 월 200-300
              </Text>
              <Text
                ta="center"
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#8b5cf6',
                }}
              >
                그 체계가 59강 강의와 AI 스크립트 도구입니다
              </Text>
            </Stack>
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
  const paths = [
    {
      question: '처음 시작이에요',
      icon: '🌱',
      label: '입문',
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.08)',
      borderColor: 'rgba(139, 92, 246, 0.3)',
      includes: ['전자책', 'VOD 59강', 'AI 스크립트 6개월'],
    },
    {
      question: '하고 있는데\n성장이 안돼요',
      icon: '📈',
      label: '성장',
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.08)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      includes: ['채널 리스트', 'AI 스크립트', 'VOD 59강'],
    },
    {
      question: '혼자 하려니\n힘들어요',
      icon: '⚙️',
      label: '시스템화',
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.08)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
      includes: ['노션 템플릿', 'AI 스크립트', '채널 리스트'],
    },
  ];

  return (
    <Box component="section" py={80} style={{ background: '#f9fafb' }}>
      <Container size="lg">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Title
            order={2}
            ta="center"
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 700,
              color: '#111827',
              marginBottom: '48px',
            }}
          >
            지금 어디에 계신가요?
          </Title>

          {/* 3경로 — 가로 고정, 모바일 스크롤 */}
          <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Box style={{ display: 'flex', gap: '20px', minWidth: '760px' }}>
              {paths.map((path, i) => (
                <Paper
                  key={i}
                  p="xl"
                  radius="lg"
                  style={{
                    flex: '1 1 0',
                    background: '#fff',
                    border: `2px solid ${path.borderColor}`,
                    textAlign: 'center',
                  }}
                >
                  <Stack align="center" gap="md">
                    {/* 질문 */}
                    <Box
                      style={{
                        background: path.bgColor,
                        borderRadius: '12px',
                        padding: '20px',
                        width: '100%',
                      }}
                    >
                      <Text style={{ fontSize: '36px', marginBottom: '8px' }}>{path.icon}</Text>
                      <Text
                        fw={600}
                        style={{
                          fontSize: '15px',
                          color: '#374151',
                          whiteSpace: 'pre-line',
                          lineHeight: 1.5,
                        }}
                      >
                        &ldquo;{path.question}&rdquo;
                      </Text>
                    </Box>

                    {/* 화살표 */}
                    <Text style={{ fontSize: '24px', color: path.color }}>↓</Text>

                    {/* 결과 배지 */}
                    <Badge
                      size="xl"
                      variant="filled"
                      style={{
                        background: path.color,
                        fontSize: '16px',
                        fontWeight: 700,
                        padding: '10px 28px',
                        height: 'auto',
                      }}
                    >
                      {path.label}
                    </Badge>

                    {/* 포함 항목 */}
                    <Stack gap="xs" align="center">
                      {path.includes.map((item, j) => (
                        <Group key={j} gap="xs" justify="center">
                          <Check size={14} color={path.color} />
                          <Text size="sm" style={{ color: '#4b5563' }}>{item}</Text>
                        </Group>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* 하단 CTA */}
          <Stack align="center" gap="md" mt={48}>
            <Text
              ta="center"
              style={{
                fontSize: 'clamp(20px, 3vw, 28px)',
                fontWeight: 700,
                color: '#111827',
              }}
            >
              어떤 단계든, <span style={{ color: '#8b5cf6' }}>올인원 하나</span>면 됩니다
            </Text>
            <Button
              component={Link}
              href="/dashboard"
              size="lg"
              radius="xl"
              style={{
                background: '#8b5cf6',
                fontSize: '16px',
                fontWeight: 700,
                padding: '12px 36px',
                height: 'auto',
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


// ============================================================
// 섹션 5~10: Phase 2 (기존 콘텐츠, 화이트 테마 전환)
// ============================================================

function PackageSection() {
  return (
    <Box component="section" py={80} style={{ background: '#fff' }}>
      <Container size="lg">
        <Title order={2} ta="center" style={{ color: '#111827', fontSize: '36px', marginBottom: '16px' }}>
          왜 이 가격인가요?
        </Title>
        <Text ta="center" style={{ color: '#6b7280', marginBottom: '48px', fontSize: '16px' }}>
          비싼 강의 vs 올인원 패스
        </Text>

        {/* 비교 — 가로 고정 */}
        <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: '48px' }}>
          <Box style={{ display: 'flex', gap: '24px', minWidth: '700px', justifyContent: 'center' }}>
            {/* 일반 유료 강의 */}
            <Paper
              p="xl"
              radius="lg"
              style={{
                flex: '1 1 0',
                maxWidth: '400px',
                border: '1px solid #fecaca',
                background: '#fff',
              }}
            >
              <Group mb="xl" gap="sm">
                <X size={24} color="#ef4444" />
                <Text fw={700} style={{ fontSize: '20px', color: '#ef4444' }}>일반 유료 강의</Text>
              </Group>
              <Stack gap="md">
                {[
                  '가격 99~160만원',
                  '강의만 제공 (실행은 알아서)',
                  '기간 제한 (100일, 기수제)',
                  '대본은 직접 써야 함',
                  'AI 도구 없음',
                ].map((t, i) => (
                  <Group key={i} gap="sm">
                    <X size={16} color="#ef4444" />
                    <Text style={{ color: '#6b7280', fontSize: '15px' }}>{t}</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>

            {/* 올인원 패스 */}
            <Paper
              p="xl"
              radius="lg"
              style={{
                flex: '1 1 0',
                maxWidth: '400px',
                border: '2px solid #8b5cf6',
                background: '#faf5ff',
              }}
            >
              <Group mb="xl" gap="sm">
                <Check size={24} color="#22c55e" />
                <Text fw={700} style={{ fontSize: '20px', color: '#111827' }}>올인원 패스</Text>
                <Badge color="violet" size="md">추천</Badge>
              </Group>
              <Stack gap="md">
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
          p="xl"
          radius="lg"
          style={{
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          <Title order={3} ta="center" style={{ fontSize: '22px', color: '#111827', marginBottom: '32px' }}>
            뭐가 들어있나요?
          </Title>
          <Stack gap="lg">
            {[
              { item: '강의 59강 (기획→촬영→수익화)', value: '₩590,000' },
              { item: 'AI 스크립트 도구 6개월', value: '₩600,000' },
              { item: '채널 분석 피드백', value: '₩100,000' },
              { item: '보너스: 터진 영상 템플릿', value: '₩100,000' },
            ].map((row, i) => (
              <Group key={i} justify="space-between" style={{ borderBottom: '1px dashed #d1d5db', paddingBottom: '12px' }}>
                <Text style={{ color: '#374151', fontSize: '15px' }}>{row.item}</Text>
                <Text fw={600} style={{ color: '#8b5cf6', fontSize: '16px' }}>{row.value}</Text>
              </Group>
            ))}
          </Stack>
          <Divider my="lg" color="#e5e7eb" />
          <Group justify="space-between" align="center">
            <Text fw={700} style={{ color: '#9ca3af', fontSize: '16px', textDecoration: 'line-through' }}>
              총 가치: ₩1,390,000
            </Text>
            <Group gap="md" align="center">
              <Text fw={800} style={{ fontSize: '28px', color: '#22c55e' }}>₩500,000</Text>
              <Badge color="red" size="lg">64% 할인</Badge>
            </Group>
          </Group>
        </Paper>

        {/* 직원 비유 */}
        <Paper
          p="xl"
          radius="lg"
          style={{
            background: '#faf5ff',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '40px auto 0',
          }}
        >
          <Text fw={700} style={{ fontSize: '20px', color: '#111827', marginBottom: '20px' }}>
            이렇게 생각해보세요
          </Text>
          <Box style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Group justify="center" gap="xl" wrap="nowrap" style={{ minWidth: '400px' }}>
              <Stack gap={4} align="center">
                <Text style={{ fontSize: '14px', color: '#6b7280' }}>스크립트 작가 1명</Text>
                <Text fw={800} style={{ fontSize: '24px', color: '#111827' }}>월 200만원</Text>
              </Stack>
              <Text style={{ fontSize: '24px', color: '#d1d5db' }}>vs</Text>
              <Stack gap={4} align="center">
                <Text style={{ fontSize: '14px', color: '#6b7280' }}>AI 스크립트 6개월</Text>
                <Text fw={800} style={{ fontSize: '24px', color: '#8b5cf6' }}>50만원</Text>
              </Stack>
            </Group>
          </Box>
          <Text style={{ marginTop: '20px', fontSize: '16px', color: '#6b7280' }}>
            = <b style={{ color: '#111827' }}>월 4만원</b> = 커피 10잔 값
          </Text>
        </Paper>
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
    <Box component="section" py={80} style={{ background: '#f9fafb' }} id="faq">
      <Container size="md">
        <Title order={2} ta="center" style={{ color: '#111827', marginBottom: '32px' }}>
          FAQ
        </Title>
        <Accordion
          variant="separated"
          styles={{
            item: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px' },
            control: { color: '#111827' },
            panel: { color: '#6b7280' },
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
    <Box component="section" py={80} style={{ background: '#fff' }}>
      <Container size="md">
        <Stack align="center" gap="lg">
          <Title order={2} ta="center" style={{ color: '#111827', fontSize: '32px', lineHeight: 1.4 }}>
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
              padding: '14px 48px',
              height: 'auto',
            }}
          >
            무료로 시작하기
          </Button>
          <Text size="sm" style={{ color: '#9ca3af' }}>
            30크레딧 무료 · 7일 환불 보장
          </Text>
          <Text size="sm" style={{ color: '#9ca3af' }}>
            문의: hmys0205hmys@gmail.com
          </Text>
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
// FloatingCTA — 스크롤 시 고정 가격/CTA
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

  // 모바일: 하단 고정 바
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
          boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <Stack gap={2}>
            <Text style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through' }}>
              ₩700,000
            </Text>
            <Text style={{ fontSize: '18px', fontWeight: 800, color: '#8b5cf6' }}>₩500,000</Text>
          </Stack>
          <Button
            component={Link}
            href="/pricing"
            size="sm"
            radius="xl"
            style={{
              background: '#8b5cf6',
              fontWeight: 700,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            신청하기
          </Button>
        </Group>
      </Box>
    );
  }

  // 데스크톱: 오른쪽 사이드
  return (
    <Box
      style={{
        position: 'fixed',
        top: '50%',
        right: '20px',
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
          p="lg"
          radius="lg"
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          }}
        >
          <Stack gap="md">
            <Text fw={700} style={{ fontSize: '16px', color: '#111827' }}>
              올인원 패스
            </Text>
            <Stack gap={4}>
              <Text style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                ₩700,000
              </Text>
              <Text style={{ fontSize: '28px', fontWeight: 800, color: '#8b5cf6' }}>₩500,000</Text>
            </Stack>
            <Button
              component={Link}
              href="/pricing"
              size="md"
              fullWidth
              radius="lg"
              style={{ background: '#8b5cf6', fontWeight: 700 }}
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
