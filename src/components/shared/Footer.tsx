import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* 링크 */}
        <nav className="flex flex-wrap justify-center gap-6 mb-6 text-sm">
          <Link href="/terms" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            이용약관
          </Link>
          <Link href="/privacy" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            개인정보처리방침
          </Link>
          <Link href="/refund" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            환불 규정
          </Link>
          <Link href="/support" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            고객지원
          </Link>
        </nav>

        {/* 사업자 정보 */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1 mb-4">
          <p>플로우스팟 | 대표: 이하민, 김예성 | 사업자등록번호: 693-07-02115</p>
          <p>주소: 충남 천안시 서북구 두정동 1225, 401호 | 이메일: hmys0205hmys@gmail.com</p>
        </div>

        {/* 저작권 */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Copyright &copy; {new Date().getFullYear()} FlowSpot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
