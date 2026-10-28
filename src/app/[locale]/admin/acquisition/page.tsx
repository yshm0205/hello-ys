import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getFullAdminEmails } from "@/lib/admin/access";
import { defaultAttributionDates, loadAttributionReport, loadWeeklyFunnel } from "@/lib/marketing/attribution-load";
import { KEY_CONTENTS, findKeyContent, keyContentLink } from "@/lib/marketing/key-content-links";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FUNNEL_WEEKS = 8;
const SECTION_LABELS: Record<string, string> = {
  "lecture-intro": "강의 소개(맨 위)", "landing-hero": "첫 화면", earlybird: "얼리버드 혜택", "loop-pain": "문제 인식",
  pain: "문제 공감", offer: "상품 소개", compare: "가치 비교", "how-it-works": "진행 방식", reviews: "구매자 리뷰",
  faq: "FAQ", cta: "마지막 신청",
};

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return Number.isFinite(Date.parse(`${value}T00:00:00+09:00`)) ? value : fallback;
}

function validFilter(value: unknown) {
  if (value === "key" || KEY_CONTENTS.some((video) => video.id === value)) return value as string;
  return "all";
}

function kstDay(iso: string) {
  const date = new Date(Date.parse(iso) + 9 * 3600000);
  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
}

export default async function AcquisitionPage({ searchParams }: {
  searchParams: Promise<{ start?: string; end?: string; src?: string }>;
}) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || !getFullAdminEmails().includes(user.email?.toLowerCase() ?? "")) redirect("/ko/login");
  const query = await searchParams;
  const { today, monthAgo } = defaultAttributionDates();
  const start = validDate(query.start, monthAgo);
  const end = validDate(query.end, today);
  const src = validFilter(query.src);
  const range = { start: new Date(`${start}T00:00:00+09:00`).toISOString(),
    end: new Date(Date.parse(`${end}T00:00:00+09:00`) + 86400000).toISOString() };
  if (range.start >= range.end || Date.parse(range.end) - Date.parse(range.start) > 93 * 86400000) {
    return <p>시작일과 종료일을 확인해 주세요. 한 번에 최대 93일을 조회할 수 있습니다.</p>;
  }
  const [report, funnel] = await Promise.all([loadAttributionReport(range), loadWeeklyFunnel(FUNNEL_WEEKS, src)]);
  const { now } = funnel;
  const n = (value: number) => value.toLocaleString("ko-KR");
  const headers = ["키콘", "랜딩 열람", "브라우저", "방문", "반복 방문", "확인 회원", "구매 버튼 방문", "결제 페이지 방문", "기존 고객 열람", "첫 유입 주문", "마지막 유입 주문", "구매자", "순결제액"];
  const stageHeaders = ["랜딩 도착", "신청 버튼", "구매 선택 화면", "구매 버튼", "결제창", "결제 완료"];
  const firstRecord = funnel.firstRecord ? Date.parse(funnel.firstRecord) : null;
  const firstLeave = funnel.firstLeave ? Date.parse(funnel.firstLeave) : null;
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">키콘별 유입과 구매</h1>
      <p className="mt-2 text-sm text-zinc-600">풀링·키콘 연계율은 비즈니스PT의 같은 기간 재생목록 조회수 기준을 그대로 사용합니다.</p></div>

    <section className="space-y-3">
      <h2 className="text-xl font-bold">주차별 단계 (토~금, 한국시간)</h2>
      <form className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="start" value={start} /><input type="hidden" name="end" value={end} />
        <label className="text-sm">유입<select className="block rounded border p-2" name="src" defaultValue={src}>
          <option value="all">전체 유입</option>
          <option value="key">키콘 전체</option>
          {KEY_CONTENTS.map((video) => <option key={video.id} value={video.id}>{video.title}</option>)}
        </select></label>
        <button className="rounded bg-zinc-900 px-4 py-2 text-white" type="submit">보기</button>
      </form>
      <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-sm">
        <thead><tr>
          <th className="whitespace-nowrap border-b p-3 text-left">주차</th>
          {stageHeaders.map((header) => <th key={header} className="whitespace-nowrap border-b p-3 text-right">{header}</th>)}
          <th className="min-w-64 border-b p-3 text-left">결제 쪽으로 안 간 방문이 마지막으로 머문 곳</th>
        </tr></thead>
        <tbody>{[...funnel.weeks].reverse().map((week) => {
          const startMs = Date.parse(week.start);
          const endMs = Date.parse(week.end);
          const label = `${kstDay(week.start)}~${kstDay(new Date(endMs - 86400000).toISOString())}`;
          const before = firstRecord === null || endMs <= firstRecord;
          const notes = before ? [] : [firstRecord !== null && firstRecord > startMs && `${kstDay(funnel.firstRecord ?? week.start)}부터`, now < endMs && "진행 중"].filter(Boolean);
          const note = notes.length ? ` (${notes.join(", ")})` : "";
          const s = week.stages;
          const exitsRecorded = firstLeave !== null && endMs > firstLeave;
          return <tr key={week.start}>
            <td className="whitespace-nowrap border-b p-3">{label}<span className="text-zinc-500">{note}</span></td>
            {[s.landing, s.cta, s.checkout, s.select, s.pay, s.paid].map((value, index) =>
              <td key={stageHeaders[index]} className="border-b p-3 text-right">{before ? <span className="text-zinc-400">기록 전</span> : n(value)}</td>)}
            <td className="border-b p-3">{before || !exitsRecorded ? <span className="text-zinc-400">기록 전</span>
              : !week.stayedVisits ? "-"
              : <>{week.exits.slice(0, 4).map((exit) => `${SECTION_LABELS[exit.section] ?? exit.section} ${n(exit.count)}`).join(" · ") || "-"}
                {week.unrecorded > 0 && <span className="text-zinc-500"> (구간 기록 없음 {n(week.unrecorded)})</span>}</>}</td>
          </tr>;
        })}</tbody>
      </table></div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm leading-7">
        <p>① 키콘 조회수와 ② bit.ly 클릭 수는 비즈니스PT 콘텐츠 관리 화면에서 보세요. 이 표는 ③ 랜딩 도착부터입니다.</p>
        <p>숫자는 그 주에 그 단계를 한 브라우저 수입니다. 사람 수가 아니며, 기존 수강생·운영자·테스트 기록은 뺐습니다.</p>
        <p>단계마다 따로 셉니다. 신청 버튼을 누르지 않고 구매 화면으로 바로 들어온 경우가 있어 구매 선택 화면이 신청 버튼보다 많을 수 있습니다.</p>
        <p>결제 완료는 그 주의 결제 건수입니다. 키콘을 고르면 결제 전 30일 안에 마지막으로 들어온 출처가 그 키콘인 주문만 셉니다.</p>
        <p>키콘 출처: 영상 주소가 담긴 bit.ly나 /go/ 링크로 들어온 브라우저를 30일 동안 그 키콘 유입으로 봅니다. 같은 bit.ly를 광고에도 쓰면 광고 클릭도 여기에 섞입니다.</p>
        <p>마지막으로 머문 곳: 신청 버튼·구매 화면·로그인으로 넘어가지 않은 방문이 화면을 떠날 때 보던 구간입니다. {funnel.firstLeave ? `${kstDay(funnel.firstLeave)}부터 기록합니다.` : "아직 기록이 없습니다."}</p>
      </div>
    </section>

    <section className="space-y-3">
      <h2 className="text-xl font-bold">키콘별 합계 (기간 선택)</h2>
      <form className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="src" value={src} />
        <label className="text-sm">시작일 (한국시간)<input className="block rounded border p-2" type="date" name="start" defaultValue={start} /></label>
        <label className="text-sm">종료일<input className="block rounded border p-2" type="date" name="end" defaultValue={end} /></label>
        <button className="rounded bg-zinc-900 px-4 py-2 text-white" type="submit">조회</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-3">
        {[["구매 전·미확인 브라우저", report.totals.browsers], ["반복 방문 (기간 내)", report.totals.repeatVisits],
          ["확인된 회원", report.totals.members], ["실제 구매자", report.totals.buyers],
          ["기존 고객 강의실 열람", report.totals.customerCourseViews], ["로그인 버튼 클릭 (구매와 분리)", report.totals.loginClicks]].map(([label, value]) =>
          <div key={label} className="rounded-lg border bg-white p-4"><p className="text-sm text-zinc-600">{label}</p><strong className="text-2xl">{value}</strong></div>)}
      </div>
      <div className="overflow-x-auto rounded border bg-white"><table className="w-full text-sm">
        <thead><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap border-b p-3 text-left">{header}</th>)}</tr></thead>
        <tbody>{report.rows.map((row) => <tr key={row.key}>
          <td className="min-w-48 border-b p-3">{findKeyContent(row.key)?.title ?? "기타·출처 미확인"}</td>
          {[row.pageViews, row.browsers, row.visits, row.repeatVisits, row.members, row.purchaseClicks,
            row.checkoutVisits, row.customerPageViews, row.firstTouchOrders, row.orders, row.buyers, row.revenue]
            .map((value, index) => <td key={headers[index + 1]} className="border-b p-3 text-right">{n(value)}</td>)}
        </tr>)}</tbody>
      </table>{!report.rows.length && <p className="p-6 text-zinc-600">선택한 기간에 새 추적 기록이 없습니다.</p>}</div>
      <div className="rounded-lg bg-blue-50 p-4 text-sm leading-7">
        <p>방문은 30분 동안 활동이 없으면 새로 셉니다. 같은 방문에서 로그인한 계정이 하나일 때만 이전 익명 기록을 연결하며, 로그인한 동일 회원의 기기별 기록은 회원 수에서 중복을 줄입니다.</p>
        <p>브라우저 수는 사람 수가 아닙니다. 로그인하지 않은 열람 {n(report.totals.unknownViews)}회, 유료 결제 없이 수강권만 확인된 열람 {n(report.totals.accessOnlyViews)}회가 포함되어 있습니다.</p>
        <p>기존 고객의 랜딩·강의실 열람과 운영자·테스트 기록은 구매 전 유입에서 제외합니다. 구매 이전 방문은 제외하지 않습니다. 강의실 열람은 실제 영상 시청 완료를 뜻하지 않습니다.</p>
        <p>구매는 선택 기간의 결제 승인·확인 시각 기준입니다. 시각이 없는 과거 주문만 생성 시각을 사용합니다. 주문마다 구매 전 30일의 첫 출처와 마지막 출처를 따로 표시하고, 순결제액은 마지막 출처에 한 번만 배정합니다. 수수료 차감 전 금액입니다.</p>
        <p>첫 유입 주문과 마지막 유입 주문은 더하지 마세요. 같은 사람이 여러 키콘을 거칠 수 있어 행별 방문자·구매자 합계가 전체 고유 수보다 클 수 있습니다. 이 표의 유입과 이번 주 매출을 나누어 구매 전환율로 해석하지 않습니다.</p>
        <p>출처 없는 과거 주문은 특정 영상에 배정하지 않습니다. 새 기록 시작: {report.recordedFrom ? new Date(report.recordedFrom).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "수집 대기"}</p>
      </div>
    </section>

    <details className="rounded-lg border bg-white p-4">
      <summary className="cursor-pointer font-semibold">예비 전용 링크 (/go/) — 지금 고정댓글은 비즈니스PT bit.ly를 씁니다</summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-zinc-600">랜딩은 같고 출처만 구분합니다. 광고에는 이 링크를 쓰지 않습니다. 기존 풀링 → 키콘 영상 링크는 유지합니다.</p>
        {KEY_CONTENTS.map((video) => <div key={video.id} className="rounded-lg border p-4">
          <a className="font-semibold underline" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">{video.title}</a>
          {(["pin", "description"] as const).map((placement) => <label key={placement} className="mt-3 block text-sm">
            {placement === "pin" ? "고정댓글" : "설명란"}<input readOnly className="mt-1 block w-full rounded border p-2" value={keyContentLink(video.id, placement)} />
          </label>)}
        </div>)}
      </div>
    </details>
    <p className="text-sm">수강생 강의실 바로가기: <Link className="underline" href="/ko/dashboard/lectures">https://flowspot.kr/ko/dashboard/lectures</Link></p>
  </div>;
}
