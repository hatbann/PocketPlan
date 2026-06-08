// DB 조회 헬퍼. 모든 함수는 userId 범위로 제한한다(보안: 사용자별 데이터 격리, D1).
// 서버 전용 — 클라이언트에서 import 금지.
import "server-only";
import { prisma } from "@/app/lib/prisma";
import { summarizeMonth, type MonthSummary } from "@/app/lib/calc";

/** 해당 사용자의 (year, month)에 해당하는 Month를 찾고, 없으면 생성한다.
 *  MVP에선 월급 이월 없이 salary=0으로 생성(이월은 M2). */
export async function getOrCreateMonth(
  userId: string,
  year: number,
  month: number
) {
  return prisma.month.upsert({
    where: { userId_year_month: { userId, year, month } },
    update: {},
    create: { userId, year, month, salary: 0 },
  });
}

/** 사용자 범위로 한정해 monthId를 검증한다. 다른 사용자의 month면 null(IDOR 방지). */
export async function findOwnedMonth(userId: string, monthId: string) {
  return prisma.month.findFirst({ where: { id: monthId, userId } });
}

/** 해당 월의 수입/지출 목록과 요약을 함께 반환한다. */
export async function getMonthDetail(
  userId: string,
  year: number,
  month: number
): Promise<{
  month: Awaited<ReturnType<typeof getOrCreateMonth>>;
  incomes: Awaited<ReturnType<typeof prisma.income.findMany>>;
  expenses: Awaited<ReturnType<typeof prisma.expense.findMany>>;
  summary: MonthSummary;
}> {
  const m = await getOrCreateMonth(userId, year, month);
  const [incomes, expenses] = await Promise.all([
    prisma.income.findMany({
      where: { monthId: m.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { monthId: m.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const summary = summarizeMonth(incomes, expenses);
  return { month: m, incomes, expenses, summary };
}
