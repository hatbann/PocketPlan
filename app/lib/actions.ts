"use server";
// 수입/지출 입력 저장 Server Actions (M1-#3).
// MVP: 인증 없이 CURRENT_USER_ID 고정. 모든 쓰기는 userId 범위로 격리(IDOR 방지).
// 입력은 서버측에서 반드시 검증한다(validation.ts).

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { CURRENT_USER_ID } from "@/app/lib/constants";
import { getOrCreateMonth } from "@/app/lib/queries";
import {
  assertAmount,
  assertExpenseKind,
  assertIncomeType,
  assertLabel,
  assertMonth,
  assertRound,
  assertTotalMonths,
  assertYear,
  ValidationError,
} from "@/app/lib/validation";

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

/** ValidationError는 사용자 메시지로, 그 외는 일반 메시지로 변환. */
function toResult(fn: () => Promise<void>): Promise<ActionResult> {
  return fn()
    .then((): ActionResult => ({ ok: true }))
    .catch((e): ActionResult => {
      if (e instanceof ValidationError) return { ok: false, error: e.message };
      console.error("[action] 예기치 못한 오류:", e);
      return { ok: false, error: "저장 중 오류가 발생했습니다." };
    });
}

/** 화면 갱신: entry/overview 둘 다. */
function revalidate() {
  revalidatePath("/entry");
  revalidatePath("/overview");
}

/** 수입 추가 */
export async function addIncome(input: {
  year: number;
  month: number;
  type: string;
  label: string;
  amount: number | string;
}): Promise<ActionResult> {
  return toResult(async () => {
    const year = assertYear(input.year);
    const month = assertMonth(input.month);
    const type = assertIncomeType(input.type);
    const label = assertLabel(input.label, "수입 이름");
    const amount = assertAmount(input.amount, "수입 금액");

    const m = await getOrCreateMonth(CURRENT_USER_ID, year, month);
    await prisma.income.create({
      data: { monthId: m.id, type, label, amount },
    });
    revalidate();
  });
}

/** 고정/변동 지출 추가 (할부 아님) */
export async function addExpense(input: {
  year: number;
  month: number;
  kind: string; // static | variable (installment는 addInstallment 사용)
  label: string;
  amount: number | string;
}): Promise<ActionResult> {
  return toResult(async () => {
    const year = assertYear(input.year);
    const month = assertMonth(input.month);
    const kind = assertExpenseKind(input.kind);
    if (kind === "installment") {
      throw new ValidationError("할부는 할부 입력 폼을 사용하세요.");
    }
    const label = assertLabel(input.label, "지출 이름");
    const amount = assertAmount(input.amount, "지출 금액");

    const m = await getOrCreateMonth(CURRENT_USER_ID, year, month);
    await prisma.expense.create({
      data: { monthId: m.id, kind, label, amount },
    });
    revalidate();
  });
}

/** 할부 추가: 마스터(Installment) + 이번 달 회차 Expense를 트랜잭션으로 생성 */
export async function addInstallment(input: {
  year: number;
  month: number;
  label: string;
  monthlyAmount: number | string;
  totalMonths: number | string;
  round: number | string;
}): Promise<ActionResult> {
  return toResult(async () => {
    const year = assertYear(input.year);
    const month = assertMonth(input.month);
    const label = assertLabel(input.label, "할부 이름");
    const monthlyAmount = assertAmount(input.monthlyAmount, "할부 금액");
    const totalMonths = assertTotalMonths(input.totalMonths);
    const round = assertRound(input.round, totalMonths);

    const m = await getOrCreateMonth(CURRENT_USER_ID, year, month);
    await prisma.$transaction(async (tx) => {
      const installment = await tx.installment.create({
        data: {
          userId: CURRENT_USER_ID,
          label,
          totalMonths,
          monthlyAmount,
          startYear: year,
          startMonth: month,
          status: round >= totalMonths ? "done" : "active",
        },
      });
      await tx.expense.create({
        data: {
          monthId: m.id,
          kind: "installment",
          label,
          amount: monthlyAmount,
          installmentId: installment.id,
          round,
        },
      });
    });
    revalidate();
  });
}

/** 월급 변경 (Month.salary 수정). 이월 대상 값. */
export async function setSalary(input: {
  year: number;
  month: number;
  salary: number | string;
}): Promise<ActionResult> {
  return toResult(async () => {
    const year = assertYear(input.year);
    const month = assertMonth(input.month);
    const salary = assertAmount(input.salary, "월급");

    await prisma.month.upsert({
      where: { userId_year_month: { userId: CURRENT_USER_ID, year, month } },
      update: { salary },
      create: { userId: CURRENT_USER_ID, year, month, salary },
    });
    revalidate();
  });
}

/** 수입 삭제 (소유 검증 포함) */
export async function deleteIncome(incomeId: string): Promise<ActionResult> {
  return toResult(async () => {
    if (typeof incomeId !== "string" || !incomeId) {
      throw new ValidationError("잘못된 요청입니다.");
    }
    // 소유 검증: 이 수입이 현재 사용자의 month에 속하는지 확인(IDOR 방지).
    const income = await prisma.income.findFirst({
      where: { id: incomeId, month: { userId: CURRENT_USER_ID } },
      select: { id: true },
    });
    if (!income) throw new ValidationError("항목을 찾을 수 없습니다.");
    await prisma.income.delete({ where: { id: income.id } });
    revalidate();
  });
}

/** 지출 삭제 (소유 검증 포함). 할부 회차 레코드도 동일하게 삭제 가능. */
export async function deleteExpense(expenseId: string): Promise<ActionResult> {
  return toResult(async () => {
    if (typeof expenseId !== "string" || !expenseId) {
      throw new ValidationError("잘못된 요청입니다.");
    }
    const expense = await prisma.expense.findFirst({
      where: { id: expenseId, month: { userId: CURRENT_USER_ID } },
      select: { id: true },
    });
    if (!expense) throw new ValidationError("항목을 찾을 수 없습니다.");
    await prisma.expense.delete({ where: { id: expense.id } });
    revalidate();
  });
}
