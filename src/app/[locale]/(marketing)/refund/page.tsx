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
            플로우스팟(FlowSpot)(이하 &quot;회사&quot;)의 유료 서비스 환불 및 취소 규정은
            「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 아래와 같이 운영됩니다.
          </p>

          <h2>1. 서비스 유형</h2>
          <p>회사가 제공하는 유료 서비스는 다음과 같습니다.</p>
          <ul>
            <li><strong>번들 패키지</strong>: 강의 수강권 + FlowSpot 이용권 + 크레딧(토큰) 포함</li>
            <li><strong>토큰 팩</strong>: AI 스크립트 생성에 사용되는 크레딧 단위 구매 (30개 / 100개 / 300개)</li>
            <li><strong>구독</strong>: 월간 정기 결제 (향후 제공 예정)</li>
          </ul>

          <h2>2. 환불 가능 기간</h2>
          <ul>
            <li><strong>토큰 팩 / 번들 패키지</strong>: 결제일로부터 <strong>7일 이내</strong>, 토큰(크레딧)을 1개도 사용하지 않은 경우 전액 환불 가능</li>
            <li><strong>구독</strong>: 결제일로부터 <strong>7일 이내</strong>, 서비스를 이용하지 않은 경우 전액 환불 가능</li>
          </ul>

          <h2>3. 환불이 제한되는 경우</h2>
          <p>다음의 경우 환불이 제한됩니다.</p>
          <ul>
            <li>구매한 토큰(크레딧)을 1개 이상 사용한 경우</li>
            <li>번들에 포함된 강의를 1개 이상 수강한 경우</li>
            <li>결제일로부터 7일이 경과한 경우</li>
            <li>서비스 약관 위반으로 이용이 제한된 경우</li>
          </ul>

          <h2>4. 부분 환불</h2>
          <p>
            토큰을 일부 사용한 경우, 사용한 토큰에 해당하는 금액(정가 기준)을 차감한 나머지 금액을
            환불받을 수 있습니다. 단, 결제일로부터 7일 이내에 환불을 요청한 경우에 한합니다.
          </p>

          <h2>5. 구독 취소</h2>
          <ul>
            <li>구독은 다음 결제일 전까지 언제든지 취소할 수 있습니다.</li>
            <li>취소 후에도 현재 결제 기간이 끝날 때까지 서비스를 이용할 수 있습니다.</li>
            <li>구독 취소 시 남은 기간에 대한 일할 환불은 제공하지 않습니다.</li>
          </ul>

          <h2>6. 환불 절차</h2>
          <ol>
            <li>아래 이메일로 환불을 요청합니다.</li>
            <li>환불 요청 시 <strong>결제 시 사용한 이메일, 결제일, 결제 금액</strong>을 함께 기재해 주세요.</li>
            <li>환불 요청 접수 후 <strong>3영업일 이내</strong>에 검토 결과를 안내합니다.</li>
            <li>환불 승인 시, 원래 결제 수단으로 <strong>5~7영업일 이내</strong>에 환불됩니다.</li>
          </ol>

          <h2>7. 서비스 장애로 인한 환불</h2>
          <p>
            회사의 귀책사유로 서비스를 정상적으로 이용하지 못한 경우,
            해당 기간만큼 이용 기간을 연장하거나 환불을 제공합니다.
          </p>

          <h2>8. 문의처</h2>
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
