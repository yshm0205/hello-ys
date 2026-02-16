import { Header } from "@/components/shared/Header";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: `${t("termsTitle")} - FlowSpot`,
  };
}

export default async function TermsPage() {
  const t = await getTranslations("Legal");

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{t("termsTitle")}</h1>
        <div className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-p:text-black dark:prose-p:text-white prose-li:text-black dark:prose-li:text-white prose-strong:text-black dark:prose-strong:text-white">
          <p className="lead">{t("lastUpdated")}: 2026-01-22</p>

          <p>
            본 약관은 플로우스팟(FlowSpot)(이하 &quot;회사&quot;)가 제공하는 서비스의 이용과 관련하여
            회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>

          <h2>1. 서비스의 정의</h2>
          <p>
            FlowSpot은 AI 기반 쇼츠 스크립트 생성 서비스로, 다음의 기능을 제공합니다.
          </p>
          <ul>
            <li>AI를 활용한 쇼츠/릴스 스크립트 자동 생성</li>
            <li>생성된 스크립트 저장 및 관리 (스크립트 보관소)</li>
            <li>YouTube 채널 분석 및 통계 조회</li>
            <li>기타 회사가 추가로 개발하여 제공하는 서비스</li>
          </ul>

          <h2>2. 이용 계약의 체결</h2>
          <ul>
            <li>이용 계약은 이용자가 본 약관에 동의하고 회원가입을 완료함으로써 체결됩니다.</li>
            <li>만 14세 미만의 아동은 서비스를 이용할 수 없습니다.</li>
            <li>회원 계정은 본인만 사용할 수 있으며, 타인에게 양도하거나 공유할 수 없습니다.</li>
          </ul>

          <h2>3. 서비스 이용</h2>
          <h3>콘텐츠 생성</h3>
          <ul>
            <li>AI를 통해 생성된 스크립트의 저작권은 이용자에게 귀속됩니다.</li>
            <li>생성된 콘텐츠의 활용에 대한 책임은 이용자에게 있습니다.</li>
            <li>회사는 AI 생성 콘텐츠의 정확성, 적법성을 보장하지 않습니다.</li>
          </ul>
          <h3>YouTube 연동</h3>
          <ul>
            <li>YouTube 채널 연동 시 Google OAuth를 통해 인증합니다.</li>
            <li>연동된 채널의 통계 정보는 실시간으로 조회되며 별도 저장되지 않습니다.</li>
            <li>이용자는 언제든지 연동을 해제할 수 있습니다.</li>
          </ul>

          <h2>4. 이용자의 의무</h2>
          <p>이용자는 다음의 행위를 하여서는 안 됩니다.</p>
          <ul>
            <li>불법적이거나 사회적으로 유해한 콘텐츠 생성</li>
            <li>타인의 저작권, 상표권 등 지적재산권 침해</li>
            <li>서비스를 이용한 자동화 프로그램(봇) 운영</li>
            <li>서비스의 정상적인 운영을 방해하는 행위</li>
            <li>타인의 계정을 도용하거나 부정 사용</li>
            <li>회사의 사전 동의 없는 영리 목적의 서비스 이용</li>
          </ul>

          <h2>5. 서비스의 변경 및 중단</h2>
          <ul>
            <li>회사는 기술적 필요, 서비스 개선 등의 사유로 서비스 내용을 변경할 수 있습니다.</li>
            <li>중요한 변경사항은 서비스 내 공지 또는 이메일로 사전 안내합니다.</li>
            <li>천재지변, 시스템 장애 등 불가피한 사유 발생 시 서비스가 일시 중단될 수 있습니다.</li>
          </ul>

          <h2>6. 유료 서비스 및 결제</h2>
          <ul>
            <li>유료 서비스의 요금은 서비스 내 요금제 페이지에서 확인할 수 있습니다.</li>
            <li>결제는 포트원(PortOne)을 통해 처리되며, 결제 관련 문의는 회사로 연락 바랍니다.</li>
            <li>구독 취소는 결제 기간 종료 전까지 가능하며, 남은 기간 동안 서비스를 계속 이용할 수 있습니다.</li>
            <li>환불 정책은 <a href="/refund" className="underline">환불 및 취소 규정</a> 페이지를 참고해 주세요.</li>
          </ul>

          <h2>7. 계약 해지 및 이용 제한</h2>
          <ul>
            <li>이용자는 언제든지 서비스 내 설정에서 회원 탈퇴를 할 수 있습니다.</li>
            <li>회사는 이용자가 본 약관을 위반한 경우 서비스 이용을 제한하거나 계약을 해지할 수 있습니다.</li>
            <li>계정 삭제 시 저장된 스크립트 등 모든 데이터가 영구 삭제되며 복구가 불가능합니다.</li>
          </ul>

          <h2>8. 면책 조항</h2>
          <ul>
            <li>회사는 AI가 생성한 콘텐츠의 정확성, 완전성, 적법성을 보장하지 않습니다.</li>
            <li>이용자가 생성한 콘텐츠로 인해 발생하는 문제에 대해 회사는 책임지지 않습니다.</li>
            <li>제3자 서비스(YouTube, 결제대행사 등)의 장애로 인한 서비스 이용 불가에 대해 회사는 책임지지 않습니다.</li>
          </ul>

          <h2>9. 분쟁 해결</h2>
          <ul>
            <li>본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.</li>
            <li>서비스 이용과 관련하여 분쟁이 발생한 경우 회사의 소재지 관할 법원을 관할 법원으로 합니다.</li>
          </ul>

          <h2>10. 문의처</h2>
          <ul>
            <li><strong>서비스명</strong>: FlowSpot (플로우스팟)</li>
            <li><strong>운영자</strong>: 이하민, 김예성</li>
            <li><strong>이메일</strong>: hmys0205hmys@gmail.com</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
