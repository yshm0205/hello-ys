import { Header } from "@/components/shared/Header";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: `환불 및 취소 규정 - FlowSpot`,
  };
}

export default async function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">환불 및 취소 규정</h1>
        <div className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-p:text-black dark:prose-p:text-white prose-li:text-black dark:prose-li:text-white prose-strong:text-black dark:prose-strong:text-white">
          <p className="lead">시행일: 2026-04-23</p>

          <p>
            본 규정은 플로우스팟(FlowSpot)(이하 &quot;회사&quot;)이 제공하는 유료 서비스의
            환불 및 취소에 관한 사항을 규정합니다.
            본 규정은 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 및
            「이러닝(전자학습) 이용표준약관」을 따릅니다.
          </p>

          <h2>제1조 (서비스 유형)</h2>
          <p>회사가 제공하는 유료 서비스는 다음과 같습니다.</p>
          <ul>
            <li><strong>올인원 패스</strong>: 온라인 강의 40강 + 구매 특전(FlowSpot 이용권 4개월 + 크레딧 1,600cr + 얼리버드 보너스 크레딧)</li>
            <li><strong>토큰 팩</strong>: AI 스크립트 생성에 사용되는 크레딧 단위 구매</li>
            <li><strong>구독</strong>: 월간 정기 결제 (향후 제공 예정)</li>
          </ul>

          <h2>제2조 (올인원 패스 환불)</h2>
          <p>
            올인원 패스는 「이러닝(전자학습) 이용표준약관」 제28조 제1항 제2호에 따른
            <strong>학습회차 기준 상품</strong>입니다.
          </p>

          <h3>① 과금 기준</h3>
          <ul>
            <li>올인원 패스 <strong>정가</strong> ₩599,000은 <strong>강의 40강 수강료 전액</strong>으로 책정됩니다. (얼리버드 할인가 ₩499,000 적용 시에도 동일한 % 기준으로 산정)</li>
            <li>FlowSpot 이용권 4개월, 기본 크레딧 1,600cr, 얼리버드 보너스 크레딧은 상품 구매에 부수되는 <strong>특전(사은품)</strong>으로 제공되며, 별도 과금 대상이 아닙니다.</li>
            <li>1강 단가: ₩599,000 ÷ 40강 = <strong>₩14,975</strong></li>
          </ul>

          <h3>② 이용 간주 기준</h3>
          <ul>
            <li>온라인 강의를 <strong>열람하거나 재생을 시작</strong>한 경우, 해당 강의는 1강을 이용한 것으로 간주합니다. (시청 시간과 무관)</li>
            <li>강의 자료를 <strong>다운로드</strong>한 경우에도 해당 강의를 수강한 것으로 처리됩니다.</li>
            <li>구매 특전으로 지급된 <strong>크레딧을 1개라도 사용</strong>한 경우, 재화의 일부 소비로 간주합니다.</li>
          </ul>

          <h3>③ 청약철회 제한 사유 (전자상거래법 제17조 제2항)</h3>
          <p>다음 중 <strong>하나라도 해당</strong>할 경우, 디지털 콘텐츠의 제공이 개시되거나 재화의 일부가 소비된 것으로 간주하여 <strong>환불이 제한</strong>됩니다.</p>
          <ul>
            <li>ㄱ. 강의를 <strong>5강 이상 수강</strong> 또는 자료를 다운로드한 경우</li>
            <li>ㄴ. 지급된 <strong>크레딧을 1개 이상 사용</strong>한 경우</li>
            <li>ㄷ. 결제일로부터 <strong>28일이 경과</strong>한 경우</li>
          </ul>

          <h3>④ 기간별 환불 기준</h3>
          <p>위 ③항의 어떤 조건에도 해당하지 않는 경우, 결제일 기준 경과일에 따라 다음과 같이 환불됩니다.</p>

          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-zinc-300 dark:border-zinc-700 text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">결제일 이후 경과</th>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">환불 금액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>1~7일</strong> (청약철회)</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>전액 환불</strong> (결제 금액 100%)</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>8~14일</strong></td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 금액의 <strong>2/3</strong> − 위약금 10%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>15~28일</strong></td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 금액의 <strong>1/2</strong> − 위약금 10%</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>29일 이후</strong></td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-red-600 dark:text-red-400"><strong>환불 불가</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul>
            <li>위약금: 결제 금액의 10% (정가 기준 ₩59,900)</li>
            <li>공제 금액이 결제 금액을 초과하는 경우 환불 금액은 0원입니다.</li>
          </ul>

          <h3>⑤ 특전 회수</h3>
          <ul>
            <li>환불 시 패스에 포함된 <strong>FlowSpot 이용권 및 잔여 크레딧은 즉시 회수</strong>됩니다.</li>
          </ul>

          <h3>⑥ 이용기한</h3>
          <ul>
            <li>구매한 강의 콘텐츠는 구매일로부터 <strong>4개월간</strong> 시청 가능합니다.</li>
            <li>이용기한 경과 후에는 환불이 불가합니다.</li>
          </ul>

          <h3>⑦ 환불 시뮬레이션 (예시)</h3>
          <p>아래 예시는 <strong>올인원 패스 정가 ₩599,000</strong> 기준이며, 얼리버드 할인가 ₩499,000에도 동일한 % 공식이 적용됩니다.</p>

          <div className="overflow-x-auto my-4">
            <table className="min-w-full border border-zinc-300 dark:border-zinc-700 text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">시점</th>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">수강 상황</th>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">환불 여부</th>
                  <th className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-left">환불 금액</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 3일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">0강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-green-600 dark:text-green-400 font-semibold">전액 환불</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩599,000</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 5일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">3강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-green-600 dark:text-green-400 font-semibold">전액 환불</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩599,000</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 5일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2"><strong>5강 수강</strong> · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-red-600 dark:text-red-400 font-semibold">환불 불가</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩0 (5강 룰)</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 3일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">0강 수강 · <strong>크레딧 1개 사용</strong></td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-red-600 dark:text-red-400 font-semibold">환불 불가</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩0 (크레딧 룰)</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 10일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">2강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-amber-600 dark:text-amber-400 font-semibold">일부 환불</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">
                    ₩339,433<br/>
                    <span className="text-xs text-zinc-500">= 599,000 × 2/3 − 59,900</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 14일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">4강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-amber-600 dark:text-amber-400 font-semibold">일부 환불</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">
                    ₩339,433<br/>
                    <span className="text-xs text-zinc-500">= 599,000 × 2/3 − 59,900</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 20일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">3강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-amber-600 dark:text-amber-400 font-semibold">일부 환불</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">
                    ₩239,600<br/>
                    <span className="text-xs text-zinc-500">= 599,000 × 1/2 − 59,900</span>
                  </td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 29일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">1강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-red-600 dark:text-red-400 font-semibold">환불 불가</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩0 (29일 경과)</td>
                </tr>
                <tr>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">결제 6일차</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">10강 수강 · 크레딧 0 사용</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-red-600 dark:text-red-400 font-semibold">환불 불가</td>
                  <td className="border border-zinc-300 dark:border-zinc-700 px-3 py-2">₩0 (5강 룰)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            ※ 수강 강수에는 <strong>미리보기로 공개된 강의 및 자료 다운로드</strong>가 포함됩니다.<br/>
            ※ &quot;크레딧 사용&quot;은 구매 특전(기본 1,600cr + 보너스 크레딧) 중 1개 이상을 소비한 경우를 의미합니다.<br/>
            ※ 환불 요청 의사를 밝히신 다음 날(영업일 기준)을 기준으로 경과일을 산정합니다.
          </p>

          <h2>제3조 (토큰 팩 환불)</h2>
          <p>토큰 팩은 디지털 콘텐츠 이용권으로, 다음 기준에 따라 환불됩니다.</p>
          <ul>
            <li>결제일로부터 <strong>7일 이내</strong>, 토큰을 <strong>1개도 사용하지 않은 경우</strong> 전액 환불</li>
            <li>토큰을 <strong>1개 이상 사용한 경우</strong> 환불 불가 (디지털 재화 즉시 소비)</li>
            <li>토큰(크레딧) 환불은 <strong>결제 시 사용한 수단</strong>으로 진행됩니다.</li>
            <li>구매한 토큰(크레딧)은 <strong>회원 간 양도, 매매, 이전이 불가</strong>합니다.</li>
            <li>토큰(크레딧)의 사용, 취소, 환불은 <strong>충전일로부터 1년 이내</strong>에 가능하며, 유효기간 경과 후 미사용 토큰은 소멸됩니다.</li>
          </ul>

          <h2>제4조 (구독 취소) — 향후 적용</h2>
          <ul>
            <li>구독은 다음 결제일 전까지 언제든지 취소할 수 있습니다.</li>
            <li>취소 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.</li>
            <li>구독 취소 시 남은 기간에 대한 일할 환불은 제공하지 않습니다.</li>
          </ul>

          <h2>제5조 (환불 절차)</h2>
          <ol>
            <li>
              환불을 원하시는 경우{" "}
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLSebxsymyHg8TKn5N_3XGr6CgTt0d-8tbmyDgqJkdNL3vbkzGg/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 dark:text-violet-400 font-semibold underline"
              >
                환불 신청서
              </a>
              를 작성해 주세요.
            </li>
            <li>신청서 작성 시 <strong>결제 시 사용한 이메일, 결제일, 결제 금액</strong>을 정확히 기재해 주세요.</li>
            <li>접수 후 <strong>3영업일 이내</strong>에 검토 결과를 안내합니다.</li>
            <li>환불 승인 시, 원래 결제 수단으로 <strong>5~7영업일 이내</strong>에 환불됩니다.</li>
            <li><strong>결제 카드 변경</strong>을 원하실 경우에도 위 환불 신청서를 먼저 작성하신 뒤, 환불 완료 후 재결제해 주세요.</li>
          </ol>

          <h2>제6조 (환불이 불가한 경우)</h2>
          <p>다음의 경우 환불이 제한됩니다.</p>
          <ul>
            <li>제2조 ③항의 청약철회 제한 사유에 해당하는 경우</li>
            <li>이용기한(4개월)이 경과한 경우</li>
            <li>서비스 약관 위반으로 이용이 제한된 경우</li>
            <li>공제 금액이 결제 금액을 초과하는 경우</li>
          </ul>

          <h2>제7조 (서비스 장애로 인한 보상)</h2>
          <p>
            회사의 귀책사유로 서비스를 정상적으로 이용하지 못한 경우,
            해당 기간만큼 이용 기간을 연장하거나 환불을 제공합니다.
          </p>

          <h2>제8조 (문의처)</h2>
          <ul>
            <li><strong>서비스명</strong>: FlowSpot (플로우스팟)</li>
            <li><strong>전화</strong>: 070-8027-2849</li>
            <li><strong>이메일</strong>: hmys0205hmys@gmail.com</li>
            <li><strong>운영 시간</strong>: 평일 10:00 ~ 18:00 (공휴일 제외)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
