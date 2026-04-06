# 관리자 대시보드 개선 계획

## 현재 상태 분석

### 기존 구현 (5개 페이지)
| 페이지 | 경로 | 완성도 | 미완성 항목 |
|--------|------|--------|-------------|
| Overview | `/admin/overview` | 90% | 이탈률 미구현, 차트 하드코딩 |
| Sales | `/admin/sales` | 100% | - |
| Customers | `/admin/customers` | 80% | 상세 페이지 없음, 구독 취소 미연결 |
| Tickets | `/admin/tickets` | 100% | - |
| Webhooks | `/admin/webhooks` | 100% | - |

### 기존 기술 스택
- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **DB**: Supabase (PostgreSQL, RLS)
- **UI**: Mantine + shadcn/ui + Tailwind CSS 4
- **결제**: LemonSqueezy + Toss Payments
- **차트**: Recharts
- **인증**: Supabase Auth (Google OAuth, Magic Link)
- **관리자 인증**: `ADMIN_EMAILS` 환경변수 기반

---

## Phase 1: 기존 미완성 기능 완성

### 1-1. Overview 페이지 개선
**파일**: `src/app/[locale]/admin/overview/page.tsx`

- [ ] **이탈률(Churn Rate) 계산 구현**
  - `subscriptions` 테이블에서 `cancelled` 상태 비율 계산
  - 기간별 이탈률 (최근 30일 기준)
  - 공식: `(기간 내 취소 수 / 기간 시작 시 활성 구독자 수) × 100`

- [ ] **실제 차트 데이터 연동**
  - 하드코딩된 월별 데이터 → Supabase에서 실제 매출 데이터 조회
  - `subscriptions` + `purchases` 테이블 기반 월별/일별/주별 매출 집계
  - 기간 선택 필터 (Daily/Weekly/Monthly/Yearly) 실제 동작 연결

- [ ] **전월 대비 성장률 표시**
  - MRR, 구독자 수의 전월 대비 증감률 배지 추가

### 1-2. Customers 상세 페이지
**새 파일**: `src/app/[locale]/admin/customers/[id]/page.tsx`

- [ ] **고객 상세 정보 표시**
  - 프로필: 이메일, 이름, 가입일, 마지막 로그인
  - 구독 정보: 현재 플랜, 상태, 시작일, 갱신일, 결제 금액
  - LemonSqueezy 고객 링크

- [ ] **구독 취소 기능 연결**
  - LemonSqueezy API를 통한 실제 구독 취소 액션
  - 취소 확인 다이얼로그
  - 취소 후 상태 업데이트

- [ ] **고객별 활동 이력**
  - 크레딧 충전/사용 내역
  - 스크립트 생성 이력
  - 결제 내역

---

## Phase 2: 크레딧/결제 관리 (신규)

### 2-1. 크레딧 관리 페이지
**새 파일**: `src/app/[locale]/admin/credits/page.tsx`

- [ ] **크레딧 현황 대시보드**
  - 전체 크레딧 발행량 / 사용량 / 잔여량 통계 카드
  - 일별/주별/월별 크레딧 사용 추이 차트

- [ ] **크레딧 거래 내역 테이블**
  - 충전/사용/차감/환불 구분
  - 사용자별 검색 + 유형별 필터
  - 페이지네이션

- [ ] **수동 크레딧 조정**
  - 특정 사용자에게 크레딧 수동 부여/차감
  - 조정 사유 입력 필수
  - 조정 이력 로깅

### 2-2. 결제 관리 페이지
**새 파일**: `src/app/[locale]/admin/payments/page.tsx`

- [ ] **결제 트랜잭션 목록**
  - Toss Payments + LemonSqueezy 통합 결제 내역
  - 결제 상태별 필터 (성공/실패/취소/환불)
  - 결제 수단, 금액, 날짜 표시

- [ ] **환불 처리**
  - 결제 건별 환불 처리 기능
  - 부분 환불 / 전체 환불 지원
  - 환불 사유 기록

- [ ] **매출 통계**
  - 일별/월별 매출 그래프
  - 결제 수단별 비율 파이차트
  - 평균 결제 금액, 총 매출 등 KPI 카드

---

## Phase 3: 강의/VOD 관리 (신규)

### 3-1. 강의 관리 페이지
**새 파일**: `src/app/[locale]/admin/lectures/page.tsx`

- [ ] **강의 목록 관리**
  - 전체 강의 리스트 (제목, 상태, 등록일, 수강생 수)
  - 강의 검색 및 상태 필터 (공개/비공개/준비중)

- [ ] **강의 CRUD**
  - 새 강의 등록 (제목, 설명, 썸네일, 동영상 URL)
  - 강의 정보 수정
  - 강의 공개/비공개 전환
  - 강의 삭제 (확인 다이얼로그)

- [ ] **수강생 현황**
  - 강의별 수강생 목록
  - 수강 진도율 확인
  - 완료율 통계

- [ ] **강의 자료 관리**
  - 강의별 첨부 자료 업로드/삭제
  - 자료 다운로드 횟수 통계

---

## Phase 4: 사용자 활동 모니터링 (신규)

### 4-1. 활동 모니터링 대시보드
**새 파일**: `src/app/[locale]/admin/activity/page.tsx`

- [ ] **핵심 지표 카드**
  - DAU (일별 활성 사용자)
  - 오늘 스크립트 생성 수
  - 오늘 크레딧 사용량
  - 신규 가입자 수

- [ ] **사용자 활동 추이 차트**
  - 일별 활성 사용자 수 그래프
  - 스크립트 생성량 추이
  - 크레딧 소비 추이

- [ ] **인기 기능 분석**
  - 기능별 사용 빈도 (스크립트, 분석, HOT리스트 등)
  - 사용자별 기능 이용 패턴

- [ ] **사용자 목록**
  - 전체 가입자 목록 (가입일, 마지막 접속, 크레딧 잔액)
  - 활동 기반 정렬 (최근 활동순, 크레딧 사용순)
  - 사용자 검색

---

## Phase 5: HOT 리스트 관리 (신규)

### 5-1. HOT 리스트 관리 페이지
**새 파일**: `src/app/[locale]/admin/hot-list/page.tsx`

- [ ] **수집 현황**
  - 최근 수집 일시 및 상태
  - 수집된 데이터 총 건수
  - Cron 작업 상태 모니터링

- [ ] **수동 수집 트리거**
  - "지금 수집" 버튼 (수동 cron 실행)
  - 수집 진행 상태 표시

- [ ] **수집 데이터 관리**
  - 날짜별 수집 데이터 조회
  - 개별 항목 수정/삭제
  - 카테고리/키워드 필터

- [ ] **수집 설정**
  - 수집 주기 설정
  - 수집 카테고리/키워드 관리
  - 수집 로그 조회

---

## Phase 6: UI/UX 개선

### 6-1. 네비게이션 개선
**수정 파일**: `src/app/[locale]/admin/layout.tsx`

- [ ] **사이드바 네비게이션 도입**
  - 현재 탭 기반 → 좌측 사이드바로 변경
  - 섹션별 그룹화:
    - 📊 대시보드: Overview, Activity
    - 💰 매출: Sales, Credits, Payments
    - 👥 고객: Customers
    - 🎓 콘텐츠: Lectures, HOT List
    - 🛠 시스템: Tickets, Webhooks
  - 모바일: 햄버거 메뉴로 사이드바 토글
  - 접힘/펼침 상태 기억

### 6-2. 공통 컴포넌트 개선
- [ ] **통계 카드 컴포넌트 통일**
  - 아이콘, 값, 라벨, 증감률 표시
  - 로딩 스켈레톤 추가

- [ ] **테이블 컴포넌트 개선**
  - 열 정렬 기능
  - 행 선택 (체크박스)
  - CSV 내보내기 버튼

- [ ] **차트 컴포넌트 표준화**
  - 공통 차트 래퍼 (기간 선택, 타입 전환)
  - 반응형 차트 크기

### 6-3. 전반적 UX 개선
- [ ] **로딩 상태 개선**
  - 페이지별 스켈레톤 UI
  - 데이터 패칭 중 로딩 인디케이터

- [ ] **알림/토스트 통일**
  - 성공/실패/경고 토스트 디자인 일관성
  - 액션 완료 시 피드백

- [ ] **반응형 디자인 강화**
  - 모바일 테이블 → 카드 뷰 전환
  - 모바일 차트 최적화

---

## 구현 우선순위

| 순서 | Phase | 예상 규모 | 핵심 가치 |
|------|-------|-----------|-----------|
| 1 | Phase 1 | 중 | 기존 불완전한 기능 완성 → 즉시 활용 가능 |
| 2 | Phase 6-1 | 중 | 사이드바 도입 → 새 페이지 추가 전 구조 정립 |
| 3 | Phase 2 | 대 | 크레딧/결제 관리 → 핵심 비즈니스 기능 |
| 4 | Phase 4 | 중 | 사용자 활동 → 서비스 성장 인사이트 |
| 5 | Phase 3 | 대 | 강의 관리 → 콘텐츠 운영 효율화 |
| 6 | Phase 5 | 소 | HOT 리스트 → 운영 편의성 |
| 7 | Phase 6-2,3 | 중 | UI 마무리 → 완성도 향상 |

---

## 필요한 DB 테이블 (신규/수정)

### 신규 테이블
```sql
-- 크레딧 거래 이력 (이미 존재할 수 있음 - 확인 필요)
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('charge', 'usage', 'refund', 'manual_add', 'manual_deduct')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 활동 로그
CREATE TABLE user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 강의 테이블 (이미 존재할 수 있음 - 확인 필요)
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 수강 진도
CREATE TABLE lecture_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  lecture_id UUID REFERENCES lectures(id),
  progress_percent NUMERIC DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lecture_id)
);
```

---

## 파일 구조 (예상)

```
src/app/[locale]/admin/
├── layout.tsx                    # 사이드바 네비게이션 (Phase 6)
├── overview/page.tsx             # 개선 (Phase 1)
├── customers/
│   ├── page.tsx                  # 기존
│   └── [id]/page.tsx             # 신규 (Phase 1)
├── sales/page.tsx                # 기존
├── credits/page.tsx              # 신규 (Phase 2)
├── payments/page.tsx             # 신규 (Phase 2)
├── lectures/page.tsx             # 신규 (Phase 3)
├── activity/page.tsx             # 신규 (Phase 4)
├── hot-list/page.tsx             # 신규 (Phase 5)
├── tickets/page.tsx              # 기존
└── webhooks/page.tsx             # 기존

src/components/admin/
├── AdminChart.tsx                # 개선 (Phase 6)
├── AdminFilter.tsx               # 기존
├── AdminSearch.tsx               # 기존
├── AdminPagination.tsx           # 기존
├── AdminSidebar.tsx              # 신규 (Phase 6)
├── AdminStatCard.tsx             # 신규 (Phase 6)
├── AdminTableExport.tsx          # 신규 (Phase 6)
├── CreditAdjustDialog.tsx        # 신규 (Phase 2)
├── RefundDialog.tsx              # 신규 (Phase 2)
├── LectureFormDialog.tsx         # 신규 (Phase 3)
└── HotListTriggerButton.tsx      # 신규 (Phase 5)
```
