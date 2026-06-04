// PocketPlan 핵심 계산 로직 (순수 함수).
// DB/Prisma에 의존하지 않는다 — 계산에 필요한 최소 형태만 입력으로 받는다.
// 도메인 규칙(docs/PRD.md, DECISIONS.md):
//   총 수입 = Σ 모든 수입
//   총 지출 = Σ(고정 + 변동 + 이번 달 할부 회차)
//   저축 가능 금액 = 총 수입 − 총 지출 (음수 허용)
// 금액은 정수(원). 부동소수점 금지(D5).

import type { ExpenseKind } from "@/app/generated/prisma/enums";

/** 계산에 필요한 수입 항목의 최소 형태 */
export type IncomeLike = { amount: number };

/** 계산에 필요한 지출 항목의 최소 형태 */
export type ExpenseLike = { amount: number; kind: ExpenseKind };

/** 한 달 요약 결과 */
export type MonthSummary = {
  totalIncome: number;
  totalExpense: number;
  /** 종류별 지출 소계 (대시보드용) */
  expenseByKind: Record<ExpenseKind, number>;
  /** 저축 가능 금액 = 총 수입 − 총 지출 (음수 가능) */
  savings: number;
  /** 저축액이 음수인가(적자) — UI 경고용 */
  isDeficit: boolean;
};

/** 정수 금액 합산. 비정상 값(NaN/소수/음수 등)은 호출부에서 검증한다고 가정하되, 합산은 안전하게 0 처리. */
function sumAmounts(items: ReadonlyArray<{ amount: number }>): number {
  return items.reduce((acc, item) => {
    const v = item.amount;
    return acc + (Number.isFinite(v) ? Math.trunc(v) : 0);
  }, 0);
}

/** 총 수입 = 모든 수입 합계 */
export function totalIncome(incomes: ReadonlyArray<IncomeLike>): number {
  return sumAmounts(incomes);
}

/** 종류별 지출 소계 (고정/변동/할부) */
export function expenseByKind(
  expenses: ReadonlyArray<ExpenseLike>
): Record<ExpenseKind, number> {
  const result: Record<ExpenseKind, number> = {
    static: 0,
    variable: 0,
    installment: 0,
  };
  for (const e of expenses) {
    const v = Number.isFinite(e.amount) ? Math.trunc(e.amount) : 0;
    // 알 수 없는 kind는 무시(스키마 enum 밖 값 방어)
    if (e.kind in result) result[e.kind] += v;
  }
  return result;
}

/** 총 지출 = 고정 + 변동 + 할부 (종류별 소계의 합).
 *  도메인상 지출은 이 3종뿐이며, enum 밖 kind는 총지출에 포함하지 않는다.
 *  → "totalExpense == 종류별 소계 합" 불변식을 항상 보장(QA: CALC-1). */
export function totalExpense(expenses: ReadonlyArray<ExpenseLike>): number {
  const byKind = expenseByKind(expenses);
  return byKind.static + byKind.variable + byKind.installment;
}

/** 저축 가능 금액 = 총 수입 − 총 지출 (음수 허용) */
export function savings(income: number, expense: number): number {
  return income - expense;
}

/** 한 달의 수입/지출로부터 요약 전체를 계산한다. */
export function summarizeMonth(
  incomes: ReadonlyArray<IncomeLike>,
  expenses: ReadonlyArray<ExpenseLike>
): MonthSummary {
  const income = totalIncome(incomes);
  const byKind = expenseByKind(expenses);
  // 단일 진실원천: 총지출은 종류별 소계의 합(totalExpense와 동일 기준).
  const expense = byKind.static + byKind.variable + byKind.installment;
  const save = savings(income, expense);
  return {
    totalIncome: income,
    totalExpense: expense,
    expenseByKind: byKind,
    savings: save,
    isDeficit: save < 0,
  };
}
