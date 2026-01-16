/**
 * Toss-style Mantine Theme
 * 토스 디자인 시스템 기반 커스텀 테마
 */

import { createTheme, MantineColorsTuple } from '@mantine/core';

// 토스 블루 컬러 팔레트
const tossBlue: MantineColorsTuple = [
    '#E8F3FF', // 0 - lightest
    '#C9E2FF', // 1
    '#90C2FF', // 2
    '#64A8FF', // 3
    '#3182F6', // 4 - main (토스 블루)
    '#1B64DA', // 5
    '#1957C2', // 6
    '#194AA3', // 7
    '#163D88', // 8
    '#0D2C5E', // 9 - darkest
];

// 토스 그레이 팔레트
const tossGray: MantineColorsTuple = [
    '#F7F8FA', // 0 - 배경
    '#F4F5F7', // 1
    '#E5E8EB', // 2
    '#D1D6DB', // 3
    '#B0B8C1', // 4
    '#8B95A1', // 5 - 서브 텍스트
    '#6B7684', // 6
    '#4E5968', // 7
    '#333D4B', // 8
    '#191F28', // 9 - 메인 텍스트
];

export const tossTheme = createTheme({
    // 색상 설정
    primaryColor: 'toss',
    colors: {
        toss: tossBlue,
        gray: tossGray,
    },

    // 폰트 설정
    fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',

    headings: {
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, sans-serif',
        fontWeight: '700',
        sizes: {
            h1: { fontSize: '56px', lineHeight: '1.2' },
            h2: { fontSize: '40px', lineHeight: '1.3' },
            h3: { fontSize: '28px', lineHeight: '1.4' },
            h4: { fontSize: '22px', lineHeight: '1.5' },
        },
    },

    // 레이아웃 설정
    defaultRadius: 'lg',

    spacing: {
        xs: '8px',
        sm: '12px',
        md: '20px',
        lg: '32px',
        xl: '48px',
    },

    // 그림자 (토스 스타일 - 가볍고 넓은 그림자)
    shadows: {
        xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
        sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
        md: '0 4px 16px rgba(0, 0, 0, 0.06)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.08)',
        xl: '0 16px 48px rgba(0, 0, 0, 0.12)',
    },

    // 컴포넌트 기본 스타일
    components: {
        Button: {
            defaultProps: {
                radius: 'lg',
            },
            styles: {
                root: {
                    fontWeight: 600,
                },
            },
        },
        Card: {
            defaultProps: {
                radius: 'lg',
                shadow: 'sm',
            },
        },
        TextInput: {
            defaultProps: {
                radius: 'md',
            },
        },
        Textarea: {
            defaultProps: {
                radius: 'md',
            },
        },
    },
});
