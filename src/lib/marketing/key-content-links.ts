export const KEY_CONTENTS = [
  { id: "2A095uwYkHs", title: "쇼츠 채널을 망치는 흔한 조언 3가지" },
  { id: "-WxxxydhIuQ", title: "유튜브는 재능이 아닙니다 · 100만 영상의 차이" },
  { id: "j-NizYVSYKY", title: "쇼츠 조회수 1억 찍은 방법" },
  { id: "n7Z513iRMdA", title: "2026년 유튜브가 또 바꾼 3가지" },
] as const;

export type KeyPlacement = "pin" | "description";

export function findKeyContent(id: string) {
  return KEY_CONTENTS.find((video) => video.id === id);
}

export function keyContentLink(id: string, placement: KeyPlacement) {
  return `https://flowspot.kr/go/${id}?p=${placement}`;
}

export function keyContentDestination(id: string, placement: KeyPlacement) {
  if (!findKeyContent(id)) return null;
  const params = new URLSearchParams({
    utm_source: "youtube",
    utm_medium: "organic_video",
    utm_campaign: "allinone",
    utm_content: id,
    placement,
  });
  return `/ko?${params}`;
}
