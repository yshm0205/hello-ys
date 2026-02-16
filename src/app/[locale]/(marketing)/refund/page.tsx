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
          <p className="lead">시행일: 2026-02-16</p>

          <p>
            본 규정은 플로우스팟(FlowSpot)(이하 &quot;회사&quot;)이 제공하는 유료 서비스의
            환불 및 취소에 관한 사항을 규정합니다.
            본 규정은 「전자상거래 등에서의 소비자보호에 관한 법률」 및
            「이러닝(전자학습) 이용표준약관」을 따릅니다.
          </p>

          <h2>제1조 (서비스 유형)</h2>
          <p>회사가 제공하는 유료 서비스는 다음과 같습니다.</p>
          <ul>
            <li><strong>올인원 패스</strong>: 온라인 강의 + FlowSpot 이용권 + AI 크레딧(토큰) 포함</li>
            <li><strong>토큰 팩</strong>: AI 스크립트 생성에 사용되는 크레딧 단위 구매</li>
            <li><strong>구독</strong>: 월간 정기 결제 (향후 제공 예정)</li>
          </ul>

          <h2>제2조 (올인원 패스 환불)</h2>
          <p>
            올인원 패스는 「이러닝(전자학습) 이용표준약관」 제28조 제1항 제2호에 따른
            <strong>학습회차 기준 상품</strong>에 해당합니다.
          </p>

          <h3>① 과금 기준</h3>
          <ul>
            <li>본 상품은 수강기간이 아닌 <strong>강의 회차(강의 수)</strong>를 기준으로 판매됩니다.</li>
            <li>패스에 포함된 FlowSpot 이용권 및 크레딧(토큰)은 <strong>구매 특전</strong>으로 제공되며, 별도 과금 대상이 아닙니다.</li>
          </ul>

          <h3>② 이용 간주 기준</h3>
          <ul>
            <li>온라인 강의 콘텐츠를 <strong>열람하거나 재생을 시작</strong>한 경우, 해당 강의는 1강좌를 이용한 것으로 간주합니다.</li>
            <li>시청 시간의 길이와 관계없이 <strong>1회 열람 시 1강 이용</strong>으로 처리됩니다.</li>
            <li>강의 자료를 다운로드한 경우에도 해당 강의를 수강한 것으로 간주합니다.</li>
          </ul>

          <h3>③ 청약철회 (7일 이내)</h3>
          <ul>
            <li>결제일로부터 <strong>7일 이내</strong>, 강의를 <strong>1강도 이용하지 않은 경우</strong> 전액 환불됩니다.</li>
            <li>7일 이내라도 강의를 이용한 경우, 아래 ④항의 공제 기준이 적용됩니다.</li>
          </ul>

          <h3>④ 중도해지 및 환불 금액 산정</h3>
          <p>중도해지 시 환불 금액은 다음과 같이 산정됩니다.</p>
          <p><strong>환불 금액 = 결제 금액 - (1강 단가 × 수강한 강의 수) - 위약금</strong></p>
          <ul>
            <li><strong>1강 단가</strong>: 결제 금액 ÷ 총 강의 수 (소수점 이하 올림)</li>
            <li><strong>위약금</strong>: 총 결제 금액의 10%</li>
            <li>공제 금액이 결제 금액을 초과하는 경우 환불 금액은 0원입니다.</li>
          </ul>

          <h3>⑤ 특전 회수</h3>
          <ul>
            <li>환불 시 패스에 포함된 <strong>FlowSpot 이용권 및 잔여 크레딧(토큰)은 즉시 회수</strong>됩니다.</li>
            <li>이미 사용한 크레딧(토큰)에 대해서는 별도 공제하지 않습니다.</li>
          </ul>

          <h3>⑥ 이용기한</h3>
          <ul>
            <li>구매한 강의 콘텐츠는 구매일로부터 <strong>4개월간</strong> 시청 가능합니다.</li>
            <li>이용기한은 시청 편의를 위한 기간으로, 과금 기준 또는 환불 산정 기준에는 영향을 미치지 않습니다.</li>
            <li>이용기한 경과 후에는 환불이 불가합니다.</li>
          </ul>

          <h2>제3조 (토큰 팩 환불)</h2>
          <p>토큰 팩은 디지털 콘텐츠 이용권으로, 다음 기준에 따라 환불됩니다.</p>
          <ul>
            <li>결제일로부터 <strong>7일 이내</strong>, 토큰을 <strong>1개도 사용하지 않은 경우</strong> 전액 환불</li>
            <li>토큰을 <strong>1개 이상 사용한 경우</strong> 환불 불가 (디지털 재화 즉시 소비)</li>
          </ul>

          <h2>제4조 (구독 취소) — 향후 적용</h2>
          <ul>
            <li>구독은 다음 결제일 전까지 언제든지 취소할 수 있습니다.</li>
            <li>취소 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.</li>
            <li>구독 취소 시 남은 기간에 대한 일할 환불은 제공하지 않습니다.</li>
          </ul>

          <h2>제5조 (환불 절차)</h2>
          <ol>
            <li>아래 이메일로 환불을 요청합니다.</li>
            <li>요청 시 <strong>결제 시 사용한 이메일, 결제일, 결제 금액</strong>을 함께 기재해 주세요.</li>
            <li>환불 요청 접수 후 <strong>3영업일 이내</strong>에 검토 결과를 안내합니다.</li>
            <li>환불 승인 시, 원래 결제 수단으로 <strong>5~7영업일 이내</strong>에 환불됩니다.</li>
          </ol>

          <h2>제6조 (환불이 불가한 경우)</h2>
          <p>다음의 경우 환불이 제한됩니다.</p>
          <ul>
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
            <li><strong>이메일</strong>: hmys0205hmys@gmail.com</li>
            <li><strong>운영 시간</strong>: 평일 10:00 ~ 18:00 (공휴일 제외)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
