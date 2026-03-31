import { DAY_END, DAY_START, SLOT_MINUTES } from "@/lib/constants";

/** 해당 날짜의 슬롯 시작 시각 목록 (로컬 기준) */
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

/** 시작일~종료일 각 날짜 (시간 00:00) */
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

export function formatDateLabel(d: Date): string {
  const w = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}(${w})`;
}
