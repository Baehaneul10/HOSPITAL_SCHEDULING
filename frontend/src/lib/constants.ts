export const SLOT_MINUTES = 40;
export const DAY_START = { hour: 8, minute: 40 };
export const DAY_END = { hour: 17, minute: 0 };

export const ROLES = {
  ADMIN: "ADMIN",
  THERAPIST: "THERAPIST",
} as const;

export const VISIT_TYPES = {
  INPATIENT: "INPATIENT",
  OUTPATIENT: "OUTPATIENT",
} as const;

/** 스프레드시트와 동일: K/J/S + 무료 등 */
export const TREATMENT_OPTIONS = ["K", "J", "S", "무료"] as const;

export const TREATMENT_STATUSES = {
  SCHEDULED: "SCHEDULED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

/** 치료스케줄관리에서 선택 가능한 치료명 (추가 시 여기에 확장) */
export const TREATMENT_NAMES = ["역박동", "페인잼머"] as const;

export const DEFAULT_TREATMENT_NAME = TREATMENT_NAMES[0];
