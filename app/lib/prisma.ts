// Prisma 7 클라이언트 싱글톤.
// Prisma 7부터 연결 URL은 schema가 아닌 드라이버 어댑터로 주입한다(D5/Prisma7 규칙).
// PostgreSQL → @prisma/adapter-pg 사용. DATABASE_URL은 .env에서 읽는다(비밀).
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const createPrismaClient = () => {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
};

// Next.js dev의 HMR로 인스턴스가 누적되지 않도록 globalThis에 캐싱.
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
