"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Appt = {
  id: string;
  treatmentDateTime: string;
  treatmentName: string;
  treatmentStatus: string;
  patient: { name: string };
};

type DisplayMode = "name" | "nameComma" | "nameAnd";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatEventTitle(a: Appt, mode: DisplayMode) {
  const n = a.patient.name;
  const t = a.treatmentName;
  if (mode === "name") return n;
  if (mode === "nameComma") return `${n}, ${t}`;
  return `${n} & ${t}`;
}

export function ScheduleCalendarClient() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<DisplayMode>("nameComma");
  const [filterTreatment, setFilterTreatment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const fromStr = useMemo(() => {
    const s = startOfMonth(cursor);
    return s.toISOString().slice(0, 10);
  }, [cursor]);

  const toStr = useMemo(() => {
    const e = endOfMonth(cursor);
    return e.toISOString().slice(0, 10);
  }, [cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("from", fromStr);
    params.set("to", toStr);
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    let list: Appt[] = data.items ?? [];
    if (filterTreatment.trim()) {
      const ft = filterTreatment.trim();
      list = list.filter((x) => x.treatmentName.includes(ft));
    }
    if (filterStatus.trim()) {
      const fs = filterStatus.trim();
      list = list.filter((x) => x.treatmentStatus.includes(fs));
    }
    setItems(list);
    setLoading(false);
  }, [fromStr, toStr, filterTreatment, filterStatus]);

  useEffect(() => {
    load();
  }, [load]);

  const byDay = useMemo(() => {
    const map = new Map<string, Appt[]>();
    for (const a of items) {
      const d = new Date(a.treatmentDateTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const arr of map.values()) {
      arr.sort((x, y) => new Date(x.treatmentDateTime).getTime() - new Date(y.treatmentDateTime).getTime());
    }
    return map;
  }, [items]);

  const weeks = useMemo(() => {
    const first = startOfMonth(cursor);
    const last = endOfMonth(cursor);
    const startPad = first.getDay();
    const daysInMonth = last.getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [cursor]);

  const title = `${cursor.getFullYear()}년 ${cursor.getMonth() + 1}월`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => setCursor((c) => addMonths(c, -1))}
          >
            이전 달
          </button>
          <span className="min-w-[140px] text-center font-semibold text-slate-800">{title}</span>
          <button
            type="button"
            className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            onClick={() => setCursor((c) => addMonths(c, 1))}
          >
            다음 달
          </button>
          <button
            type="button"
            className="ml-2 rounded bg-slate-200 px-3 py-1.5 text-sm hover:bg-slate-300"
            onClick={() => setCursor(startOfMonth(new Date()))}
          >
            오늘
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-l border-slate-200 pl-4">
          <span className="text-xs font-medium text-slate-600">표시</span>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" name="dm" checked={mode === "name"} onChange={() => setMode("name")} />
            이름
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" name="dm" checked={mode === "nameComma"} onChange={() => setMode("nameComma")} />
            이름, 치료
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="radio" name="dm" checked={mode === "nameAnd"} onChange={() => setMode("nameAnd")} />
            이름 &amp; 치료 (한 줄)
          </label>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-0.5 block text-xs text-slate-600">치료명 필터</label>
            <input
              value={filterTreatment}
              onChange={(e) => setFilterTreatment(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
              placeholder="부분일치"
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-slate-600">상태 필터</label>
            <input
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
              placeholder="예: COMPLETED"
            />
          </div>
          <button type="button" onClick={() => load()} className="rounded bg-blue-800 px-3 py-1.5 text-sm text-white">
            적용
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-300 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100">
                {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
                  <th key={w} className="border border-slate-200 py-2 font-medium text-slate-700">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wi) => (
                <tr key={wi}>
                  {week.map((day, di) => {
                    if (!day) {
                      return <td key={`e-${wi}-${di}`} className="border border-slate-100 bg-slate-50 align-top" />;
                    }
                    const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                    const list = byDay.get(key) ?? [];
                    const today = sameDay(day, new Date());
                    return (
                      <td
                        key={key}
                        className={`h-28 border border-slate-200 align-top p-1 ${today ? "bg-blue-50/60" : "bg-white"}`}
                      >
                        <div className="mb-1 font-semibold text-slate-800">{day.getDate()}</div>
                        <ul className="space-y-0.5">
                          {list.map((a) => (
                            <li key={a.id} className="leading-tight text-[11px] text-slate-800">
                              {mode === "nameAnd" ? (
                                <span>
                                  <span className="font-medium">{a.patient.name}</span>
                                  <span className="text-slate-500"> &amp; </span>
                                  <span>{a.treatmentName}</span>
                                </span>
                              ) : (
                                <span className={mode === "nameComma" ? "" : "font-medium"}>
                                  {formatEventTitle(a, mode)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
