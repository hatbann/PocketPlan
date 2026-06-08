// 수입/지출 입력 페이지 (Server Component).
// 현재 월의 데이터를 DB에서 읽어 EntryClient에 전달한다.
// MVP: 인증 없이 CURRENT_USER_ID 고정, 월은 서버 현재 시각 기준(월 선택은 M1-#6).
import EntryClient from "@/app/_components/entry/EntryClient";
import { CURRENT_USER_ID } from "@/app/lib/constants";
import { getMonthDetail } from "@/app/lib/queries";

// 항상 최신 DB 상태를 반영(입력 직후 revalidate와 함께).
export const dynamic = "force-dynamic";

export default async function EntryPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { incomes, expenses } = await getMonthDetail(
    CURRENT_USER_ID,
    year,
    month
  );

  return (
    <div className="flex items-start justify-center w-full bg-gray-50 h-dvh">
      <div className="w-dvw max-w-[1600px] flex flex-col gap-4 px-4 bg-white min-h-dvh">
        {/* 상단 네비게이션 바 */}
        <div className="flex items-center w-full justify-between relative p-2">
          <div className="border border-gray-300 rounded-md p-2">Logo</div>
          <div className="border w-25 h-10 border-b-blue-400 absolute right-[50%] translate-x-[50%] flex items-center justify-center">
            {month}월
          </div>
          <div className="border w-25 h-10 border-b-blue-400 flex items-center justify-center">
            유저정보
          </div>
        </div>

        {/* 하단 컨텐츠 */}
        <div className="flex flex-col items-start border border-gray-300 rounded-md w-full p-6">
          <div className="flex items-start justify-center w-full mb-[20px]">
            {year}년 {month}월 수입 / 지출 입력
          </div>
          <EntryClient
            year={year}
            month={month}
            incomes={incomes.map((i) => ({
              id: i.id,
              type: i.type,
              label: i.label,
              amount: i.amount,
            }))}
            expenses={expenses.map((e) => ({
              id: e.id,
              kind: e.kind,
              label: e.label,
              amount: e.amount,
              round: e.round,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
