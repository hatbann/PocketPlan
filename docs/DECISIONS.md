# PocketPlan — 의사결정 로그 (ADR)

> 주요 결정과 근거를 시간순으로 기록한다. 형식: 날짜 / 결정 / 맥락·근거 / 영향.

---

## 2026-06-04 · 기술 스택 확정
- **결정**: Next.js 16 (App Router) + React 19 + TypeScript + Prisma 7 + PostgreSQL + Tailwind 4.
- **근거**: 프로젝트 초기 세팅이 이미 해당 스택으로 구성됨.
- **영향**: 개발 에이전트는 이 스택 컨벤션을 따른다.

## 2026-06-04 · 로컬 DB = Prisma 로컬 서버 + Node 22 상향
- **결정**: 로컬 개발 DB로 **Prisma 로컬 서버(`npx prisma dev`, prisma+postgres://)** 사용. 이를 위해 Node 핀을 **20.19.6 → 22.22.3** 으로 상향(`package.json` volta, `.nvmrc`).
- **근거**: 별도 PostgreSQL 설치 없이 로컬 개발 가능(현재 PC에 PostgreSQL 미설치). 단 Prisma 로컬 서버가 `node:sqlite`(Node 22.5+ 내장)를 요구해 Node 20에서 `No such built-in module: node:sqlite`로 실패 → Node 22 LTS로 상향.
- **영향**: `@prisma/adapter-pg` 어댑터로 연결(`app/lib/prisma.ts`). 실무용 표준 PostgreSQL로 옮길 경우 `.env`의 `DATABASE_URL`만 교체하면 됨. Prisma 로컬 서버는 `npx prisma dev`로 띄워둬야 접속 가능(데이터는 `~/.prisma` 하위 저장).

## 2026-06-04 · Claude 4-에이전트 체계 도입
- **결정**: planner / developer / qa / security 4개 서브에이전트 + docs 기반 추적.
- **근거**: 역할 분리로 기획→개발→검증→보안 흐름을 명확히 하고 진행 추적 용이.
- **영향**: 작업 시 적합한 에이전트를 사용. 모든 결정/진행은 docs에 기록.

## 2026-06-04 · 데이터 모델 선행 결정 D1~D5 확정 (사용자 승인)
> 아래는 사용자가 확정한 결정. Prisma 모델 작성의 기준이 된다.

- **D1. 사용자 범위/인증 시점**: **최종 목표는 다중 사용자(한 사람당 독립된 가계부 1개).** 단 MVP는 인증 없이 **고정 userId 1명**으로 시작하고, **인증(NextAuth)은 M4에서** 도입. 스키마에는 `User` 테이블과 `userId` FK를 처음부터 넣어 나중에 마이그레이션 없이 다중 사용자로 확장.
- **D2. 인증 방식**: MVP 인증 없음 → **M4에서 NextAuth(Auth.js v5) + Prisma 어댑터.**
- **D3. "월"의 정의**: **캘린더 월 고정(year + month, 1~12).** `Month` 식별키 = (userId, year, month).
- **D4. 할부 데이터 구조**: **`Installment` 마스터(원 할부) + 각 월의 `Expense`(kind=installment) 회차 레코드 분리.** 총 지출은 그 달 Expense 합산. 회차 자동 +1은 마스터 기준 다음 달 레코드 생성.
- **D5. 금액 타입**: **Prisma `Int`(원 단위 정수).** 부동소수점 금지.

---

## 미결정 (Pending)

> D1~D5는 위에서 확정(ADR 승격 완료). 남은 항목만 유지.

- (확장) **History 상세 페이지 범위** — M3에서 결정.
- (확장) 합계가 21억(Int 한계)을 넘을 우려가 생기면 금액 타입을 `BigInt`로 재검토.

---

## 참고 — 확정 전 검토 기록 (D1~D5 추천안/근거/대안)
> 의사결정 근거 추적용. 위 ADR로 확정됨.

### D1. 단일 vs 다중 사용자 (가장 먼저 결정)
- **추천**: **MVP는 단일 사용자(고정 userId 1개)**, 스키마에는 `User` 테이블과 `userId` FK를 처음부터 넣어둔다.
- **근거**: 인증을 붙이기 전이라도 `userId` 컬럼을 미리 넣으면, 나중에 다중 사용자/인증을 추가할 때 마이그레이션 없이 확장 가능. 첫 화면 저축액을 가장 빨리 보는 데 인증은 불필요.
- **대안**: 처음부터 다중 사용자(인증 동시 구현) → 첫 화면까지 도달 시간이 크게 늘어남. 비권장.

### D2. 인증 방식
- **추천**: **MVP는 인증 없음(단일 사용자, seed로 만든 고정 userId 사용). M4에서 NextAuth(Auth.js v5) 도입.**
- **근거**: 가계부 핵심 가치(저축액 자동 계산)를 먼저 검증. NextAuth는 Next.js App Router 표준이고 Prisma 어댑터가 있어 후속 통합이 쉬움.
- **대안**: ① 처음부터 NextAuth — 가치 검증이 늦어짐. ② 자체 세션 구현 — 보안 리스크/공수 큼, 비권장.

### D3. "월"의 정의
- **추천**: **캘린더 월 고정(year + month, 1~12).** `Month` 식별키 = (userId, year, month).
- **근거**: 모델·이월·History·UI 모두 단순. 급여일 기준은 "월 경계"가 사람마다 달라 집계/이월 로직이 복잡해짐. 스프레드시트 가계부의 멘탈모델과도 일치.
- **대안**: 급여일 기준(예: 25일~익월 24일) → 유연하지만 MVP 과대. 필요 시 확장에서 `payCycleStartDay` 설정으로 추가 가능.

### D4. 할부 데이터 구조
- **추천**: **별도 `Installment`(원 할부 마스터) + 각 월의 `Expense`(kind=installment) 회차 레코드 분리.**
  - `Installment`: id, userId, label, totalMonths, monthlyAmount, startYear, startMonth, status(active/done)
  - 매월 전환 시 회차에 해당하는 `Expense` 레코드 생성(installmentId FK, round 저장). 총 지출 계산은 그냥 그 달 Expense를 합산.
- **근거**: "회차별 1레코드"는 총 지출 계산(그 달 Expense 합산)과 History를 단순화하고, 원 할부 1건을 추적/조기종료/수정하기 쉬움. 회차 자동 +1은 마스터를 보고 다음 달 회차 레코드를 생성하는 방식.
- **대안**: ① Expense에 모든 할부 필드 통합(installmentTotal, installmentRound) → 원 할부 추적/조기종료가 어려움. ② 회차 레코드 미생성, 계산 시점에 동적 산출 → History 일관성 깨지기 쉬움. 비권장.

### D5. 금액 타입
- **추천**: **Prisma `Int`(원 단위 정수).**
- **근거**: 개인 가계부 금액은 32bit 정수 한계(약 21.4억) 내. 부동소수점 금지 규칙 충족, 계산/직렬화 단순.
- **대안**: ① `BigInt` — 21억 초과 자산/외화 대비. 합계가 21억을 넘을 가능성이 있으면 선택(JS BigInt 직렬화 주의). ② `Decimal` — 통화 정밀도용이나 "정수 원" 규칙엔 과함. 비권장.
