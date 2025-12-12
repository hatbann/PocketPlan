"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";

type IncomeType = "salary" | "bonus" | "etc";
type ExpenseType = "static" | "variable" | "installment";

const IncomeTypeList: Record<IncomeType, { name: string }> = {
  salary: { name: "월급" },
  bonus: { name: "보너스" },
  etc: { name: "기타" },
};

const ExpenseTypeList: Record<ExpenseType, { name: string }> = {
  static: { name: "고정" },
  variable: { name: "변동" },
  installment: { name: "할부" },
};

const Page = () => {
  const [selectedTab, setSelectedTab] = useState<"income" | "expense">(
    "income"
  );

  const [selectedIncomeType, setSelectedIncomeType] =
    useState<IncomeType | null>(null);
  const [isIncomeTypeListOpen, setIsIncomeTypeListOpen] = useState(false);

  const [selectedExpenseType, setSelectedExpenseType] =
    useState<ExpenseType | null>(null);
  const [isExpenseTypeListOpen, setIsExpenseTypeListOpen] = useState(false);

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
        <div className="flex flex-col items-start border border-gray-300 rounded-md justify-center w-full p-6 w-full">
          <div className="flex items-start justify-center w-full mb-[20px]">
            수입 / 지출 입력
          </div>
          <div className="w-full flex flex-col gap-4">
            {/* 수입/지출 탭 */}
            <div className="flex flex-row gap-2">
              <button
                className={`w-25 cursor-pointer border border-gray-300 rounded-md p-2 ${
                  selectedTab === "income"
                    ? "bg-blue-300 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                onClick={() => setSelectedTab("income")}
              >
                수입
              </button>
              <button
                className={`w-25 cursor-pointer border border-gray-300 rounded-md p-2 ${
                  selectedTab === "expense"
                    ? "bg-blue-300 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
                onClick={() => setSelectedTab("expense")}
              >
                지출
              </button>
            </div>
            <div className="flex gap-4 w-full">
              {/*입력부분 */}
              <div className="w-1/2 border border-gray-300 rounded-md p-2">
                {selectedTab === "income" ? (
                  <>
                    <div>수입 입력</div>
                    <div className="relative">
                      <div className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md p-2 w-[150px] h-[40px] justify-between">
                        <div>
                          {selectedIncomeType
                            ? IncomeTypeList[selectedIncomeType].name
                            : "수입 유형 선택"}
                        </div>
                        {isIncomeTypeListOpen ? (
                          <ChevronUp
                            className="w-4 h-4"
                            onClick={() => setIsIncomeTypeListOpen(false)}
                          />
                        ) : (
                          <ChevronDown
                            className="w-4 h-4"
                            onClick={() => setIsIncomeTypeListOpen(true)}
                          />
                        )}
                      </div>
                      {isIncomeTypeListOpen && (
                        <ul className="absolute top-[45px] left-0 w-[150px] bg-white border border-gray-300 rounded-md ">
                          <li
                            className="cursor-pointer rounded-t-md hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedIncomeType("salary");
                              setIsIncomeTypeListOpen(false);
                            }}
                          >
                            월급
                          </li>
                          <li
                            className="cursor-pointer hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedIncomeType("bonus");
                              setIsIncomeTypeListOpen(false);
                            }}
                          >
                            보너스
                          </li>
                          <li
                            className="cursor-pointer rounded-b-md hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedIncomeType("etc");
                              setIsIncomeTypeListOpen(false);
                            }}
                          >
                            기타
                          </li>
                        </ul>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div>지출 입력</div>
                    <div className="relative">
                      <div className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md p-2 w-[150px] h-[40px] justify-between">
                        <div>
                          {selectedExpenseType
                            ? ExpenseTypeList[selectedExpenseType].name
                            : "지출 유형 선택"}
                        </div>
                        {isExpenseTypeListOpen ? (
                          <ChevronUp
                            className="w-4 h-4"
                            onClick={() => setIsExpenseTypeListOpen(false)}
                          />
                        ) : (
                          <ChevronDown
                            className="w-4 h-4"
                            onClick={() => setIsExpenseTypeListOpen(true)}
                          />
                        )}
                      </div>
                      {isExpenseTypeListOpen && (
                        <ul className="absolute top-[45px] left-0 w-[150px] bg-white border border-gray-300 rounded-md ">
                          <li
                            className="cursor-pointer rounded-t-md hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedExpenseType("static");
                              setIsExpenseTypeListOpen(false);
                            }}
                          >
                            고정
                          </li>
                          <li
                            className="cursor-pointer hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedExpenseType("variable");
                              setIsExpenseTypeListOpen(false);
                            }}
                          >
                            변동
                          </li>
                          <li
                            className="cursor-pointer rounded-b-md hover:bg-gray-100 p-2"
                            onClick={() => {
                              setSelectedExpenseType("installment");
                              setIsExpenseTypeListOpen(false);
                            }}
                          >
                            할부
                          </li>
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
              {/* 리스트 부분*/}
              <div className="w-1/2 border border-gray-300 rounded-md p-2">
                {" "}
                {selectedTab === "income" ? (
                  <>
                    <div>수입 리스트</div>
                  </>
                ) : (
                  <>
                    <div>지출 리스트</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
