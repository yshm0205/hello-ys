'use client';

import { Fragment, useRef, useState, type MouseEvent } from 'react';
import Image from 'next/image';
import { Noto_Sans_KR } from 'next/font/google';
import { MotionConfig, motion, useScroll, useTransform } from 'framer-motion';
import { ChevronDown, ChevronRight, MessageSquareQuote, MonitorPlay, Star } from 'lucide-react';

import type { PublicMarketingReview, PublicMarketingReviewsSummary } from '@/lib/marketing/reviews';

// 헤드라인 전용 900 굵기 — 사이트 공통 Noto Sans KR은 400~700만 불러온다
const displayFont = Noto_Sans_KR({
  weight: '900',
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--fs-intro-display',
});

const ease = [0.25, 0.1, 0.25, 1] as const;

// Part 3·3강 4:56 원본 프레임 — 아래 강의 영상 자체 진행 바(17px)는 잘라내고 섹션의 스크롤 바를 쓴다
const LECTURE_SCREEN = {
  src: '/images/lecture-intro-816-native.png',
  width: 1920,
  height: 1062,
};

// 모바일에서 줄이 구(句) 중간에서 끊기지 않도록 구 단위로 나눠 둔다
const LEAD_PARAGRAPHS = [
  ['잘된 영상을', '참고해도', '내 쇼츠를', '만들 때', '막히는 분을 위한', '4개월 과정입니다.'],
  [
    '사람들이',
    '볼 수밖에 없는',
    '영상들의 특징부터',
    '소재 선정·대본·소스·편집까지',
    '실제 예시로 배웁니다.',
  ],
  [
    '배운 내용을',
    '빠르게 적용할 수 있게,',
    '트렌드 채널을 모아',
    '매달 업데이트하는',
    '핫리스트,',
    '대본 초안을',
    '작성해주는',
    'FlowSpot AI도',
    '함께 드립니다.',
  ],
];

type FeaturedReview = Pick<PublicMarketingReview, 'id' | 'rating' | 'headline' | 'content' | 'displayName'>;

// 실제 수강 후기 — student_reviews 5/8 후기(마케팅 동의·featured 1위) 원문 그대로.
// 후기 목록을 받았는데 이 후기가 없으면(동의 철회·삭제) 숨기고,
// 목록 자체를 못 받았을 때(로컬 등)만 아래 원문을 쓴다.
const FEATURED_REVIEW: FeaturedReview = {
  id: 'be4bfdb8-49d4-447f-9661-6f7d52d8f8cb',
  rating: 5,
  headline: '초보 유튜버의 든든한 등불 Flow Spot',
  content:
    "하루 30분 영상 만들고, 한달에 천만원 벌었다.\n자극적인 문구에 현혹되어 몇 백의 수강료를 지불하고 첫 수업을 듣고 나서 '이건 아니다.' 느꼈습니다.\n진정성도 없고, 무엇을 알려주는지도 불명확 했습니다. \n\n그럼에도 불구하고 채널을 잘 운영하기 위해 유튜브를 검색하던 중 우연히 Flow Spot을 알게되었습니다.\n하민님 설명에는 논리와 근거가 있었습니다. \n과학적 접근방법이였고, 믿고 따라하면 수익 창출 채널이 되어 수익이 발생할 것이라 생각되었습니다.\n그래서 초기에 수강등록하고, 열심히 수업에 참여하고 있습니다. 수강료도 크게 부담되지 않는 수준입니다. \n\n초보자에게는 선생님이 필요합니다. 초기에 이상한 스승을 만나면 이상한 결과가 나올 것입니다.\n체계적으로 채널을 운영하고 싶은 초보 유튜버에게 Flow Spot을 추천 합니다.",
  displayName: 'AMB***',
};
// 첫 화면엔 섹션 메시지('왜 잘됐는지부터')와 맞닿는 이 문장만 크게, 원문은 '후기 전체 읽기'로 펼친다
const REVIEW_HIGHLIGHT = '하민님 설명에는 논리와 근거가 있었습니다.';
// 원문 마지막 문장 — '누구에게 맞는지'를 말하는 마무리라 인용 아래 한 단계 작게 붙인다 (구 단위 줄바꿈)
const REVIEW_CLOSING = ['체계적으로', '채널을 운영하고 싶은', '초보 유튜버에게', 'Flow Spot을', '추천 합니다.'];
// 원문 첫 문단(몇 백의 수강료를 낸 강의에 실망) 요약 — 후기가 바뀌면 같이 확인
const REVIEW_CONTEXT = '다른 유료 강의를 경험한 수강생의 후기';
// 아래 다크 히어로 리뷰 미리보기에서 이 후기를 빼서 같은 후기가 두 번 보이지 않게 한다
export const INTRO_REVIEW_ID = FEATURED_REVIEW.id;

function getFeaturedReview(summary: PublicMarketingReviewsSummary): FeaturedReview | null {
  if (summary.reviews.length === 0) return FEATURED_REVIEW;
  return summary.reviews.find((item) => item.id === FEATURED_REVIEW.id) ?? null;
}

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.6, ease },
};

/* ═══════════════════════════════════════════════════════════════
   섹션 0: 강의 소개 — "왜 잘됐는지부터" + 실제 강의 화면
   ═══════════════════════════════════════════════════════════════ */
export function LectureIntroSection({ reviewSummary }: { reviewSummary: PublicMarketingReviewsSummary }) {
  const screenRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: screenRef, offset: ['start end', 'end start'] });
  // 강의 화면이 화면을 지나가는 만큼 재생 바가 찬다
  const progressScale = useTransform(scrollYProgress, [0, 1], [0.04, 1]);
  const review = getFeaturedReview(reviewSummary);
  // 핵심 문장이 원문에 없으면(후기 수정) 라벨·인용이 어긋나므로 후기 블록을 숨긴다
  const highlightAt = review ? review.content.indexOf(REVIEW_HIGHLIGHT) : -1;
  const hasClosing = review ? review.content.includes(REVIEW_CLOSING.join(' ')) : false;
  const [reviewExpanded, setReviewExpanded] = useState(false);

  // 같은 페이지 섹션으로 부드럽게 이동 (첫 버튼 → #offer 구성 섹션)
  const handleSectionLink = (event: MouseEvent<HTMLAnchorElement>) => {
    const id = event.currentTarget.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <MotionConfig reducedMotion="user">
      <section id="lecture-intro" className={`fs-intro ${displayFont.variable}`}>
        <style>{`
          .fs-intro {
            position: relative;
            overflow: hidden;
            isolation: isolate;
            background:
              radial-gradient(640px 320px at 88% 0%, rgba(139, 92, 246, 0.09), transparent 70%),
              #ffffff;
            color: #18181b;
          }
          .fs-intro::before {
            content: '';
            position: absolute;
            inset: 0;
            z-index: -1;
            background-image:
              linear-gradient(rgba(24, 24, 27, 0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(24, 24, 27, 0.045) 1px, transparent 1px);
            background-size: 56px 56px;
            background-position: center top;
            -webkit-mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 560px);
            mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 560px);
            pointer-events: none;
          }
          .fs-intro-inner {
            max-width: 768px;
            margin: 0 auto;
            padding: 132px 24px 120px;
          }
          .fs-intro-kicker {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 0 0 26px;
            font-size: 16px;
            line-height: 1.4;
          }
          .fs-intro-kicker-brand {
            color: #18181b;
            font-weight: 800;
            letter-spacing: -0.01em;
          }
          .fs-intro-kicker-rule {
            width: 1px;
            height: 14px;
            background: #d4d4d8;
          }
          .fs-intro-kicker-product {
            color: #71717a;
            font-weight: 500;
          }
          .fs-intro-title {
            margin: 0;
            font-family: var(--fs-intro-display), var(--font-noto-sans-kr), 'Noto Sans KR', sans-serif;
            font-weight: 900;
            /* 가장 긴 줄 '그 영상이 왜 잘됐는지부터' = 10.39em → 화면 폭에 맞춰 한 줄 유지 */
            font-size: clamp(22px, calc((100vw - 40px) / 10.9), 64px);
            line-height: 1.2;
            letter-spacing: -0.03em;
            color: #18181b;
            word-break: keep-all;
          }
          .fs-intro-line {
            display: block;
          }
          .fs-intro-mark {
            position: relative;
            color: #7c3aed;
            white-space: nowrap;
          }
          .fs-intro-mark::after {
            content: '';
            position: absolute;
            left: -0.04em;
            right: -0.02em;
            bottom: 0.04em;
            height: 0.3em;
            z-index: -1;
            border-radius: 0.06em;
            background: #ede9fe;
            transform-origin: left center;
            animation: fs-intro-mark 640ms cubic-bezier(0.65, 0, 0.35, 1) 620ms both;
          }
          .fs-intro-lead {
            max-width: 640px;
            margin: 28px 0 0;
            color: #52525b;
            font-size: 19px;
            line-height: 1.72;
            letter-spacing: -0.01em;
            word-break: keep-all;
          }
          .fs-intro-lead p {
            margin: 0;
            text-wrap: balance;
          }
          /* 문단 사이는 줄 간격보다 확실히 넓게 — 좁으면 문단이 아니라 줄 간격이 한 번 벌어진 것처럼 보인다 */
          .fs-intro-lead p + p {
            margin-top: 16px;
          }
          .fs-intro-ph {
            white-space: nowrap;
          }
          .fs-intro-plate {
            margin: 56px 0 0;
          }
          .fs-intro-label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 14px;
            color: #3f3f46;
            font-size: 15px;
            font-weight: 700;
            letter-spacing: -0.01em;
          }
          .fs-intro-label svg {
            color: #8b5cf6;
          }
          .fs-intro-screen {
            position: relative;
            overflow: hidden;
            border: 1px solid #e4e4e7;
            border-radius: 14px;
            background: #f4f4f5;
            box-shadow:
              0 1px 2px rgba(24, 24, 27, 0.05),
              0 22px 48px -18px rgba(76, 29, 149, 0.28);
          }
          .fs-intro-screen-img {
            display: block;
            width: 100%;
            height: auto;
            user-select: none;
            -webkit-user-drag: none;
          }
          .fs-intro-progress {
            position: relative;
            height: 5px;
            background: #e4e4e7;
          }
          .fs-intro-progress-fill {
            position: absolute;
            inset: 0;
            background: #8b5cf6;
            transform-origin: left center;
          }
          .fs-intro-footnote {
            margin: 12px 0 0;
            color: #71717a;
            font-size: 13px;
            line-height: 1.5;
            word-break: keep-all;
          }
          .fs-intro-footnote strong {
            color: #3f3f46;
            font-weight: 700;
          }
          .fs-intro-review {
            margin-top: 56px;
          }
          .fs-intro-review-card {
            margin: 0;
            padding: 26px 30px 22px;
            border: 1px solid #e4e4e7;
            border-radius: 16px;
            background: #ffffff;
            box-shadow:
              0 1px 2px rgba(24, 24, 27, 0.04),
              0 18px 40px -22px rgba(24, 24, 27, 0.25);
          }
          .fs-intro-review-rating {
            display: flex;
            align-items: center;
            gap: 2px;
            color: #fbbf24;
          }
          .fs-intro-review-score {
            margin-left: 6px;
            color: #18181b;
            font-size: 14px;
            font-weight: 800;
            font-variant-numeric: tabular-nums;
          }
          .fs-intro-review-context {
            margin: 14px 0 0;
            color: #71717a;
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.01em;
          }
          .fs-intro-review-quote {
            margin: 6px 0 0;
            color: #18181b;
            font-size: 24px;
            font-weight: 800;
            line-height: 1.45;
            letter-spacing: -0.025em;
            word-break: keep-all;
            text-wrap: balance;
          }
          .fs-intro-review-closing {
            margin: 8px 0 0;
            color: #3f3f46;
            font-size: 17px;
            font-weight: 700;
            line-height: 1.55;
            letter-spacing: -0.02em;
            word-break: keep-all;
            text-wrap: pretty;
          }
          .fs-intro-review-full {
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #f4f4f5;
          }
          .fs-intro-review-full:not([hidden]) {
            animation: fs-intro-fade 360ms ease both;
          }
          .fs-intro-review-title {
            margin: 0;
            color: #27272a;
            font-size: 17px;
            font-weight: 700;
            line-height: 1.5;
            letter-spacing: -0.02em;
            word-break: keep-all;
          }
          .fs-intro-review-body {
            margin: 8px 0 0;
            color: #52525b;
            font-size: 17px;
            line-height: 1.8;
            letter-spacing: -0.01em;
            white-space: pre-line;
            word-break: keep-all;
            text-wrap: pretty;
          }
          .fs-intro-review-hl {
            color: #27272a;
            font-weight: 600;
            background-image: linear-gradient(#ddd6fe, #ddd6fe);
            background-repeat: no-repeat;
            background-position: 0 88%;
            background-size: 100% 0.48em;
          }
          .fs-intro-review-more {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            margin-top: 8px;
            padding: 6px 0;
            border: 0;
            background: none;
            color: #7c3aed;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .fs-intro-review-more:hover {
            color: #6d28d9;
          }
          .fs-intro-review-more:focus-visible {
            outline: 2px solid #c4b5fd;
            outline-offset: 2px;
            border-radius: 4px;
          }
          .fs-intro-review-more svg {
            transition: transform 180ms ease;
          }
          .fs-intro-review-more[aria-expanded='true'] svg {
            transform: rotate(180deg);
          }
          @keyframes fs-intro-fade {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .fs-intro-review-author {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #f4f4f5;
            color: #71717a;
            font-size: 14px;
          }
          .fs-intro-review-avatar {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 999px;
            background: #ede9fe;
            color: #6d28d9;
            font-size: 13px;
            font-weight: 800;
          }
          .fs-intro-review-name {
            color: #27272a;
            font-weight: 700;
          }
          .fs-intro-cta {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            min-height: 64px;
            margin-top: 24px;
            padding: 0 24px;
            border-radius: 16px;
            background: #8b5cf6;
            color: #ffffff;
            font-size: 19px;
            font-weight: 800;
            letter-spacing: -0.02em;
            text-decoration: none;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.22),
              0 12px 28px -10px rgba(124, 58, 237, 0.6);
            transition: background 180ms ease, transform 180ms ease, box-shadow 180ms ease;
          }
          .fs-intro-cta:hover {
            background: #7c3aed;
            transform: translateY(-1px);
          }
          .fs-intro-cta:active {
            transform: translateY(0);
          }
          .fs-intro-cta:focus-visible {
            outline: 3px solid #c4b5fd;
            outline-offset: 3px;
          }
          .fs-intro-cta svg {
            transition: transform 180ms ease;
          }
          .fs-intro-cta:hover svg {
            transform: translateX(3px);
          }
          .fs-intro-rise {
            animation: fs-intro-rise 720ms cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .fs-intro-kicker.fs-intro-rise { animation-delay: 40ms; }
          .fs-intro-line:nth-child(1) { animation-delay: 110ms; }
          .fs-intro-line:nth-child(2) { animation-delay: 180ms; }
          .fs-intro-line:nth-child(3) { animation-delay: 250ms; }
          .fs-intro-lead.fs-intro-rise { animation-delay: 340ms; }
          .fs-intro-plate.fs-intro-rise { animation-delay: 440ms; }
          @keyframes fs-intro-rise {
            from {
              opacity: 0;
              transform: translate3d(0, 14px, 0);
            }
            to {
              opacity: 1;
              transform: none;
            }
          }
          @keyframes fs-intro-mark {
            from { transform: scaleX(0); }
            to { transform: scaleX(1); }
          }
          @media (max-width: 768px) {
            .fs-intro-inner {
              padding: 96px 20px 72px;
            }
            .fs-intro-kicker {
              gap: 8px;
              margin-bottom: 18px;
              font-size: 14px;
            }
            .fs-intro-kicker-rule {
              height: 12px;
            }
            /* 제목 아래 간격은 문단 사이보다 넓게 유지해야 제목과 설명이 구분된다 */
            .fs-intro-lead {
              margin-top: 22px;
              font-size: 16px;
              line-height: 1.7;
            }
            .fs-intro-lead p + p {
              margin-top: 12px;
            }
            .fs-intro-plate {
              margin-top: 40px;
            }
            .fs-intro-label {
              margin-bottom: 12px;
              font-size: 14px;
            }
            .fs-intro-screen {
              border-radius: 10px;
            }
            .fs-intro-progress {
              height: 4px;
            }
            .fs-intro-footnote {
              margin-top: 10px;
              font-size: 12px;
            }
            .fs-intro-review {
              margin-top: 40px;
            }
            .fs-intro-review-card {
              padding: 20px 20px 16px;
              border-radius: 14px;
            }
            .fs-intro-review-context {
              margin-top: 12px;
              font-size: 13px;
            }
            .fs-intro-review-quote {
              font-size: 20px;
            }
            .fs-intro-review-closing {
              font-size: 15px;
            }
            .fs-intro-review-full {
              margin-top: 16px;
              padding-top: 14px;
            }
            .fs-intro-review-title {
              font-size: 16px;
            }
            .fs-intro-review-body {
              font-size: 15px;
              line-height: 1.75;
            }
            .fs-intro-review-author {
              margin-top: 16px;
              padding-top: 14px;
              font-size: 13px;
            }
            .fs-intro-cta {
              min-height: 58px;
              margin-top: 20px;
              border-radius: 14px;
              font-size: 17px;
            }
          }
          @media (prefers-reduced-motion: reduce) {
            .fs-intro-rise,
            .fs-intro-mark::after {
              animation: none;
            }
          }
        `}</style>

        <div className="fs-intro-inner">
          <p className="fs-intro-kicker fs-intro-rise">
            <span className="fs-intro-kicker-brand">FlowSpot</span>
            <span className="fs-intro-kicker-rule" aria-hidden="true" />
            <span className="fs-intro-kicker-product">올인원 패스</span>
          </p>

          <h1 className="fs-intro-title">
            <span className="fs-intro-line fs-intro-rise">따라 만들기 전에,</span>
            <span className="fs-intro-line fs-intro-rise">
              그 영상이 <span className="fs-intro-mark">왜 잘됐는지</span>부터
            </span>
            <span className="fs-intro-line fs-intro-rise">배우세요.</span>
          </h1>

          <div className="fs-intro-lead fs-intro-rise">
            {LEAD_PARAGRAPHS.map((phrases) => (
              <p key={phrases[0]}>
                {phrases.map((phrase, index) => (
                  <Fragment key={phrase}>
                    {index > 0 && ' '}
                    <span className="fs-intro-ph">{phrase}</span>
                  </Fragment>
                ))}
              </p>
            ))}
          </div>

          <figure className="fs-intro-plate fs-intro-rise">
            <figcaption className="fs-intro-label">
              <MonitorPlay size={17} strokeWidth={2.2} aria-hidden="true" />
              올인원 패스 실제 강의 화면
            </figcaption>
            <div ref={screenRef} className="fs-intro-screen">
              <Image
                src={LECTURE_SCREEN.src}
                alt="실전 분석 강의 화면 — 816만 뷰 쇼츠의 후킹·배경·갈등·핵심을 문장마다 짚는 장면"
                width={LECTURE_SCREEN.width}
                height={LECTURE_SCREEN.height}
                sizes="(max-width: 768px) calc(100vw - 40px), 720px"
                priority
                className="fs-intro-screen-img"
              />
              <div className="fs-intro-progress" aria-hidden="true">
                <motion.span className="fs-intro-progress-fill" style={{ scaleX: progressScale }} />
              </div>
            </div>
            <p className="fs-intro-footnote">
              <strong>816만 뷰</strong>: 강의 당시 외부 분석 영상의 조회수
            </p>
          </figure>

          {review && highlightAt >= 0 && (
            <motion.div className="fs-intro-review" {...reveal}>
              <p className="fs-intro-label">
                <MessageSquareQuote size={17} strokeWidth={2.2} aria-hidden="true" />
                실제 수강 후기
              </p>
              <article className="fs-intro-review-card">
                <div className="fs-intro-review-rating" role="img" aria-label={`별점 ${review.rating}점`}>
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      size={15}
                      fill="currentColor"
                      stroke="currentColor"
                      opacity={i < Math.round(review.rating) ? 1 : 0.28}
                    />
                  ))}
                  <span className="fs-intro-review-score">{review.rating.toFixed(1)}</span>
                </div>
                <p className="fs-intro-review-context">{REVIEW_CONTEXT}</p>
                <p className="fs-intro-review-quote">
                  “
                  {/* 스크롤로 들어오면 형광펜이 문장을 따라 그어진다 */}
                  <motion.span
                    className="fs-intro-review-hl"
                    initial={{ backgroundSize: '0% 0.48em' }}
                    whileInView={{ backgroundSize: '100% 0.48em' }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 1.1, ease, delay: 0.3 }}
                  >
                    {REVIEW_HIGHLIGHT}
                  </motion.span>
                  ”
                </p>
                {hasClosing && (
                  <p className="fs-intro-review-closing">
                    {REVIEW_CLOSING.map((phrase, index) => (
                      <Fragment key={phrase}>
                        {index > 0 && ' '}
                        <span className="fs-intro-ph">
                          {index === 0 && '“… '}
                          {phrase}
                          {index === REVIEW_CLOSING.length - 1 && '”'}
                        </span>
                      </Fragment>
                    ))}
                  </p>
                )}
                <div id="fs-intro-review-full" className="fs-intro-review-full" hidden={!reviewExpanded}>
                  {review.headline && <p className="fs-intro-review-title">{review.headline}</p>}
                  <p className="fs-intro-review-body">
                    {review.content.slice(0, highlightAt)}
                    <span className="fs-intro-review-hl">{REVIEW_HIGHLIGHT}</span>
                    {review.content.slice(highlightAt + REVIEW_HIGHLIGHT.length)}
                  </p>
                </div>
                <button
                  type="button"
                  className="fs-intro-review-more"
                  aria-expanded={reviewExpanded}
                  aria-controls="fs-intro-review-full"
                  onClick={() => setReviewExpanded((value) => !value)}
                >
                  {reviewExpanded ? '접기' : '후기 전체 읽기'}
                  <ChevronDown size={16} strokeWidth={2.4} aria-hidden="true" />
                </button>
                <footer className="fs-intro-review-author">
                  <span className="fs-intro-review-avatar" aria-hidden="true">
                    {Array.from(review.displayName)[0]?.toUpperCase()}
                  </span>
                  <span className="fs-intro-review-name">{review.displayName}</span>
                  <span aria-hidden="true">·</span>
                  <span>수강생</span>
                </footer>
              </article>
            </motion.div>
          )}

          <motion.div {...reveal}>
            <a
              href="#offer"
              className="fs-intro-cta"
              data-marketing-nav="intro-offer"
              onClick={handleSectionLink}
            >
              올인원 패스 구성·가격 보기
              <ChevronRight size={20} strokeWidth={2.6} aria-hidden="true" />
            </a>
          </motion.div>
        </div>
      </section>
    </MotionConfig>
  );
}
