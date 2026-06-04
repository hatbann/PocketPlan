# CLAUDE.md — PocketPlan

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 프로젝트 한 줄 요약
개인 월급 기반 가계부 웹앱. **월급 자동 이월 → 수입 입력 → 지출 관리(고정/변동/할부) → 총 지출 계산 → 저축액 표시 → 다음 달 이동 → 과거 기록 확인.**
"스프레드시트로 하던 가계부"를 웹앱으로 구조화하는 것이 목표.

## 기술 스택
- Next.js 16 (App Router), React 19, TypeScript
- Prisma 7 + PostgreSQL (스키마: `prisma/schema.prisma`, 클라이언트 출력: `app/generated/prisma`)
- Tailwind CSS 4, lucide-react
- 패키지 매니저: npm, Node 20 (volta / `.nvmrc` 고정)

## 자주 쓰는 명령
```bash
npx prisma dev     # 로컬 DB 서버 기동 (별도 터미널, 켜둬야 함) — 개발 전 필수
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
npm run lint       # ESLint
npx tsc --noEmit   # 타입 체크
npx prisma db push # 스키마를 DB에 반영 (로컬 서버에선 migrate dev 대신 사용)
npx prisma db seed # 데모 데이터 입력 (고정 userId)
npx prisma generate / validate
```
- **DB 연결**: `@prisma/adapter-pg` + `.env`의 표준 `postgres://...pocketplan` URL. Prisma 7은 `PrismaClient({ adapter })` 필수. 공유 클라이언트는 `app/lib/prisma.ts`.
- **Node 22+ 필수** (Prisma 로컬 서버가 node:sqlite 사용). volta/.nvmrc 22.22.3.
- ⚠️ `prisma dev` 재시작 시 포트가 바뀔 수 있음 → `.env`의 DATABASE_URL 포트 갱신.
- ⚠️ 직접 실행하는 스크립트(`tsx ...`)는 `.env`가 자동 로드되지 않음 → 파일 상단에 `import "dotenv/config"` 필요. (Next.js 앱·`prisma db seed`는 자동 로드됨)

## 디렉터리
- `app/` — App Router 페이지. `entry`(수입/지출 입력), `overview`(월 요약), `_components/`
- `prisma/schema.prisma` — DB 모델 (현재 모델 미정의)
- `docs/` — 기획·추적 문서 (아래 참고)
- `.claude/agents/` — 역할별 서브에이전트

## 핵심 도메인 규칙 (정확히 지킬 것)
- 총 수입 = Σ 모든 수입
- 총 지출 = Σ 고정 + Σ 변동 + Σ(이번 달 할부 회차)
- **저축 가능 금액 = 총 수입 − 총 지출** (음수 허용, UI 경고)
- 월 전환: 월급 이월 / 수입 초기화 / 고정·할부 복사 / 변동 비움 / 할부 회차 +1 (완료분 제외)
- 금액은 **정수(원)** 로만 다룬다. 부동소수점 금지.
- 금융 데이터는 **사용자별 격리** 필수.

## 작업 흐름 — 4개 에이전트
역할에 맞는 서브에이전트를 사용한다 (`.claude/agents/`):
- **planner** — 요구사항·UX 흐름·데이터 모델·우선순위. 기능 시작 전/요구사항 모호할 때.
- **developer** — 구현(컴포넌트/API/스키마/계산 로직).
- **qa** — 도메인 규칙·엣지케이스 검증, 결함 리포트.
- **security** — 비밀/인증·인가/입력검증/IDOR/의존성 점검.

일반 흐름: **planner(명세) → developer(구현) → qa(검증) → security(점검)**.

## 추적 문서 (작업 시 읽고, 끝나면 갱신)
- `docs/PRD.md` — 제품 요구사항·UX 흐름·수용기준
- `docs/PROGRESS.md` — 마일스톤·진행 상태 (작업 완료 시 상태 갱신)
- `docs/DECISIONS.md` — 의사결정 로그 (중요 결정 시 추가)
- `docs/QA-REPORT.md` — QA 결함
- `docs/SECURITY-REVIEW.md` — 보안 점검

## 규칙
- 코드 변경 후 `npm run lint`(필요시 build/tsc)로 검증.
- `.env`(DB 비밀 등)는 출력·커밋 금지. (`.gitignore`에 포함됨)
- 커밋/푸시는 사용자가 명시적으로 요청할 때만.
- 기존 코드 컨벤션(파일 구조, Tailwind 인라인 유틸리티)을 따른다.
