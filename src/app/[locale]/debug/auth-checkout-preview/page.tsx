interface AuthCheckoutPreviewPageProps {
  params: Promise<{ locale: string }>;
}

export default async function AuthCheckoutPreviewPage({
  params,
}: AuthCheckoutPreviewPageProps) {
  const { locale } = await params;
  const redirect = encodeURIComponent("/checkout/allinone");
  const loginSrc = `/${locale}/login?redirect=${redirect}`;
  const signupSrc = `/${locale}/signup?redirect=${redirect}`;

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/50">
            Debug Preview
          </div>
          <h1 className="text-2xl font-black tracking-tight">체크아웃 유입 로그인/회원가입 미리보기</h1>
          <p className="text-sm text-white/65">
            실제 로그인/회원가입 페이지를 체크아웃 redirect 상태로 나란히 보여줍니다.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white/85">로그인</h2>
              <p className="text-xs text-white/50">{loginSrc}</p>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-2xl">
              <iframe
                title="checkout-login-preview"
                src={loginSrc}
                className="h-[860px] w-full bg-transparent"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-white/85">회원가입</h2>
              <p className="text-xs text-white/50">{signupSrc}</p>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20 shadow-2xl">
              <iframe
                title="checkout-signup-preview"
                src={signupSrc}
                className="h-[860px] w-full bg-transparent"
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
