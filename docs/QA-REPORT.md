# PocketPlan — QA 결함 리포트

> QA 에이전트가 발견한 결함을 기록. 형식 아래 템플릿 사용.
> 심각도: 🔴 상 · 🟠 중 · 🟡 하

최종 수정: 2026-06-04

---

## M1-#2q — 핵심 계산 로직(`app/lib/calc.ts`) 검증

- **검증 일자**: 2026-06-04
- **검증 방법**: 코드 리뷰 + Node 내장 test runner(`node:test`/`node:assert`) 엣지케이스 테스트.
- **테스트 파일**: `app/lib/calc.test.ts` (13 케이스)
- **실행 명령**: `npx tsx --test app/lib/calc.test.ts`
- **테스트 결과**: ✅ **13/13 통과, 0 실패**
- **타입 점검**: `npx tsc --noEmit` ✅ 통과(오류 0)
- **판정**: 🟢 **조건부 합격** — MVP 도메인 규칙은 전부 충족. 단, 아래 🟡 결함 1건(불일치 가능성)은 호출부 사용 규약으로 회피되나 잠재 위험으로 권고 기록.

### 통과한 수용기준 / 엣지케이스 표

| # | 케이스 | 기대 | 결과 |
|---|---|---|---|
| 1 | 월급 0원 | 수입0/지출0/저축0, 적자 아님 | ✅ |
| 2 | 수입만 있고 지출 없음 | 저축=총수입, 적자 아님 | ✅ |
| 3 | 지출만 있고 수입 없음 | 음수 저축, isDeficit=true | ✅ |
| 4 | 빈 배열(수입·지출 모두) | 전부 0, 소계 0, 적자 아님 | ✅ |
| 5 | 할부 회차 금액 포함 | 총지출·installment 소계에 합산 | ✅ |
| 6 | 종류별 소계 합 = 총지출 | static+variable+installment == totalExpense | ✅ |
| 7 | 소수점 금액 입력 | Math.trunc로 버림(반올림 아님) → 정수 | ✅ |
| 8 | 부동소수점 누적 | 결과 항상 정수 보장 | ✅ |
| 9 | 음수 금액 입력 | 그대로 합산(차감 효과) | ✅ |
| 10 | 큰 금액(180억 등) | 안전 정수 범위 내 정확 합산 | ✅ |
| 11 | NaN/Infinity 금액 | 0으로 처리되어 결과 미오염 | ✅ |
| 12 | 알 수 없는 kind | summarizeMonth는 제외, totalExpense는 포함(불일치) | ✅(동작 확인) |
| 13 | savings 순수성 | 단순 차감 | ✅ |

---

## 결함 목록

| # | 심각도 | 제목 | 상태 | 관련 파일 |
|---|---|---|---|---|
| CALC-1 | 🟡 하 | `totalExpense()`와 `summarizeMonth.totalExpense`가 알 수 없는 kind에서 불일치 | ✅ 수정완료(2026-06-04) | `app/lib/calc.ts` |
| CALC-2 | 🟡 하 | 소수/음수/NaN 금액을 조용히 흡수(절삭·무시) — 검증을 호출부에 전가 | 신규(설계확인) | `app/lib/calc.ts:33,52` |

---

### [CALC-1] `totalExpense()`와 `summarizeMonth`의 총지출 계산 경로 불일치
- **심각도**: 🟡 하 (현재 입력은 Prisma enum으로 강제되어 실제 발생 가능성 낮음. 추정)
- **재현 절차**:
  1. enum 밖 kind를 가진 지출을 섞는다. 예: `[{amount:100, kind:"static"}, {amount:999, kind:"unknown"}]`
  2. `totalExpense(expenses)` 호출 → **1099** 반환 (`sumAmounts`는 kind 무관 전체 합산)
  3. `summarizeMonth([], expenses).totalExpense` → **100** (byKind 소계 합 기반, unknown 제외)
- **기대 결과**: 두 경로의 총지출이 항상 동일해야 함(단일 진실원천).
- **실제 결과**: 알 수 없는 kind에서 `totalExpense()`=1099 ≠ `summarizeMonth`=100. "소계 합 == 총지출" 불변식이 깨질 수 있음.
- **권고**: `summarizeMonth`가 `totalExpense(expenses)`를 직접 호출하도록 통일하거나, `expenseByKind`/`sumAmounts` 둘 다 동일한 kind 필터를 적용. (개발자 수정 권장 — QA는 직접 수정 안 함)
- **관련 파일**: `app/lib/calc.ts:54`(`if (e.kind in result)`), `:60`(`sumAmounts` 전체 합), `:76`(byKind 합으로 totalExpense 산출)
- **상태**: ✅ **수정완료(2026-06-04, dev)**. `totalExpense()`를 종류별 소계 합 기준으로 변경 → enum 밖 kind는 총지출에서 제외, "totalExpense == 소계합 == summarizeMonth.totalExpense" 불변식 확립. 테스트 #11을 일치 검증으로 갱신, `npm test` 13/13 통과.

### [CALC-2] 비정상 금액(소수/음수/NaN/Infinity)을 조용히 흡수
- **심각도**: 🟡 하 (코드 주석상 "호출부에서 검증" 가정 — 의도된 설계. 확인 목적 기록)
- **재현 절차**:
  1. 소수: `totalIncome([{amount:1000.9}])` → 1000 (반올림 아닌 버림)
  2. 음수: `totalIncome([{amount:-300}])` → -300 (그대로 합산)
  3. NaN/Infinity: → 0으로 치환
- **기대 결과**: 도메인상 금액은 양의 정수(원). 비정상 값은 입력 단계에서 거부되는 것이 안전.
- **실제 결과**: calc.ts는 오류 없이 흡수. 잘못된 데이터가 0/절삭값으로 합산되어 사용자에게 조용히 잘못된 합계 노출 가능.
- **권고**: 입력 폼/Server Action(M1-#3·#4)에서 `금액 ≥ 0`, 정수, 유한값 검증 필수. calc.ts는 순수·방어적이므로 변경 불요(현 설계 적절).
- **관련 파일**: `app/lib/calc.ts:33`(`Math.trunc`+`Number.isFinite`), `:52`
- **상태**: 신규(설계 확인)

---

## 템플릿

### [#ID] 제목
- **심각도**: 🔴/🟠/🟡
- **재현 절차**:
  1.
  2.
- **기대 결과**:
- **실제 결과**:
- **관련 파일**: `path:line`
- **상태**: 신규 / 수정중 / 수정완료 / 재현불가
