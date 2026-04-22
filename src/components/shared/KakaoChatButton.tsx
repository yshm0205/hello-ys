"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KAKAO_CHANNEL_ID = "_klhfn";
const KAKAO_SDK_URL = "https://t1.kakaocdn.net/kakaojs/kakao.min.js";

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Channel: {
        chat: (options: { channelPublicId: string }) => void;
      };
    };
  }
}

export function KakaoChatButton() {
  const [sdkReady, setSdkReady] = useState(false);
  const pathname = usePathname();

  const isLecturePlayer = /\/lectures\/vod_/.test(pathname);
  // 랜딩 페이지(로케일 루트)에선 모바일 FloatingCTA 위로 올라가야 겹침 방지
  const isLandingRoot = /^\/[a-z]{2}\/?$/.test(pathname) || pathname === "/";

  useEffect(() => {
    if (window.Kakao?.isInitialized()) {
      setSdkReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = KAKAO_SDK_URL;
    script.async = true;
    script.onload = () => {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (kakaoKey && window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(kakaoKey);
      }
      setSdkReady(true);
    };
    document.head.appendChild(script);
  }, []);

  // 강의 플레이어에서는 숨기기
  if (isLecturePlayer) return null;

  const handleClick = () => {
    if (window.Kakao?.isInitialized()) {
      window.Kakao.Channel.chat({ channelPublicId: KAKAO_CHANNEL_ID });
    } else {
      window.open(`https://pf.kakao.com/${KAKAO_CHANNEL_ID}/chat`, "_blank");
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label="카카오톡 문의"
      className={`fixed ${isLandingRoot ? "bottom-[calc(env(safe-area-inset-bottom)+108px)]" : "bottom-[calc(env(safe-area-inset-bottom)+76px)]"} right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#FEE500] shadow-lg transition-transform hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:h-14 md:w-14`}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 256 256"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M128 36C70.6 36 24 72.2 24 116.8C24 145.4 43.4 170.4 72.6 184.2L63.4 219.6C62.8 222 65.6 223.8 67.6 222.4L109.4 194.6C115.4 195.4 121.6 195.8 128 195.8C185.4 195.8 232 159.4 232 116.8C232 72.2 185.4 36 128 36Z"
          fill="#3C1E1E"
        />
      </svg>
    </button>
  );
}
