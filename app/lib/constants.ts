// MVP 공통 상수.

// MVP는 인증 없이 고정 사용자 1명(seed로 생성됨, D1).
// M4에서 NextAuth 도입 시 이 상수를 세션 기반 userId 조회로 교체한다.
// → 이 파일을 import하는 곳이 인증 도입 시 바꿔야 할 지점이다.
export const CURRENT_USER_ID = "seed-user-0001";
