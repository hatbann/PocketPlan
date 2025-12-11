"use client";
import React, { useState } from "react";

const SummaryCard = () => {
  const [isDetail, setIsDetail] = useState(false);
  const [detailType, setDetailType] = useState<"income" | "expense">("expense");
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex flex-row gap-4 ">
        <div className="flex flex-col gap-4 w-1/3">
          {/*지출 요약*/}
          <div className=" w-full flex flex-col gap-2">
            <div>지출 요약</div>
            <div className="border border-gray-300 rounded-md p-2 w-[400px] h-[200px]">
              <button
                onClick={() => {
                  setDetailType("expense");
                  setIsDetail(true);
                }}
              >
                지출 상세
              </button>
            </div>
          </div>
          {/*수입 요약*/}
          <div className=" w-full flex flex-col gap-2">
            <div>수입 요약</div>
            <div className="border border-gray-300 rounded-md p-2 w-[400px] h-[200px]">
              <button
                onClick={() => {
                  setDetailType("income");
                  setIsDetail(true);
                }}
              >
                수입 상세
              </button>
            </div>
          </div>
        </div>
        {isDetail ? (
          <div className="flex flex-col gap-2  w-2/3 h-auto">
            <div className="flex flex-row gap-2 justify-between">
              <span>{detailType === "expense" ? "지출" : "수입"} 상세</span>
              <button
                onClick={() => {
                  setIsDetail(false);
                }}
              >
                그래프 보기
              </button>
            </div>
            <div className="border border-gray-300 rounded-md p-2 w-full h-full ">
              {detailType === "expense" ? (
                <div>지출 상세</div>
              ) : (
                <div>수입 상세</div>
              )}
            </div>
          </div>
        ) : (
          <div className=" flex flex-col gap-2 w-2/3 h-auto">
            <div>그래프</div>
            <div className="border border-gray-300 rounded-md p-2 w-full h-full  "></div>
          </div>
        )}
      </div>
      <div className="border border-gray-300 rounded-md p-2">
        {/**저축 요약*/}
        <div className="">저축 요약</div>
      </div>
    </div>
  );
};

export default SummaryCard;
