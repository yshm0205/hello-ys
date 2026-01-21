import { Header } from "@/components/shared/Header";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = await getTranslations({ locale, namespace: "Legal" });
  return {
    title: `${t("privacyTitle")} - FlowSpot`,
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("Legal");

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-8">{t("privacyTitle")}</h1>
        <div className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-p:text-black dark:prose-p:text-white prose-li:text-black dark:prose-li:text-white prose-strong:text-black dark:prose-strong:text-white">
          <p className="lead">{t("lastUpdated")}: 2026-01-22</p>

          <p>
            플로우스팟(FlowSpot)(이하 &quot;회사&quot;)는 이용자의 개인정보를 중요시하며,
            「개인정보 보호법」을 준수하고 있습니다.
          </p>

          <h2>1. 개인정보의 수집 항목 및 방법</h2>
          <h3>수집하는 개인정보 항목</h3>
          <ul>
            <li><strong>필수 정보</strong>: 이메일 주소 (Google 로그인 또는 매직링크 로그인 시)</li>
            <li><strong>선택 정보</strong>: 표시 이름, YouTube 채널 정보 (채널 연동 시)</li>
            <li><strong>자동 수집 정보</strong>: 서비스 이용 기록, 접속 로그, 쿠키, IP 주소</li>
          </ul>
          <h3>수집 방법</h3>
          <ul>
            <li>회원가입 및 로그인 과정에서 수집</li>
            <li>서비스 이용 과정에서 자동 생성되어 수집</li>
            <li>YouTube 채널 연동 시 API를 통해 수집</li>
          </ul>

          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <ul>
            <li><strong>서비스 제공</strong>: AI 스크립트 생성, 스크립트 보관, YouTube 채널 분석</li>
            <li><strong>회원 관리</strong>: 회원가입 및 로그인, 본인 확인</li>
            <li><strong>고객 지원</strong>: 문의 응대 및 공지사항 전달</li>
            <li><strong>서비스 개선</strong>: 서비스 이용 통계 분석, 신규 기능 개발</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            회사는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
            단, 관련 법령에 따라 보관이 필요한 경우에는 해당 기간 동안 보관합니다.
          </p>
          <ul>
            <li><strong>회원 정보</strong>: 회원 탈퇴 시까지</li>
            <li><strong>스크립트 생성 기록</strong>: 회원 탈퇴 시 삭제</li>
            <li><strong>고객 문의 기록</strong>: 3년 (전자상거래법)</li>
            <li><strong>결제 기록</strong>: 5년 (전자상거래법)</li>
          </ul>

          <h2>4. 개인정보의 제3자 제공</h2>
          <p>
            회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
            다만, 다음의 서비스 제공을 위해 아래 업체와 정보를 공유합니다.
          </p>
          <ul>
            <li><strong>Google</strong>: OAuth 로그인 인증, YouTube API 연동</li>
            <li><strong>LemonSqueezy</strong>: 결제 처리 (결제 정보는 LemonSqueezy에서 직접 관리)</li>
            <li><strong>Supabase</strong>: 데이터베이스 호스팅</li>
            <li><strong>Vercel</strong>: 웹사이트 호스팅</li>
          </ul>

          <h2>5. 쿠키의 사용</h2>
          <p>회사는 다음의 목적으로 쿠키를 사용합니다.</p>
          <ul>
            <li><strong>인증 쿠키</strong>: 로그인 상태 유지</li>
            <li><strong>YouTube 토큰</strong>: YouTube 채널 연동 기능 제공</li>
            <li><strong>설정 쿠키</strong>: 언어 설정, UI 상태 저장</li>
          </ul>
          <p>
            브라우저 설정에서 쿠키를 거부할 수 있으나, 일부 서비스 이용이 제한될 수 있습니다.
          </p>

          <h2>6. 개인정보의 파기</h2>
          <p>
            회사는 개인정보 보유 기간의 경과, 처리 목적 달성 등 개인정보가 불필요하게 되었을 때에는
            지체 없이 해당 개인정보를 파기합니다.
          </p>

          <h2>7. 이용자의 권리</h2>
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
          <ul>
            <li>개인정보 열람 요청</li>
            <li>개인정보 정정 요청</li>
            <li>개인정보 삭제 요청</li>
            <li>개인정보 처리 정지 요청</li>
          </ul>

          <h2>8. 개인정보 보호책임자</h2>
          <ul>
            <li><strong>운영자</strong>: 이하민, 김예성</li>
            <li><strong>이메일</strong>: hmys0205hmys@gmail.com</li>
          </ul>

          <h2>9. 개인정보처리방침의 변경</h2>
          <p>
            본 개인정보처리방침은 법령 또는 서비스 변경에 따라 변경될 수 있으며,
            변경 시 서비스 내 공지사항을 통해 안내합니다.
          </p>
        </div>
      </main>
    </div>
  );
}
