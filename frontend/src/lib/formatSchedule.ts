import { VISIT_TYPES } from "./constants";
import type { AppointmentRow } from "@/types/models";

/** 캘린더·검색 표: 환자명(병동 또는 외) */
export function patientNameWard(a: AppointmentRow): string {
  const p = a.patient;
  if (p.visitType === VISIT_TYPES.OUTPATIENT) return `${p.name}(외)`;
  const w = p.wardOrNote?.trim();
  return w ? `${p.name}(${w})` : p.name;
}

export function statusLabelKo(status: string): string {
  if (status === "COMPLETED") return "완료";
  if (status === "CANCELLED") return "취소";
  if (status === "SCHEDULED") return "예약";
  return status;
}

export function formatTimeFromIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * 스프레드시트 스타일 한 줄: HH:mm ▶ 환자(병동) ▶ 치료명 ▶ 옵션 ▶ 상태
 */
/** 검색 테이블 병동 열 */
export function wardCell(a: AppointmentRow): string {
  const p = a.patient;
  if (p.visitType === VISIT_TYPES.OUTPATIENT) return "외";
  return p.wardOrNote?.trim() || "—";
}

export function formatCalendarLine(a: AppointmentRow): string {
  const t = formatTimeFromIso(a.treatmentDateTime);
  const name = patientNameWard(a);
  const tr = a.treatmentName;
  const code = a.treatmentOption?.trim() ? a.treatmentOption : "—";
  const st = statusLabelKo(a.treatmentStatus);
  return `${t} ▶ ${name} ▶ ${tr} ▶ ${code} ▶ ${st}`;
}
