// PocketPlan 핵심 계산 로직 엣지케이스 테스트.
// 실행: npx tsx --test app/lib/calc.test.ts
// (대안: node --import tsx --test app/lib/calc.test.ts)
//
// 도메인 규칙(docs/PRD.md 3장):
//   총 수입 = Σ 수입 / 총 지출 = 고정+변동+할부 / 저축 = 수입 − 지출(음수 허용) / 금액 정수.

import test from "node:test";
import assert from "node:assert/strict";

import {
  totalIncome,
  totalExpense,
  expenseByKind,
  savings,
  summarizeMonth,
  type IncomeLike,
  type ExpenseLike,
} from "./calc";

// ── 헬퍼 ──────────────────────────────────────────────
const inc = (amount: number): IncomeLike => ({ amount });
const exp = (amount: number, kind: ExpenseLike["kind"]): ExpenseLike => ({
  amount,
  kind,
});

// ── 1. 월급 0원 ───────────────────────────────────────
test("월급 0원: 수입 0, 지출 0 → 저축 0, 적자 아님", () => {
  const s = summarizeMonth([inc(0)], []);
  assert.equal(s.totalIncome, 0);
  assert.equal(s.totalExpense, 0);
  assert.equal(s.savings, 0);
  assert.equal(s.isDeficit, false); // 0은 적자 아님 (save < 0)
});

// ── 2. 수입만 있고 지출 없음 ──────────────────────────
test("수입만 있고 지출 없음 → 저축=총수입, 적자 아님", () => {
  const s = summarizeMonth([inc(3000000), inc(500000)], []);
  assert.equal(s.totalIncome, 3500000);
  assert.equal(s.totalExpense, 0);
  assert.equal(s.savings, 3500000);
  assert.equal(s.isDeficit, false);
});

// ── 3. 지출만 있고 수입 없음 → 음수 저축, isDeficit=true ──
test("지출만 있고 수입 없음 → 음수 저축, isDeficit=true", () => {
  const s = summarizeMonth(
    [],
    [exp(100000, "static"), exp(50000, "variable")]
  );
  assert.equal(s.totalIncome, 0);
  assert.equal(s.totalExpense, 150000);
  assert.equal(s.savings, -150000);
  assert.equal(s.isDeficit, true);
});

// ── 4. 빈 배열(전부 0) ────────────────────────────────
test("빈 배열: 모든 값 0, 적자 아님", () => {
  const s = summarizeMonth([], []);
  assert.equal(s.totalIncome, 0);
  assert.equal(s.totalExpense, 0);
  assert.equal(s.savings, 0);
  assert.equal(s.isDeficit, false);
  assert.deepEqual(s.expenseByKind, {
    static: 0,
    variable: 0,
    installment: 0,
  });
});

// ── 5. 할부 회차 금액이 총지출에 포함되는지 ───────────
test("할부 지출이 총지출/소계에 포함된다", () => {
  const s = summarizeMonth(
    [inc(2000000)],
    [
      exp(500000, "static"), // 월세
      exp(300000, "variable"), // 식비
      exp(200000, "installment"), // 할부 2/5 회차
    ]
  );
  assert.equal(s.totalExpense, 1000000);
  assert.equal(s.expenseByKind.installment, 200000);
  assert.equal(s.savings, 1000000);
});

// ── 6. 종류별 소계 합 == 총지출 ───────────────────────
test("종류별 소계 합이 총지출과 일치한다", () => {
  const expenses = [
    exp(111111, "static"),
    exp(222222, "variable"),
    exp(333333, "installment"),
    exp(444444, "static"),
  ];
  const byKind = expenseByKind(expenses);
  const sum = byKind.static + byKind.variable + byKind.installment;
  assert.equal(sum, totalExpense(expenses));
  assert.equal(byKind.static, 555555);
  assert.equal(byKind.variable, 222222);
  assert.equal(byKind.installment, 333333);
});

// ── 7. 소수점 금액 입력 시 동작 ───────────────────────
// 규칙: 금액은 정수(원). 현재 구현은 Math.trunc로 소수 절삭.
test("소수점 금액: Math.trunc로 절삭된다(정수화)", () => {
  assert.equal(totalIncome([inc(1000.9)]), 1000); // 반올림 아님, 버림
  assert.equal(totalIncome([inc(999.99), inc(0.5)]), 999); // 999 + 0 = 999
  const byKind = expenseByKind([exp(150.7, "variable")]);
  assert.equal(byKind.variable, 150);
});

// 0.1 + 0.2 류 부동소수점 누적 오차가 결과에 새지 않는지
test("부동소수점 누적: 소수 입력이어도 정수 결과 보장", () => {
  const s = summarizeMonth(
    [inc(0.1), inc(0.2)], // 각각 trunc→0
    [exp(0.3, "variable")] // trunc→0
  );
  assert.equal(s.totalIncome, 0);
  assert.equal(s.totalExpense, 0);
  assert.ok(Number.isInteger(s.savings));
});

// ── 8. 음수 금액 입력 시 동작 ─────────────────────────
test("음수 금액 입력: 그대로 합산된다(차감 효과)", () => {
  assert.equal(totalIncome([inc(1000), inc(-300)]), 700);
  const byKind = expenseByKind([exp(-500, "static")]);
  assert.equal(byKind.static, -500);
});

// ── 9. 큰 금액 ────────────────────────────────────────
test("큰 금액: 안전 정수 범위 내 정확 합산", () => {
  const big = 9_000_000_000; // 90억
  const s = summarizeMonth([inc(big), inc(big)], [exp(big, "static")]);
  assert.equal(s.totalIncome, 18_000_000_000);
  assert.equal(s.totalExpense, 9_000_000_000);
  assert.equal(s.savings, 9_000_000_000);
});

// ── 10. NaN / Infinity 방어 ───────────────────────────
test("NaN/Infinity 금액: 0으로 처리되어 결과 오염 안 됨", () => {
  const s = summarizeMonth(
    [inc(1000), inc(NaN), inc(Infinity)],
    [exp(500, "static"), exp(-Infinity, "variable")]
  );
  assert.equal(s.totalIncome, 1000);
  assert.equal(s.totalExpense, 500);
  assert.equal(s.savings, 500);
});

// ── 11. 알 수 없는 kind 방어 (enum 밖 값) — CALC-1 수정 후 ──
// 도메인상 지출은 고정/변동/할부뿐. enum 밖 kind는 총지출에서 제외하며,
// totalExpense, summarizeMonth, 종류별 소계 합이 모두 동일해야 한다(불변식).
test("알 수 없는 kind: totalExpense·소계합·summarizeMonth가 모두 일치(unknown 제외)", () => {
  const dirty = [
    exp(100, "static"),
    { amount: 999, kind: "unknown" as ExpenseLike["kind"] },
  ];
  const byKind = expenseByKind(dirty);
  const byKindSum = byKind.static + byKind.variable + byKind.installment;
  const total = totalExpense(dirty);
  const s = summarizeMonth([], dirty);
  // unknown(999)은 전부 제외 → 100으로 일치
  assert.equal(byKindSum, 100);
  assert.equal(total, 100);
  assert.equal(s.totalExpense, 100);
  // 불변식: totalExpense == 종류별 소계 합 == summarizeMonth.totalExpense
  assert.equal(total, byKindSum);
  assert.equal(total, s.totalExpense);
});

// ── 12. savings 순수성: 단순 차감 ─────────────────────
test("savings(income, expense)는 단순 차감", () => {
  assert.equal(savings(1000, 300), 700);
  assert.equal(savings(0, 0), 0);
  assert.equal(savings(100, 250), -150);
});
