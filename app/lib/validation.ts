// 입력 검증 (서버측). 클라이언트 검증만 신뢰하지 않는다(보안/QA: CALC-2).
// 금액은 양의 정수(원). 부동소수점 금지(D5).

import { IncomeType } from "@/app/generated/prisma/enums";
import { ExpenseKind } from "@/app/generated/prisma/enums";

/** 검증 실패 시 던지는 에러. Server Action에서 잡아 사용자 메시지로 변환. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** 금액: 유한한 0 이상 정수여야 한다. 통과 시 정규화된 정수 반환. */
export function assertAmount(value: unknown, field = "금액"): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    throw new ValidationError(`${field}은(는) 숫자여야 합니다.`);
  }
  if (!Number.isInteger(n)) {
    throw new ValidationError(`${field}은(는) 정수(원)여야 합니다.`);
  }
  if (n < 0) {
    throw new ValidationError(`${field}은(는) 0 이상이어야 합니다.`);
  }
  return n;
}

/** 라벨: 비어있지 않은 문자열. 앞뒤 공백 제거 후 반환. */
export function assertLabel(value: unknown, field = "이름"): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${field}을(를) 입력하세요.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${field}을(를) 입력하세요.`);
  }
  if (trimmed.length > 100) {
    throw new ValidationError(`${field}은(는) 100자 이내여야 합니다.`);
  }
  return trimmed;
}

/** 연: 정수 2000~9999. */
export function assertYear(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 2000 || n > 9999) {
    throw new ValidationError("연도가 올바르지 않습니다.");
  }
  return n;
}

/** 월: 정수 1~12. */
export function assertMonth(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 12) {
    throw new ValidationError("월은 1~12 사이여야 합니다.");
  }
  return n;
}

/** 수입 유형 enum 검증. */
export function assertIncomeType(value: unknown): IncomeType {
  if (typeof value === "string" && value in IncomeType) {
    return value as IncomeType;
  }
  throw new ValidationError("수입 유형이 올바르지 않습니다.");
}

/** 지출 유형 enum 검증. */
export function assertExpenseKind(value: unknown): ExpenseKind {
  if (typeof value === "string" && value in ExpenseKind) {
    return value as ExpenseKind;
  }
  throw new ValidationError("지출 유형이 올바르지 않습니다.");
}

/** 할부 전체 개월수: 정수 1 이상. */
export function assertTotalMonths(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
    throw new ValidationError("할부 개월수는 1 이상의 정수여야 합니다.");
  }
  return n;
}

/** 할부 회차: 정수 1 이상이고 totalMonths 이하. */
export function assertRound(value: unknown, totalMonths: number): number {
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isInteger(n) || n < 1) {
    throw new ValidationError("할부 회차는 1 이상의 정수여야 합니다.");
  }
  if (n > totalMonths) {
    throw new ValidationError(
      `할부 회차(${n})가 전체 개월수(${totalMonths})를 초과할 수 없습니다.`
    );
  }
  return n;
}
