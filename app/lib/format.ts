// 표시용 포맷 유틸 (클라이언트/서버 공용).

/** 원 단위 정수를 "1,234,567원" 형태로. 음수도 처리. */
export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

/** 부호 포함 표시 ("+1,000원" / "-500원") — 저축액 강조 등에 사용. */
export function formatSignedKRW(amount: number): string {
  const sign = amount > 0 ? "+" : amount < 0 ? "−" : "";
  return `${sign}${Math.abs(amount).toLocaleString("ko-KR")}원`;
}
