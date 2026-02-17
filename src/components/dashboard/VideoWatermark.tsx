'use client';

/**
 * 동적 워터마크 오버레이
 * - 사용자 이메일을 반투명으로 영상 위에 표시
 * - 위치가 주기적으로 변경되어 크롭으로 제거 불가
 * - 복수 개를 타일 형태로 표시하여 어디를 잘라도 남음
 */

import { useEffect, useState } from 'react';

interface VideoWatermarkProps {
    email: string;
}

export function VideoWatermark({ email }: VideoWatermarkProps) {
    const [offset, setOffset] = useState(0);

    // 30초마다 위치 살짝 이동
    useEffect(() => {
        const interval = setInterval(() => {
            setOffset((prev) => (prev + 1) % 4);
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const masked = maskEmail(email);
    const offsets = [
        { top: '15%', left: '10%' },
        { top: '45%', left: '55%' },
        { top: '75%', left: '20%' },
        { top: '35%', left: '75%' },
    ];

    // offset에 따라 각 워터마크 위치를 순환 이동
    const getPosition = (idx: number) => {
        const shifted = (idx + offset) % offsets.length;
        return offsets[shifted];
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                zIndex: 10,
                overflow: 'hidden',
            }}
        >
            {[0, 1, 2, 3].map((idx) => {
                const pos = getPosition(idx);
                return (
                    <span
                        key={idx}
                        style={{
                            position: 'absolute',
                            top: pos.top,
                            left: pos.left,
                            color: 'rgba(255, 255, 255, 0.15)',
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            fontWeight: 500,
                            letterSpacing: '2px',
                            transform: 'rotate(-25deg)',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            transition: 'top 2s ease, left 2s ease',
                        }}
                    >
                        {masked}
                    </span>
                );
            })}
        </div>
    );
}

/** 이메일 일부 마스킹: abc***@gmail.com */
function maskEmail(email: string): string {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    const visible = local.slice(0, 3);
    return `${visible}***@${domain}`;
}
