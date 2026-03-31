/** 역박동 등 고정 슬롯 (분) */
export const SLOT_MINUTES = 40;
/** 하루 시작 시각 (시, 분) */
export const DAY_START = { hour: 8, minute: 40 };
/** 하루 종료 시각 (이 시각 미만까지 슬롯 생성) */
export const DAY_END = { hour: 17, minute: 0 };

export const ROLES = {
  ADMIN: "ADMIN",
  THERAPIST: "THERAPIST",
} as const;

export const VISIT_TYPES = {
  INPATIENT: "INPATIENT",
  OUTPATIENT: "OUTPATIENT",
} as const;

export const TREATMENT_OPTIONS = ["K", "J", "S"] as const;

export const TREATMENT_STATUSES = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export const DEFAULT_TREATMENT_NAME = "역박동";
