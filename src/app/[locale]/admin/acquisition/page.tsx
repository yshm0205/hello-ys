import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { getFullAdminEmails } from "@/lib/admin/access";
import { defaultAttributionDates, loadAttributionReport } from "@/lib/marketing/attribution-load";
import { KEY_CONTENTS, findKeyContent, keyContentLink } from "@/lib/marketing/key-content-links";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function validDate(value: unknown, fallback: string) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;
  return Number.isFinite(Date.parse(`${value}T00:00:00+09:00`)) ? value : fallback;
}

export default async function AcquisitionPage({ searchParams }: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user || !getFullAdminEmails().includes(user.email?.toLowerCase() ?? "")) redirect("/ko/login");
  const query = await searchParams;
  const { today, monthAgo } = defaultAttributionDates();
  const start = validDate(query.start, monthAgo);
  const end = validDate(query.end, today);
  const range = { start: new Date(`${start}T00:00:00+09:00`).toISOString(),
    end: new Date(Date.parse(`${end}T00:00:00+09:00`) + 86400000).toISOString() };
  if (range.start >= range.end || Date.parse(range.end) - Date.parse(range.start) > 93 * 86400000) {
    return <p>시작일과 종료일을 확인해 주세요. 한 번에 최대 93일을 조회할 수 있습니다.</p>;
  }
  const report = await loadAttributionReport(range);
  const n = (value: number) => value.toLocaleString("ko-KR");
  const headers = ["키콘", "랜딩 열람", "브라우저", "방문", "반복 방문", "확인 회원", "구매 버튼 방문", "결제 페이지 방문", "기존 고객 열람", "첫 유입 주문", "마지막 유입 주문", "구매자", "순결제액"];
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">키콘별 유입과 구매</h1>
      <p className="mt-2 text-sm text-zinc-600">풀링·키콘 연계율은 비즈니스PT의 같은 기간 재생목록 조회수 기준을 그대로 사용합니다.</p></div>
    <form className="flex flex-wrap items-end gap-3">
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
    <section className="space-y-3"><h2 className="text-xl font-bold">영상별 전용 링크</h2>
      <p className="text-sm text-zinc-600">랜딩은 같고 출처만 구분합니다. 광고에는 이 링크를 쓰지 않습니다. 기존 풀링 → 키콘 영상 링크는 유지합니다.</p>
      {KEY_CONTENTS.map((video) => <div key={video.id} className="rounded-lg border bg-white p-4">
        <a className="font-semibold underline" href={`https://www.youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer">{video.title}</a>
        {(["pin", "description"] as const).map((placement) => <label key={placement} className="mt-3 block text-sm">
          {placement === "pin" ? "고정댓글" : "설명란"}<input readOnly className="mt-1 block w-full rounded border p-2" value={keyContentLink(video.id, placement)} />
        </label>)}
      </div>)}
      <p className="text-sm">수강생 강의실 바로가기: <Link className="underline" href="/ko/dashboard/lectures">https://flowspot.kr/ko/dashboard/lectures</Link></p>
    </section>
  </div>;
}
