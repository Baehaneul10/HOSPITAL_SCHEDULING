import { DAY_END, DAY_START, SLOT_MINUTES } from "./constants";

/** 로컬 기준 YYYY-MM-DD (date input·조회 기본값에 사용, UTC toISOString 역전 방지) */
export function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

export function generateTimeSlotsForDay(day: Date): Date[] {
  const slots: Date[] = [];
  const cursor = new Date(day);
  cursor.setHours(DAY_START.hour, DAY_START.minute, 0, 0);
  const endLimit = new Date(day);
  endLimit.setHours(DAY_END.hour, DAY_END.minute, 0, 0);

  while (cursor < endLimit) {
    slots.push(new Date(cursor));
    cursor.setMinutes(cursor.getMinutes() + SLOT_MINUTES);
  }
  return slots;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function eachDayInclusive(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export function formatTimeHm(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** 스프레드시트 형식: 2024-11-01(금) */
export function formatDateLabel(d: Date): string {
  const w = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}(${w})`;
}
