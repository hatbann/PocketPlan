"use client";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import React, { useState, useTransition } from "react";
import {
  addIncome,
  addExpense,
  addInstallment,
  deleteIncome,
  deleteExpense,
  type ActionResult,
} from "@/app/lib/actions";
import { formatKRW } from "@/app/lib/format";
import type { IncomeType } from "@/app/generated/prisma/enums";
import type { ExpenseKind } from "@/app/generated/prisma/enums";

const IncomeTypeList: Record<IncomeType, { name: string }> = {
  salary: { name: "월급" },
  bonus: { name: "보너스" },
  etc: { name: "기타" },
};
const ExpenseTypeList: Record<ExpenseKind, { name: string }> = {
  static: { name: "고정" },
  variable: { name: "변동" },
  installment: { name: "할부" },
};

export type IncomeRow = { id: string; type: IncomeType; label: string; amount: number };
export type ExpenseRow = {
  id: string;
  kind: ExpenseKind;
  label: string;
  amount: number;
  round: number | null;
};

type Props = {
  year: number;
  month: number;
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
};

/** 금액 문자열에서 숫자만 추출(콤마/공백 제거). 빈 값이면 "" 반환. */
function parseAmountInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

export default function EntryClient({ year, month, incomes, expenses }: Props) {
  const [selectedTab, setSelectedTab] = useState<"income" | "expense">("income");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // 수입 입력 폼 상태
  const [incomeType, setIncomeType] = useState<IncomeType | null>(null);
  const [incomeTypeOpen, setIncomeTypeOpen] = useState(false);
  const [incomeLabel, setIncomeLabel] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");

  // 지출 입력 폼 상태
  const [expenseKind, setExpenseKind] = useState<ExpenseKind | null>(null);
  const [expenseKindOpen, setExpenseKindOpen] = useState(false);
  const [expenseLabel, setExpenseLabel] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  // 할부 전용
  const [totalMonths, setTotalMonths] = useState("");
  const [round, setRound] = useState("");

  function run(action: () => Promise<ActionResult>, onSuccess: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok) onSuccess();
      else setError(res.error);
    });
  }

  function submitIncome() {
    if (!incomeType) return setError("수입 유형을 선택하세요.");
    run(
      () =>
        addIncome({
          year,
          month,
          type: incomeType,
          label: incomeLabel,
          amount: incomeAmount,
        }),
      () => {
        setIncomeLabel("");
        setIncomeAmount("");
        setIncomeType(null);
      }
    );
  }

  function submitExpense() {
    if (!expenseKind) return setError("지출 유형을 선택하세요.");
    if (expenseKind === "installment") {
      run(
        () =>
          addInstallment({
            year,
            month,
            label: expenseLabel,
            monthlyAmount: expenseAmount,
            totalMonths,
            round,
          }),
        () => {
          setExpenseLabel("");
          setExpenseAmount("");
          setTotalMonths("");
          setRound("");
          setExpenseKind(null);
        }
      );
    } else {
      run(
        () =>
          addExpense({
            year,
            month,
            kind: expenseKind,
            label: expenseLabel,
            amount: expenseAmount,
          }),
        () => {
          setExpenseLabel("");
          setExpenseAmount("");
          setExpenseKind(null);
        }
      );
    }
  }

  const inputCls =
    "border border-gray-300 rounded-md p-2 w-full h-[40px] outline-none focus:border-blue-400";

  return (
    <div className="w-full flex flex-col gap-4">
      {/* 수입/지출 탭 */}
      <div className="flex flex-row gap-2">
        <button
          className={`w-25 cursor-pointer border border-gray-300 rounded-md p-2 ${
            selectedTab === "income"
              ? "bg-blue-300 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
          onClick={() => {
            setSelectedTab("income");
            setError(null);
          }}
        >
          수입
        </button>
        <button
          className={`w-25 cursor-pointer border border-gray-300 rounded-md p-2 ${
            selectedTab === "expense"
              ? "bg-blue-300 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
          onClick={() => {
            setSelectedTab("expense");
            setError(null);
          }}
        >
          지출
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="flex gap-4 w-full">
        {/* 입력 부분 */}
        <div className="w-1/2 border border-gray-300 rounded-md p-4 flex flex-col gap-3">
          {selectedTab === "income" ? (
            <>
              <div className="font-medium">수입 입력</div>
              {/* 유형 드롭다운 */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md p-2 w-[150px] h-[40px] justify-between"
                  onClick={() => setIncomeTypeOpen((v) => !v)}
                >
                  <div>
                    {incomeType ? IncomeTypeList[incomeType].name : "수입 유형 선택"}
                  </div>
                  {incomeTypeOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                {incomeTypeOpen && (
                  <ul className="absolute top-[45px] left-0 w-[150px] bg-white border border-gray-300 rounded-md z-10">
                    {(Object.keys(IncomeTypeList) as IncomeType[]).map((t, i, arr) => (
                      <li
                        key={t}
                        className={`cursor-pointer hover:bg-gray-100 p-2 ${
                          i === 0 ? "rounded-t-md" : ""
                        } ${i === arr.length - 1 ? "rounded-b-md" : ""}`}
                        onClick={() => {
                          setIncomeType(t);
                          setIncomeTypeOpen(false);
                        }}
                      >
                        {IncomeTypeList[t].name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                className={inputCls}
                placeholder="수입 이름 (예: 6월 월급)"
                value={incomeLabel}
                onChange={(e) => setIncomeLabel(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder="금액 (원)"
                inputMode="numeric"
                value={incomeAmount ? Number(incomeAmount).toLocaleString("ko-KR") : ""}
                onChange={(e) => setIncomeAmount(parseAmountInput(e.target.value))}
              />
              <button
                className="bg-blue-500 text-white rounded-md p-2 h-[40px] cursor-pointer disabled:opacity-50"
                disabled={isPending}
                onClick={submitIncome}
              >
                {isPending ? "저장 중..." : "수입 추가"}
              </button>
            </>
          ) : (
            <>
              <div className="font-medium">지출 입력</div>
              {/* 유형 드롭다운 */}
              <div className="relative">
                <div
                  className="flex items-center gap-2 cursor-pointer border border-gray-300 rounded-md p-2 w-[150px] h-[40px] justify-between"
                  onClick={() => setExpenseKindOpen((v) => !v)}
                >
                  <div>
                    {expenseKind ? ExpenseTypeList[expenseKind].name : "지출 유형 선택"}
                  </div>
                  {expenseKindOpen ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
                {expenseKindOpen && (
                  <ul className="absolute top-[45px] left-0 w-[150px] bg-white border border-gray-300 rounded-md z-10">
                    {(Object.keys(ExpenseTypeList) as ExpenseKind[]).map((k, i, arr) => (
                      <li
                        key={k}
                        className={`cursor-pointer hover:bg-gray-100 p-2 ${
                          i === 0 ? "rounded-t-md" : ""
                        } ${i === arr.length - 1 ? "rounded-b-md" : ""}`}
                        onClick={() => {
                          setExpenseKind(k);
                          setExpenseKindOpen(false);
                        }}
                      >
                        {ExpenseTypeList[k].name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                className={inputCls}
                placeholder="지출 이름 (예: 월세)"
                value={expenseLabel}
                onChange={(e) => setExpenseLabel(e.target.value)}
              />
              <input
                className={inputCls}
                placeholder={expenseKind === "installment" ? "회차당 금액 (원)" : "금액 (원)"}
                inputMode="numeric"
                value={expenseAmount ? Number(expenseAmount).toLocaleString("ko-KR") : ""}
                onChange={(e) => setExpenseAmount(parseAmountInput(e.target.value))}
              />
              {/* 할부 전용 입력 */}
              {expenseKind === "installment" && (
                <div className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder="전체 개월수 (예: 5)"
                    inputMode="numeric"
                    value={totalMonths}
                    onChange={(e) => setTotalMonths(parseAmountInput(e.target.value))}
                  />
                  <input
                    className={inputCls}
                    placeholder="이번 회차 (예: 2)"
                    inputMode="numeric"
                    value={round}
                    onChange={(e) => setRound(parseAmountInput(e.target.value))}
                  />
                </div>
              )}
              <button
                className="bg-blue-500 text-white rounded-md p-2 h-[40px] cursor-pointer disabled:opacity-50"
                disabled={isPending}
                onClick={submitExpense}
              >
                {isPending ? "저장 중..." : "지출 추가"}
              </button>
            </>
          )}
        </div>

        {/* 리스트 부분 */}
        <div className="w-1/2 border border-gray-300 rounded-md p-4">
          {selectedTab === "income" ? (
            <>
              <div className="font-medium mb-2">수입 리스트</div>
              {incomes.length === 0 ? (
                <div className="text-gray-400 text-sm">등록된 수입이 없습니다.</div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {incomes.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between border border-gray-200 rounded-md p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-500">
                          {IncomeTypeList[it.type].name}
                        </span>
                        <span>{it.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-600">{formatKRW(it.amount)}</span>
                        <Trash2
                          className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
                          onClick={() => run(() => deleteIncome(it.id), () => {})}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="font-medium mb-2">지출 리스트</div>
              {expenses.length === 0 ? (
                <div className="text-gray-400 text-sm">등록된 지출이 없습니다.</div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {expenses.map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between border border-gray-200 rounded-md p-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-gray-100 rounded px-2 py-0.5 text-gray-500">
                          {ExpenseTypeList[it.kind].name}
                          {it.kind === "installment" && it.round != null
                            ? ` ${it.round}회차`
                            : ""}
                        </span>
                        <span>{it.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-red-600">{formatKRW(it.amount)}</span>
                        <Trash2
                          className="w-4 h-4 text-gray-400 hover:text-red-500 cursor-pointer"
                          onClick={() => run(() => deleteExpense(it.id), () => {})}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
