// PocketPlan seed — MVP용 고정 사용자 1명 + 데모 데이터(2026년 6월).
// D1: MVP는 인증 없이 고정 userId 1명. 이 값을 앱에서 CURRENT_USER로 사용한다.
// 멱등성: upsert 기반이라 여러 번 실행해도 중복 생성되지 않는다.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 앱 전역에서 참조할 고정 사용자 ID(MVP). M4 인증 도입 시 교체.
const SEED_USER_ID = "seed-user-0001";

async function main() {
  // 1) 고정 사용자
  const user = await prisma.user.upsert({
    where: { id: SEED_USER_ID },
    update: {},
    create: {
      id: SEED_USER_ID,
      email: "demo@pocketplan.local",
      name: "데모 사용자",
    },
  });

  // 2) 2026년 6월 (캘린더 월, D3). 기본 월급 300만원.
  const month = await prisma.month.upsert({
    where: { userId_year_month: { userId: user.id, year: 2026, month: 6 } },
    update: { salary: 3_000_000 },
    create: { userId: user.id, year: 2026, month: 6, salary: 3_000_000 },
  });

  // 멱등성을 위해 이 달의 기존 수입/지출을 비우고 다시 채운다.
  await prisma.income.deleteMany({ where: { monthId: month.id } });
  await prisma.expense.deleteMany({ where: { monthId: month.id } });

  // 3) 수입: 월급 + 보너스
  await prisma.income.createMany({
    data: [
      { monthId: month.id, type: "salary", label: "6월 월급", amount: 3_000_000 },
      { monthId: month.id, type: "bonus", label: "성과급", amount: 500_000 },
    ],
  });

  // 4) 할부 마스터: 노트북 5개월 할부, 회차당 24만원. 1회차 = 2026년 5월.
  const installment = await prisma.installment.upsert({
    where: { id: "seed-inst-laptop" },
    update: {},
    create: {
      id: "seed-inst-laptop",
      userId: user.id,
      label: "노트북 할부",
      totalMonths: 5,
      monthlyAmount: 240_000,
      startYear: 2026,
      startMonth: 5,
      status: "active",
    },
  });

  // 5) 지출: 고정(월세·통신비) + 변동(식비) + 할부 6월 회차(2/5)
  await prisma.expense.createMany({
    data: [
      { monthId: month.id, kind: "static", label: "월세", amount: 700_000 },
      { monthId: month.id, kind: "static", label: "통신비", amount: 55_000 },
      { monthId: month.id, kind: "variable", label: "식비", amount: 420_000 },
      {
        monthId: month.id,
        kind: "installment",
        label: "노트북 할부",
        amount: installment.monthlyAmount,
        installmentId: installment.id,
        round: 2, // 2/5
      },
    ],
  });

  console.log(`✅ seed 완료: user=${user.id}, month=2026-06 (id=${month.id})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
