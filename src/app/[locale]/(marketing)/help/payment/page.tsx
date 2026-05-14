import { Header } from "@/components/shared/Header";

export async function generateMetadata() {
  return {
    title: `결제 안내 - FlowSpot`,
    description: "토스페이로 처음 결제하시는 분을 위한 안내. 모바일·PC 단계별 설명과 자주 묻는 질문.",
  };
}

export default function PaymentHelpPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-4">결제 안내</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
          토스페이로 처음 결제하시나요? 결제 흐름이 익숙하지 않으면 당황하실 수 있어서 미리 안내해드려요.
        </p>

        <div className="prose dark:prose-invert max-w-none prose-headings:text-black dark:prose-headings:text-white prose-p:text-black dark:prose-p:text-white prose-li:text-black dark:prose-li:text-white prose-strong:text-black dark:prose-strong:text-white">

          <h2>🟣 토스페이가 뭐예요?</h2>
          <p>
            토스 앱과 연결된 간편결제입니다. <strong>카드 한 번만 등록</strong>해두면 다음부터는 비밀번호로 빠르게 결제할 수 있어요.
            카드 정보는 FlowSpot이 아니라 토스에만 안전하게 저장됩니다.
          </p>

          <h2>📱 모바일에서 결제하기</h2>
          <ol>
            <li>FlowSpot 결제 페이지에서 <strong>[토스페이]</strong> 버튼을 누르세요.</li>
            <li>
              토스 앱이 설치되어 있으면 자동으로 토스 앱이 열려요.
              <br />
              <span className="text-gray-600 dark:text-gray-400">→ 설치 안 되어 있으면 앱스토어로 자동 안내됩니다. <strong>당황하지 마세요. 정상이에요.</strong></span>
            </li>
            <li>토스 앱에서 카드 또는 계좌를 한 번만 등록합니다.</li>
            <li>토스 비밀번호 입력 → 결제 완료.</li>
            <li>FlowSpot으로 자동 복귀합니다.</li>
          </ol>

          <h2>💻 PC에서 결제하기</h2>
          <ol>
            <li>FlowSpot 결제 페이지에서 <strong>[토스페이]</strong> 버튼을 누르세요.</li>
            <li>화면에 <strong>QR 코드</strong>가 표시됩니다.</li>
            <li>휴대폰 카메라(또는 토스 앱)로 QR을 스캔하세요.</li>
            <li>휴대폰의 토스 앱에서 결제 진행 (카드 선택 + 비밀번호).</li>
            <li>휴대폰에서 결제 완료되면 PC 화면도 자동으로 다음 단계로 넘어갑니다.</li>
          </ol>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ※ PC에서 토스 앱이 휴대폰에 없으시면, 먼저 휴대폰에서{" "}
            <a href="https://toss.im/download" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline">
              toss.im/download
            </a>{" "}
            로 토스 앱을 설치해주세요.
          </p>

          <h2>❓ 자주 묻는 질문</h2>

          <h3>Q. 토스 회원이 아닌데 결제할 수 있나요?</h3>
          <p>
            네. 첫 결제 시 토스 앱에서 휴대폰 본인인증으로 가입할 수 있어요. 가입 후 카드 등록 → 결제 진행됩니다.
          </p>

          <h3>Q. 카드 정보가 FlowSpot에 저장되나요?</h3>
          <p>
            아닙니다. 카드 정보는 <strong>토스</strong>에만 안전하게 저장됩니다. FlowSpot은 결제 결과만 받습니다.
          </p>

          <h3>Q. 결제 중 화면이 멈췄어요.</h3>
          <p>
            네트워크 일시 끊김일 수 있어요. 다음 순서로 확인해주세요.
          </p>
          <ul>
            <li>휴대폰 토스 앱이 정상적으로 실행 중인지 확인</li>
            <li>토스 앱에서 결제가 완료됐는지 확인 (앱 알림함)</li>
            <li>PC 결제 페이지 새로고침 후 다시 시도</li>
            <li>그래도 안 되면 아래 지원 페이지로 문의주세요</li>
          </ul>

          <h3>Q. 결제 후 영수증은 어디서 보나요?</h3>
          <p>
            토스 앱 → 홈 → 결제 내역에서 확인하실 수 있습니다. 사업자 영수증이 필요하시면{" "}
            <a href="/support" className="text-violet-600 dark:text-violet-400 underline">고객 지원</a>으로 연락주세요.
          </p>

          <h3>Q. 환불은 어떻게 하나요?</h3>
          <p>
            환불 규정은{" "}
            <a href="/refund" className="text-violet-600 dark:text-violet-400 underline">환불 및 취소 규정</a>
            {" "}페이지를 참고해주세요.
          </p>

          <h2>📞 도움이 더 필요하신가요?</h2>
          <p>
            결제가 안 되거나 흐름이 헷갈리시면{" "}
            <a href="/support" className="text-violet-600 dark:text-violet-400 underline">고객 지원</a>{" "}
            페이지에서 문의 남겨주세요. 영업일 기준 24시간 이내 답변드립니다.
          </p>

          <h2>🔗 토스 공식 안내</h2>
          <ul>
            <li>
              <a href="https://toss.im/download" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline">
                토스 앱 다운로드
              </a>
            </li>
            <li>
              <a href="https://toss.im/tossfeed/article/tosspay-2025-02" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline">
                토스페이 사용법 (토스피드 공식 가이드)
              </a>
            </li>
          </ul>
        </div>

        {/* ── 랜딩 CTA ── */}
        <div className="mt-16 rounded-2xl border border-violet-500/30 bg-gradient-to-b from-violet-500/10 to-violet-500/[0.02] p-8 text-center">
          <p className="mb-2 text-lg font-bold text-black dark:text-white">
            강의가 궁금하신가요?
          </p>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-300">
            채널 성과와 커리큘럼을 확인하고 강의를 신청해보세요.
          </p>
          <a
            href="/"
            className="inline-block rounded-xl bg-violet-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-violet-700"
          >
            강의 신청하러 가기 →
          </a>
        </div>
      </main>
    </div>
  );
}
