'use client';

import { Box, Stack, Text, TextInput, Textarea } from '@mantine/core';

export interface LifetipsStructuredValue {
    product: string;
    brand: string;
    reviews: string;
    notes: string;
}

export const emptyLifetipsStructured: LifetipsStructuredValue = {
    product: '',
    brand: '',
    reviews: '',
    notes: '',
};

/**
 * 상세 입력 4개 필드 → 백엔드 MaterialAnalyzer가 받는 표준 텍스트로 조립.
 * 비어있는 섹션은 출력하지 않음.
 */
export function assembleLifetipsMaterial(v: LifetipsStructuredValue): string {
    const sections: string[] = [];
    if (v.product.trim()) sections.push(`[제품명]\n${v.product.trim()}`);
    if (v.brand.trim()) sections.push(`[브랜드]\n${v.brand.trim()}`);
    if (v.reviews.trim()) sections.push(`[사용자 리뷰]\n${v.reviews.trim()}`);
    if (v.notes.trim()) sections.push(`[추가 정보]\n${v.notes.trim()}`);
    return sections.join('\n\n');
}

/** 제품명 + 리뷰 둘 다 필수 */
export function isLifetipsStructuredValid(v: LifetipsStructuredValue): boolean {
    return v.product.trim().length > 0 && v.reviews.trim().length > 0;
}

interface Props {
    value: LifetipsStructuredValue;
    onChange: (next: LifetipsStructuredValue) => void;
}

export function LifetipsStructuredInput({ value, onChange }: Props) {
    const update = (patch: Partial<LifetipsStructuredValue>) => {
        onChange({ ...value, ...patch });
    };

    return (
        <Stack gap="md">
            <Box>
                <Text size="sm" fw={600} mb={6}>
                    🏷️ 제품명{' '}
                    <Text component="span" c="red.5" size="xs">
                        *
                    </Text>
                </Text>
                <TextInput
                    placeholder="예: 진공 압축 백팩 / VacPack-Elite"
                    value={value.product}
                    onChange={(e) => update({ product: e.currentTarget.value })}
                />
            </Box>

            <Box>
                <Text size="sm" fw={600} mb={6}>
                    🏭 브랜드명{' '}
                    <Text component="span" c="dimmed" size="xs">
                        (선택)
                    </Text>
                </Text>
                <TextInput
                    placeholder="예: 이케아, 다이소, 한샘"
                    value={value.brand}
                    onChange={(e) => update({ brand: e.currentTarget.value })}
                />
            </Box>

            <Box>
                <Text size="sm" fw={600} mb={6}>
                    ⭐ 리뷰{' '}
                    <Text component="span" c="red.5" size="xs">
                        *
                    </Text>
                </Text>
                <Textarea
                    placeholder={
                        '실제 사용자 후기를 복붙해주세요. 여러 줄 OK.\n\n예시:\n- 부피가 진짜 반으로 줄어요\n- 무게는 그대로라 어깨가 아픔\n- 캐리어 안 들고 갈 수 있어서 편함'
                    }
                    value={value.reviews}
                    onChange={(e) => update({ reviews: e.currentTarget.value })}
                    minRows={4}
                    maxRows={10}
                    autosize
                />
            </Box>

            <Box>
                <Text size="sm" fw={600} mb={6}>
                    📝 추가 정보{' '}
                    <Text component="span" c="dimmed" size="xs">
                        (선택)
                    </Text>
                </Text>
                <Textarea
                    placeholder="제품 특징·활용 시나리오·꼭 넣고 싶은 정보 등 자유롭게"
                    value={value.notes}
                    onChange={(e) => update({ notes: e.currentTarget.value })}
                    minRows={2}
                    maxRows={5}
                    autosize
                />
            </Box>
        </Stack>
    );
}
