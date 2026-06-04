# PocketPlan — 진행 현황

> 상태: ⬜ 예정 · 🟡 진행중 · ✅ 완료 · 🟥 막힘
> 최종 수정: 2026-06-04

## 현재 상태 한눈에 (진단)
- **UI 골격만 존재**: `app/entry`(탭+유형 드롭다운), `app/overview`+`SummaryCard`(레이아웃 박스), `app/page.tsx`(이동 버튼). 모두 `"use client"` + 로컬 `useState`. 실제 입력 폼/리스트/금액/저축액 표시는 **빈 상태**.
- **데이터 계층 0**: `prisma/schema.prisma`에 모델 없음(generator/datasource만). DB URL 미설정. 마이그레이션·seed 없음.
- **서버 로직 0**: API route / Server Action / `use server` 없음. 계산 로직(순수 함수) 없음.
- **인증 0**: NextAuth 등 의존성 없음. 사용자 격리 미구현.
- **핵심 blocker**: 데이터 모델이 미정 → 저장·계산·대시보드·이월 전부 막혀 있음. **모델 확정이 1순위.**

## 마일스톤

### M0 — 프로젝트 세팅
| 상태 | 항목 | 비고 |
|---|---|---|
| ✅ | Next.js 16 + React 19 + TS + Tailwind 4 초기화 | 기존 |
| ✅ | Prisma 7 설치, datasource(postgresql) 구성 | 모델 미정의 |
| ✅ | Claude 에이전트(기획/개발/QA/보안) + 기획·추적 문서 세팅 | 2026-06-04 |

### M0.5 — 선행 결정 (개발 착수 차단 항목) ✅ 해제됨
| 상태 | 항목 | 담당 | 산출물 / 완료기준 |
|---|---|---|---|
| ✅ | D1~D5 결정 확정 (단일/다중·인증·월정의·할부구조·금액타입) | planner→사용자 | `DECISIONS.md` ADR 승격 완료(2026-06-04). 결정: 다중사용자 목표·MVP 단일유저·인증 M4·캘린더월·할부 마스터+회차·금액 Int |

### M1 — MVP (단일 월, 인증 없음): "첫 화면에 저축액이 뜬다"
> 의존성 순서: 모델 → DB연동/저장 → 계산함수 → 대시보드. 위가 끝나야 아래 시작.

| # | 상태 | 항목 | 담당 | 산출물 / 완료기준 |
|---|---|---|---|---|
| 1 | ✅ | Prisma 모델 정의 (User/Month/Income/Expense/Installment) + 스키마 적용 + seed(고정 userId 1명) | dev | 모델·seed·adapter·prisma 싱글톤 작성. `db push`로 `pocketplan` DB에 테이블 생성, seed 입력 완료. 계산 검증(저축 2,085,000원) 통과. (`migrate dev`는 Prisma 로컬 서버 shadow DB 이슈로 P1017 → `db push` 사용) |
| 2 | ✅ | 핵심 계산 로직 순수 함수 (`총수입/총지출/저축액`) | dev | `app/lib/calc.ts` 작성(DB 비의존, 음수 저축 허용, 종류별 소계, 적자판정). 실데이터 검증 통과 |
| 2q | ✅ | 계산 로직 검증 | qa | `app/lib/calc.test.ts` 13케이스(`npm test`) 통과. 결함 CALC-1(불변식 불일치) 수정완료, CALC-2(입력검증)는 M1-#3/#4로 이관. `QA-REPORT.md` 기록 |
| 3 | ⬜ | 입력 저장 Server Action + DB 연동 (수입/지출 CRUD) | dev | entry에서 입력→저장→리스트 반영. (userId 고정) |
| 4 | 🟡 | 수입/지출 입력 UI 완성 (`app/entry`) | dev | 금액/라벨 입력 폼 + 리스트 표시. 현재 탭/드롭다운 골격만 |
| 5 | 🟡 | 월 요약 대시보드 (`app/overview`+`SummaryCard`) — **저축액 강조 표시** | dev | 실제 총수입/총지출/저축액 렌더. 음수 경고. 현재 박스 골격만 |
| 6 | ⬜ | overview/entry 월 선택 연동 (캘린더 월) | dev | (userId, year, month)로 데이터 조회 |

### M2 — 월 전환 / 이월
| 상태 | 항목 | 담당 |
|---|---|---|
| ⬜ | 월급 자동 이월 | dev |
| ⬜ | 고정 지출 자동 복사 | dev |
| ⬜ | 할부 회차 자동 증가(+1), 완료 시 종료 | dev |
| ⬜ | 변동 비움 / 수입 초기화 | dev |
| ⬜ | 이월/회차 엣지케이스 검증 | qa |

### M3 — History
| 상태 | 항목 | 담당 |
|---|---|---|
| ⬜ | 연·월별 요약 카드 페이지 | dev |
| ⬜ | (선택) 상세 페이지 | dev |

### M4 — 인증 / 보안
| 상태 | 항목 | 담당 |
|---|---|---|
| ⬜ | 인증 방식 결정 | planner |
| ⬜ | 사용자별 데이터 격리 | dev |
| ⬜ | 보안 점검(비밀/IDOR/입력검증/audit) | security |

## 다음 할 일 (Top 3)
1. **입력 저장 Server Action + DB 연동** (수입/지출 CRUD, userId 고정) (M1-#3) (dev) ← **지금 시작 가능**. ⚠️ CALC-2 반영: 금액 ≥0·정수·유한 서버측 검증 필수.
2. 수입/지출 입력 UI 완성 `app/entry` (M1-#4) (dev)
3. 월 요약 대시보드 — 저축액 강조 `app/overview`+`SummaryCard` (M1-#5) (dev)

## 로컬 개발 메모 (DB 기동)
- DB는 **Prisma 로컬 서버** 사용. 개발 전 별도 터미널에서 `npx prisma dev` 를 켜둬야 함(끄면 접속 불가).
- 앱/CLI/seed 모두 `.env`의 **표준 `postgres://...pocketplan` URL** 사용(`@prisma/adapter-pg`). `prisma+postgres://`는 pg 드라이버와 비호환(SASL 에러) → 백업 주석으로만 보관.
- ⚠️ `prisma dev` 재시작 시 포트(현재 51214)가 바뀔 수 있음 → `.env`의 DATABASE_URL 포트 갱신 필요.
- 스키마 변경 적용: `npx prisma db push` (로컬 서버 shadow DB 이슈로 `migrate dev` 대신 사용). 데모 데이터: `npx prisma db seed`.
- Node 22+ 필수(Prisma 로컬 서버가 node:sqlite 사용). volta/.nvmrc 22.22.3 핀.

## 변경 로그
- 2026-06-04: Claude 4-에이전트 구성 및 docs 초기화.
- 2026-06-04: planner 현황 재진단. M0.5(선행 결정 BLOCKER) 신설, M1을 의존성 순서(모델→계산→저장→UI→대시보드)로 재정렬하고 각 단계 산출물/완료기준 명시. MVP 경계선 명확화.
- 2026-06-04: **선행 결정 D1~D5 사용자 확정 → M0.5 해제(BLOCKER 풀림).** DECISIONS.md ADR 승격. 결정 요약: 다중사용자 목표/MVP 단일유저(인증 M4)·캘린더 월·할부 마스터+회차 레코드·금액 Int. 다음 작업은 Prisma 모델 작성.
