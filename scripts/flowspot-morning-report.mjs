import fs from "fs";
import path from "path";

import { createClient } from "@supabase/supabase-js";

const ROOT = process.cwd();
const SEOUL_TIME_ZONE = "Asia/Seoul";
const STATE_DIR = path.join(ROOT, ".codex-automation");
const STATE_PATH = path.join(STATE_DIR, "flowspot-morning-report.json");

const TARGETS = {
  weeklyRevenueMin: 1_500_000,
  weeklyRevenueMax: 2_500_000,
  weeklyCompletedMin: 3,
  weeklyCompletedMax: 5,
  weeklyLandingMin: 150,
  weeklyLandingMax: 300,
  weeklyCtaUniqueMin: 20,
  weeklyPaymentAttemptsMin: 3,
};

const DEFAULT_INTERNAL_METRIC_EMAILS = [
  "dyj05194@gmail.com",
  "duj05194@gmail.com",
  "hmys0205hmys@gmail.com",
  "myengjun01@gmail.com",
  "review@flowspot.kr",
  "somangg748@gmail.com",
  "yesung051918@gmail.com",
  "yshm0205@gmail.com",
  "yshm0205yshm@gmail.com",
  "ytapitest2023@gmail.com",
];

const SALES_STATUSES = new Set(["DONE", "PARTIAL_CANCELLED"]);
const REFUND_STATUSES = new Set(["CANCELED", "CANCELLED", "PARTIAL_CANCELLED"]);
const LAUNCH_CHANGE_EVENTS = [
  {
    title: "로그인/회원가입 후 체크아웃 복귀 수정",
    happenedAtKst: "2026-04-25T03:00:00+09:00",
    focus: "ctaToAttempt",
  },
  {
    title: "전자책 쿠폰 EBOOK50 적용",
    happenedAtKst: "2026-04-26T15:00:00+09:00",
    focus: "attemptToComplete",
  },
  {
    title: "로그인 화면 압축 및 문구 보강",
    happenedAtKst: "2026-04-26T22:00:00+09:00",
    focus: "ctaToAttempt",
  },
];

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;

  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line)) continue;
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue;
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }

  return out;
}

function loadEnv() {
  const candidates = [
    path.join(ROOT, ".env.local"),
    path.join(ROOT, ".env.vercel.production"),
    path.join(ROOT, ".vercel", ".env.production.local"),
    path.join(ROOT, ".vercel", ".env.development.local"),
  ];

  return candidates.reduce(
    (acc, filePath) => ({ ...acc, ...parseEnvFile(filePath) }),
    { ...process.env },
  );
}

function getKstDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  return {
    year: parts.find((part) => part.type === "year")?.value ?? "1970",
    month: parts.find((part) => part.type === "month")?.value ?? "01",
    day: parts.find((part) => part.type === "day")?.value ?? "01",
  };
}

function getKstDayRange(dayOffset = 0) {
  const { year, month, day } = getKstDateParts();
  const start = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  start.setUTCDate(start.getUTCDate() + dayOffset);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    label: `${year}-${month}-${day}`,
  };
}

function getKstBackRange(days) {
  const { year, month, day } = getKstDateParts();
  const end = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - days);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getHoursBetween(startIso, endIso) {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / (1000 * 60 * 60));
}

function getShiftedRange(anchorIso, hoursBefore, hoursAfter) {
  const anchor = new Date(anchorIso);
  const start = new Date(anchor.getTime() - hoursBefore * 60 * 60 * 1000);
  const end = new Date(anchor.getTime() + hoursAfter * 60 * 60 * 1000);
  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

function getTodayKstKey() {
  const { year, month, day } = getKstDateParts();
  return `${year}-${month}-${day}`;
}

function toWon(value) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function getCtaRate(landing, ctaUnique) {
  if (!landing) return 0;
  return round1((ctaUnique / landing) * 100);
}

function getStepRate(numerator, denominator) {
  if (!denominator) return 0;
  return round1((numerator / denominator) * 100);
}

function readState() {
  if (!fs.existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeState(nextState) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
}

function mergeEmails(...parts) {
  return Array.from(
    new Set(
      parts
        .flatMap((part) => String(part || "").split(","))
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

function getNumericMetadata(metadata, key) {
  const value = metadata?.[key];
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getNetRevenue(payment) {
  if (payment.status === "DONE") return payment.amount || 0;
  if (payment.status === "PARTIAL_CANCELLED") {
    const cancelledAmount = getNumericMetadata(payment.metadata, "cancelledAmount");
    return Math.max(0, (payment.amount || 0) - cancelledAmount);
  }
  return 0;
}

function normalizeReferrer(raw) {
  if (!raw) return "direct";
  const trimmed = String(raw).trim();
  if (!trimmed) return "direct";

  let hostname = trimmed;
  try {
    hostname = new URL(trimmed).hostname;
  } catch {
    hostname = trimmed.replace(/^https?:\/\//i, "").split("/")[0];
  }

  hostname = hostname.replace(/^www\./i, "").toLowerCase();

  if (hostname.includes("youtube") || hostname.includes("youtu.be")) return "YouTube";
  if (hostname.includes("instagram")) return "Instagram";
  if (hostname.includes("google")) return "Google";
  if (hostname.includes("naver")) return "Naver";
  if (hostname.includes("kakao")) return "Kakao";
  if (hostname.includes("tiktok")) return "TikTok";
  if (hostname.includes("twitter") || hostname.includes("x.com")) return "X/Twitter";
  if (hostname.includes("facebook")) return "Facebook";
  if (hostname.includes("threads")) return "Threads";
  if (hostname.includes("flowspot.kr")) return "internal";
  return hostname || "direct";
}

function countReferrerTop(rows, topN = 3) {
  const counts = new Map();
  for (const row of rows || []) {
    const source = normalizeReferrer(row.referrer);
    counts.set(source, (counts.get(source) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);
}

function summarizePeriod({ payments, sessions, feedbackRows }) {
  const completedRows = payments.filter((payment) => SALES_STATUSES.has(payment.status));
  const refundRows = payments.filter((payment) => REFUND_STATUSES.has(payment.status));

  return {
    landingSessions: sessions.length,
    ctaUnique: sessions.filter((session) => (session.cta_clicks || 0) > 0).length,
    ctaClicks: sessions.reduce((sum, session) => sum + (session.cta_clicks || 0), 0),
    paymentAttempts: payments.length,
    completedPayments: completedRows.length,
    netRevenueKrw: completedRows.reduce((sum, payment) => sum + getNetRevenue(payment), 0),
    feedbackCount: feedbackRows.length,
    refundRequestCount: refundRows.length,
    topReferrers: countReferrerTop(sessions, 3),
  };
}

function pickBottleneck(summary7d) {
  if (summary7d.paymentAttempts > 0 && summary7d.completedPayments === 0) {
    return "결제 완료 병목: 결제 시도는 있는데 완료가 아직 없습니다.";
  }

  if (summary7d.landingSessions < TARGETS.weeklyLandingMin) {
    return "유입 부족: 랜딩 세션이 아직 목표치보다 낮습니다.";
  }

  if (summary7d.ctaUnique < TARGETS.weeklyCtaUniqueMin) {
    return "상단 설득 부족: 유입 대비 CTA 유니크가 낮습니다.";
  }

  if (summary7d.paymentAttempts < TARGETS.weeklyPaymentAttemptsMin) {
    return "CTA 이후 이탈: 구매 버튼을 눌러도 체크아웃 도달이 약합니다.";
  }

  if (summary7d.completedPayments < TARGETS.weeklyCompletedMin) {
    return "전환 마무리 부족: 결제는 나오지만 주간 완료 목표에는 아직 못 미칩니다.";
  }

  return "큰 병목은 완화됐고, 현재는 유입 확대가 우선입니다.";
}

function pickActions(summary7d) {
  if (summary7d.paymentAttempts > 0 && summary7d.completedPayments === 0) {
    return [
      "PENDING 결제가 DONE으로 바뀌는지 계속 확인하고, 실패 원인을 문의와 테스트로 수집하세요.",
      "결제 직전 문구에서 카드, 토스머니, 계좌이체와 환불 안내를 더 명확히 보여주세요.",
    ];
  }

  if (summary7d.landingSessions < TARGETS.weeklyLandingMin) {
    return [
      "유튜브 롱폼, 커뮤니티, DM으로 랜딩 유입을 먼저 늘리세요.",
      "랜딩 구조보다 영상 CTA와 배포량을 우선 보강하세요.",
    ];
  }

  if (summary7d.ctaUnique < TARGETS.weeklyCtaUniqueMin) {
    return [
      "랜딩 상단 카피와 누구에게 맞는지 설명을 더 선명하게 다듬으세요.",
      "FAQ에서 할부, 환불, 수강기간 불안을 먼저 해소하세요.",
    ];
  }

  if (summary7d.paymentAttempts < TARGETS.weeklyPaymentAttemptsMin) {
    return [
      "CTA 이후 로그인, 회원가입, 체크아웃 이동 흐름을 다시 실제로 점검하세요.",
      "결제 안내 문구와 구매 버튼 주변 신뢰 요소를 더 가까이 붙이세요.",
    ];
  }

  return [
    "잘 반응한 유입 채널과 영상 주제를 반복하세요.",
    "구매자 후기와 초기 반응을 랜딩 상단 근처에 빠르게 반영하세요.",
  ];
}

function buildTrendLine(summary7d, summary30d) {
  const landing7dDaily = summary7d.landingSessions / 7;
  const landing30dDaily = summary30d.landingSessions / 30;
  const cta7dDaily = summary7d.ctaUnique / 7;
  const cta30dDaily = summary30d.ctaUnique / 30;
  const completed7dDaily = summary7d.completedPayments / 7;
  const completed30dDaily = summary30d.completedPayments / 30;

  const parts = [];

  if (landing7dDaily > landing30dDaily * 1.15) {
    parts.push("유입 속도는 최근 30일 평균보다 올라왔습니다");
  } else if (landing7dDaily < landing30dDaily * 0.85) {
    parts.push("유입 속도는 최근 30일 평균보다 느립니다");
  } else {
    parts.push("유입 속도는 최근 30일 평균과 비슷합니다");
  }

  if (cta7dDaily > cta30dDaily * 1.15) {
    parts.push("CTA 반응은 좋아지는 중입니다");
  } else if (cta7dDaily < cta30dDaily * 0.85) {
    parts.push("CTA 반응은 최근 평균보다 약합니다");
  } else {
    parts.push("CTA 반응은 최근 평균 수준입니다");
  }

  if (summary30d.completedPayments === 0) {
    parts.push("결제 완료 데이터는 아직 충분히 쌓이지 않았습니다");
  } else if (completed7dDaily > completed30dDaily * 1.15) {
    parts.push("결제 완료 속도는 최근 평균보다 좋습니다");
  } else if (completed7dDaily < completed30dDaily * 0.85) {
    parts.push("결제 완료 속도는 최근 평균보다 느립니다");
  } else {
    parts.push("결제 완료 속도는 최근 평균과 비슷합니다");
  }

  return parts.join(" / ");
}

function buildGoalLine(summary7d) {
  const checks = [
    summary7d.netRevenueKrw >= TARGETS.weeklyRevenueMin &&
    summary7d.netRevenueKrw <= TARGETS.weeklyRevenueMax
      ? `매출 OK(${toWon(summary7d.netRevenueKrw)})`
      : `매출 미달(${toWon(summary7d.netRevenueKrw)})`,
    summary7d.completedPayments >= TARGETS.weeklyCompletedMin &&
    summary7d.completedPayments <= TARGETS.weeklyCompletedMax
      ? `완료 OK(${summary7d.completedPayments}건)`
      : `완료 ${summary7d.completedPayments}건`,
    summary7d.landingSessions >= TARGETS.weeklyLandingMin &&
    summary7d.landingSessions <= TARGETS.weeklyLandingMax
      ? `랜딩 OK(${summary7d.landingSessions})`
      : `랜딩 ${summary7d.landingSessions}`,
    summary7d.ctaUnique >= TARGETS.weeklyCtaUniqueMin
      ? `CTA OK(${summary7d.ctaUnique})`
      : `CTA ${summary7d.ctaUnique}`,
    summary7d.paymentAttempts >= TARGETS.weeklyPaymentAttemptsMin
      ? `시도 OK(${summary7d.paymentAttempts})`
      : `시도 ${summary7d.paymentAttempts}`,
  ];

  return checks.join(" / ");
}

function buildChangeEffectLine(effect) {
  if (!effect) return null;

  if (effect.afterHours < 6) {
    return `- ${effect.title}: 반영 후 데이터가 아직 ${Math.round(effect.afterHours)}시간치라 판단 보류`;
  }

  if (effect.focus === "attemptToComplete") {
    return `- ${effect.title}: 결제시도→완료 ${effect.beforeAttemptToComplete}% → ${effect.afterAttemptToComplete}% / 매출 ${toWon(effect.beforeRevenue)} → ${toWon(effect.afterRevenue)}`;
  }

  return `- ${effect.title}: CTA→결제시도 ${effect.beforeCtaToAttempt}% → ${effect.afterCtaToAttempt}% / 랜딩→CTA ${effect.beforeLandingToCta}% → ${effect.afterLandingToCta}%`;
}

function buildReport({ yesterdayLabel, summaryYesterday, summary7d, summary30d, changeEffects }) {
  const ctaRateYesterday = getCtaRate(summaryYesterday.landingSessions, summaryYesterday.ctaUnique);
  const ctaRate7d = getCtaRate(summary7d.landingSessions, summary7d.ctaUnique);
  const topReferrers = summary7d.topReferrers.length
    ? summary7d.topReferrers.map(([source, count]) => `${source} ${count}`).join(", ")
    : "데이터 없음";

  const bottleneck = pickBottleneck(summary7d);
  const actions = pickActions(summary7d);

  return [
    "FlowSpot 오전 리포트",
    `기준일: ${yesterdayLabel}`,
    "",
    "[어제]",
    `- 랜딩 ${summaryYesterday.landingSessions}`,
    `- CTA 유니크 ${summaryYesterday.ctaUnique} (${ctaRateYesterday}%) / 총 클릭 ${summaryYesterday.ctaClicks}`,
    `- 결제시도 ${summaryYesterday.paymentAttempts} / 완료 ${summaryYesterday.completedPayments}`,
    `- 매출 ${toWon(summaryYesterday.netRevenueKrw)}`,
    "",
    "[최근 7일]",
    `- 랜딩 ${summary7d.landingSessions}`,
    `- CTA 유니크 ${summary7d.ctaUnique} (${ctaRate7d}%) / 총 클릭 ${summary7d.ctaClicks}`,
    `- 결제시도 ${summary7d.paymentAttempts} / 완료 ${summary7d.completedPayments}`,
    `- 매출 ${toWon(summary7d.netRevenueKrw)}`,
    `- 목표대비: ${buildGoalLine(summary7d)}`,
    "",
    "[최근 30일 추세]",
    `- ${buildTrendLine(summary7d, summary30d)}`,
    `- 주요 유입: ${topReferrers}`,
    `- 문의 ${summary7d.feedbackCount}건 / 환불(취소 기준) ${summary7d.refundRequestCount}건`,
    "",
    "[최근 수정 효과]",
    ...(changeEffects.length > 0
      ? changeEffects.map((effect) => buildChangeEffectLine(effect)).filter(Boolean)
      : ["- 비교할 수정 데이터가 아직 없습니다."]),
    "",
    "[진단]",
    `- 병목: ${bottleneck}`,
    "",
    "[오늘 액션]",
    `1. ${actions[0]}`,
    `2. ${actions[1]}`,
  ].join("\n");
}

async function sendTelegramMessage(botToken, chatId, text) {
  const body = Buffer.from(
    JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    "utf8",
  );

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": String(body.byteLength),
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${response.status} ${errorText}`);
  }
}

async function fetchPeriod(admin, range) {
  const paymentSelect = "id, amount, created_at, user_id, status, metadata";
  const [paymentsRes, sessionsRes, feedbackRes] = await Promise.all([
    admin
      .from("toss_payments")
      .select(paymentSelect)
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
    admin
      .from("marketing_sessions")
      .select("cta_clicks, referrer, first_seen_at")
      .gte("first_seen_at", range.startIso)
      .lt("first_seen_at", range.endIso),
    admin
      .from("feedback_requests")
      .select("id, created_at")
      .gte("created_at", range.startIso)
      .lt("created_at", range.endIso),
  ]);

  if (paymentsRes.error) throw paymentsRes.error;
  if (sessionsRes.error) throw sessionsRes.error;
  if (feedbackRes.error) throw feedbackRes.error;

  return {
    payments: paymentsRes.data || [],
    sessions: sessionsRes.data || [],
    feedbackRows: feedbackRes.data || [],
  };
}

async function main() {
  const env = loadEnv();
  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = env.TELEGRAM_CHAT_ID?.trim();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!botToken || !chatId) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in local env files.");
  }

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in local env files.");
  }

  const force = process.argv.includes("--force");
  const noSend = process.argv.includes("--no-send");
  const todayKst = getTodayKstKey();
  const state = readState();

  if (!force && state.lastSentKstDate === todayKst) {
    console.log(`Already sent for ${todayKst} KST. Use --force to send again.`);
    return;
  }

  const internalEmails = mergeEmails(
    DEFAULT_INTERNAL_METRIC_EMAILS.join(","),
    env.ADMIN_EMAILS,
    env.METRICS_EXCLUDED_EMAILS,
    env.INTERNAL_METRIC_EXCLUDE_EMAILS,
  );

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let internalIds = new Set();
  if (internalEmails.length > 0) {
    const { data, error } = await admin.from("users").select("id, email").in("email", internalEmails);
    if (error) throw error;
    internalIds = new Set((data || []).map((row) => row.id));
  }

  const yesterday = getKstDayRange(-1);
  const last7 = getKstBackRange(7);
  const last30 = getKstBackRange(30);
  const nowIso = new Date().toISOString();

  const changeRanges = LAUNCH_CHANGE_EVENTS.flatMap((change) => {
    const changeIso = new Date(change.happenedAtKst).toISOString();
    return [
      { key: `${change.title}:before`, title: change.title, focus: change.focus, type: "before", range: getShiftedRange(changeIso, 24, 0), anchorIso: changeIso },
      { key: `${change.title}:after`, title: change.title, focus: change.focus, type: "after", range: { startIso: changeIso, endIso: new Date(Math.min(new Date(changeIso).getTime() + 24 * 60 * 60 * 1000, new Date(nowIso).getTime())).toISOString() }, anchorIso: changeIso },
    ];
  });

  const [yData, data7d, data30d, ...changeData] = await Promise.all([
    fetchPeriod(admin, yesterday),
    fetchPeriod(admin, last7),
    fetchPeriod(admin, last30),
    ...changeRanges.map((item) => fetchPeriod(admin, item.range)),
  ]);

  const filterPayments = (rows) =>
    rows.filter(
      (row) => !internalIds.has(row.user_id) && row.metadata?.provider === "tosspay-direct",
    );

  const summaryYesterday = summarizePeriod({
    payments: filterPayments(yData.payments),
    sessions: yData.sessions,
    feedbackRows: yData.feedbackRows,
  });

  const summary7d = summarizePeriod({
    payments: filterPayments(data7d.payments),
    sessions: data7d.sessions,
    feedbackRows: data7d.feedbackRows,
  });

  const summary30d = summarizePeriod({
    payments: filterPayments(data30d.payments),
    sessions: data30d.sessions,
    feedbackRows: data30d.feedbackRows,
  });

  const changeEffects = LAUNCH_CHANGE_EVENTS.map((change) => {
    const beforeIndex = changeRanges.findIndex((item) => item.key === `${change.title}:before`);
    const afterIndex = changeRanges.findIndex((item) => item.key === `${change.title}:after`);
    const beforeRaw = changeData[beforeIndex];
    const afterRaw = changeData[afterIndex];

    const beforeSummary = summarizePeriod({
      payments: filterPayments(beforeRaw.payments),
      sessions: beforeRaw.sessions,
      feedbackRows: beforeRaw.feedbackRows,
    });
    const afterSummary = summarizePeriod({
      payments: filterPayments(afterRaw.payments),
      sessions: afterRaw.sessions,
      feedbackRows: afterRaw.feedbackRows,
    });

    return {
      title: change.title,
      focus: change.focus,
      afterHours: getHoursBetween(changeRanges[afterIndex].range.startIso, changeRanges[afterIndex].range.endIso),
      beforeLandingToCta: getCtaRate(beforeSummary.landingSessions, beforeSummary.ctaUnique),
      afterLandingToCta: getCtaRate(afterSummary.landingSessions, afterSummary.ctaUnique),
      beforeCtaToAttempt: getStepRate(beforeSummary.paymentAttempts, beforeSummary.ctaUnique),
      afterCtaToAttempt: getStepRate(afterSummary.paymentAttempts, afterSummary.ctaUnique),
      beforeAttemptToComplete: getStepRate(beforeSummary.completedPayments, beforeSummary.paymentAttempts),
      afterAttemptToComplete: getStepRate(afterSummary.completedPayments, afterSummary.paymentAttempts),
      beforeRevenue: beforeSummary.netRevenueKrw,
      afterRevenue: afterSummary.netRevenueKrw,
    };
  });

  const report = buildReport({
    yesterdayLabel: yesterday.label,
    summaryYesterday,
    summary7d,
    summary30d,
    changeEffects,
  });

  console.log(report);

  if (noSend) {
    return;
  }

  await sendTelegramMessage(botToken, chatId, report);
  writeState({
    lastSentKstDate: todayKst,
    lastSentAt: new Date().toISOString(),
    lastReportPreview: report.slice(0, 200),
  });

  console.log("Telegram report sent.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
