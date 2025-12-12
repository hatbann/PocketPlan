"use client";
import React, { useState } from "react";
import SummaryCard from "../_components/overview/SummaryCard";
import { SquareArrowOutUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
const Page = () => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("12월");

  return (
    <div className="flex items-start justify-center w-full bg-gray-50 h-dvh">
      <div className="w-dvw max-w-[1600px] flex flex-col gap-4 px-4 bg-white min-h-dvh">
        {/* 상단 네비게이션 바 */}
        <div className="flex items-center w-full justify-between relative p-2 ]">
          <div className="border border-gray-300 rounded-md p-2">Logo</div>
          <div className="border w-25 h-10 border-b-blue-400 absolute right-[50%] translate-x-[50%]">
            월 선택
          </div>
          <div className="border w-25 h-10 border-b-blue-400">유저정보</div>
        </div>
        {/* 하단 컨텐츠 */}
        <div className="flex flex-col items-start border border-gray-300 rounded-md justify-center w-full p-6">
          <div className="flex items-start justify-center w-full mb-[20px]">
            {selectedDate} 요약
          </div>
          <SummaryCard />
          <div className="flex w-full  flex-row gap-4 justify-end mt-4">
            <div className="flex items-center gap-2">
              <span
                className="text-blue-400 cursor-pointer"
                onClick={() => router.push("/entry")}
              >
                새 수입/지출 입력하기
              </span>
              <SquareArrowOutUpRight className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
