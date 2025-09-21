/**
 * apps/web/src/lib/saju/core.ts
 * 사주 핵심 계산 모듈 (현재는 Mock, 이후 실제 계산 로직 교체 예정)
 */

export interface SajuInput {
  birthDate: string;   // YYYY-MM-DD
  birthTime?: string;  // HH:mm (optional)
  timezone?: string;   // e.g. "Asia/Seoul"
  place?: string;      // 출생지 텍스트 (옵션)
}

export interface SajuCoreResult {
  year: string;                 // 년간지
  month: string;                // 월간지
  day: string;                  // 일간지
  time?: string;                // 시간지
  elements: Record<string, number>; // 오행 분포 {목, 화, 토, 금, 수}
  tenGods?: string[];           // 십신 배열
  emptyBranches?: string[];     // 공망
}

// TODO: 실제 간지/절기/십신 계산 로직은 이후 단계에서 구현
export function calculateSaju(input: SajuInput): SajuCoreResult {
  // 현재는 Mock 결과를 반환 (UI/API 파이프라인 검증용)
  return {
    year: "갑자(甲子)",
    month: "을축(乙丑)",
    day: "병인(丙寅)",
    time: input.birthTime ? "정묘(丁卯)" : undefined,
    elements: {
      "목": 2,
      "화": 1,
      "토": 1,
      "금": 0,
      "수": 2,
    },
    tenGods: ["비견", "겁재", "식신", "정재"],
    emptyBranches: ["신유"],
  };
}
