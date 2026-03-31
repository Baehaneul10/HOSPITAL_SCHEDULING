"use client";

import {
  DEFAULT_TREATMENT_NAME,
  TREATMENT_OPTIONS,
  TREATMENT_STATUSES,
  VISIT_TYPES,
} from "@/lib/constants";
import {
  eachDayInclusive,
  formatDateLabel,
  formatTimeHm,
  generateTimeSlotsForDay,
  startOfDay,
} from "@/lib/slots";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Patient = {
  id: string;
  chartNumber: string;
  name: string;
  visitType: string;
  wardOrNote: string | null;
};

type Appt = {
  id: string;
  patientId: string;
  treatmentDateTime: string;
  treatmentName: string;
  treatmentOption: string | null;
  treatmentStatus: string;
  treatmentDetail: string | null;
  referenceNotes: string | null;
  remarks: string | null;
  patient: Patient;
};

function patientLabel(p: Patient) {
  const ward =
    p.visitType === VISIT_TYPES.OUTPATIENT
      ? "(외)"
      : p.wardOrNote
        ? `(${p.wardOrNote})`
        : "";
  return `${p.name}${ward}`;
}

function rowKeyFromSlot(slot: Date) {
  const d = startOfDay(slot);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}_${formatTimeHm(slot)}`;
}

function parseLocalDate(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

export function CounterPulsationClient() {
  const endAnchorRef = useRef<HTMLDivElement>(null);
  const [fromStr, setFromStr] = useState(() => {
    const t = new Date();
    return t.toISOString().slice(0, 10);
  });
  const [toStr, setToStr] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() + 14);
    return t.toISOString().slice(0, 10);
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatients = useCallback(async () => {
    const res = await fetch("/api/patients?limit=500");
    const data = await res.json();
    setPatients(data.items ?? []);
  }, []);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("from", fromStr);
    params.set("to", toStr);
    params.set("treatmentName", DEFAULT_TREATMENT_NAME);
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setAppointments(data.items ?? []);
    setLoading(false);
  }, [fromStr, toStr]);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const apptBySlot = useMemo(() => {
    const map = new Map<string, Appt>();
    for (const a of appointments) {
      const dt = new Date(a.treatmentDateTime);
      const k = rowKeyFromSlot(dt);
      if (!map.has(k)) map.set(k, a);
    }
    return map;
  }, [appointments]);

  const days = useMemo(() => eachDayInclusive(parseLocalDate(fromStr), parseLocalDate(toStr)), [fromStr, toStr]);

  function scrollToLatest() {
    endAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={scrollToLatest}
          className="rounded bg-orange-500 px-4 py-2 font-medium text-white shadow hover:bg-orange-600"
        >
          최신 날짜로 이동
        </button>
        <span className="text-slate-700">최신 날짜로 이동한 뒤 빈 슬롯에 예약을 입력할 수 있습니다.</span>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-sm">
        <div>
          <label className="mb-1 block text-xs text-slate-600">시작일</label>
          <input
            type="date"
            value={fromStr}
            onChange={(e) => setFromStr(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-600">종료일</label>
          <input
            type="date"
            value={toStr}
            onChange={(e) => setToStr(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1.5"
          />
        </div>
        <button
          type="button"
          onClick={() => loadAppointments()}
          className="rounded bg-slate-700 px-3 py-1.5 text-white hover:bg-slate-800"
        >
          조회
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">불러오는 중…</p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[1200px] w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-xs text-slate-700">
                <th className="border border-slate-200 px-2 py-2 whitespace-nowrap">치료일자</th>
                <th className="border border-slate-200 px-2 py-2 whitespace-nowrap">치료시작시간</th>
                <th className="border border-slate-200 px-2 py-2 whitespace-nowrap">환자명 (병동)</th>
                <th className="border border-slate-200 px-2 py-2">치료</th>
                <th className="border border-slate-200 px-2 py-2">치료옵션</th>
                <th className="border border-slate-200 px-2 py-2">치료상태</th>
                <th className="border border-slate-200 px-2 py-2 min-w-[180px]">치료정보</th>
                <th className="border border-slate-200 px-2 py-2 min-w-[180px]">참고사항</th>
                <th className="border border-slate-200 px-2 py-2 min-w-[120px]">비고</th>
                <th className="border border-slate-200 px-2 py-2">저장</th>
              </tr>
            </thead>
            <tbody>
              {days.flatMap((day) => {
                const slots = generateTimeSlotsForDay(day);
                return slots.map((slot) => {
                  const rk = rowKeyFromSlot(slot);
                  const appt = apptBySlot.get(rk);
                  return (
                    <GridRow
                      key={rk}
                      slot={slot}
                      dayLabel={formatDateLabel(day)}
                      patients={patients}
                      existing={appt}
                      onSaved={loadAppointments}
                    />
                  );
                });
              })}
            </tbody>
          </table>
        </div>
      )}
      <div ref={endAnchorRef} />
    </div>
  );
}

function optColor(code: string) {
  if (code === "K") return "bg-rose-100 text-rose-900";
  if (code === "J") return "bg-amber-100 text-amber-900";
  if (code === "S") return "bg-orange-100 text-orange-900";
  return "bg-slate-100";
}

function GridRow({
  slot,
  dayLabel,
  patients,
  existing,
  onSaved,
}: {
  slot: Date;
  dayLabel: string;
  patients: Patient[];
  existing?: Appt;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState(existing?.patientId ?? "");
  const [treatmentOption, setTreatmentOption] = useState(existing?.treatmentOption ?? "");
  const [treatmentStatus, setTreatmentStatus] = useState(existing?.treatmentStatus ?? TREATMENT_STATUSES.SCHEDULED);
  const [treatmentDetail, setTreatmentDetail] = useState(existing?.treatmentDetail ?? "");
  const [referenceNotes, setReferenceNotes] = useState(existing?.referenceNotes ?? "");
  const [remarks, setRemarks] = useState(existing?.remarks ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPatientId(existing?.patientId ?? "");
    setTreatmentOption(existing?.treatmentOption ?? "");
    setTreatmentStatus(existing?.treatmentStatus ?? TREATMENT_STATUSES.SCHEDULED);
    setTreatmentDetail(existing?.treatmentDetail ?? "");
    setReferenceNotes(existing?.referenceNotes ?? "");
    setRemarks(existing?.remarks ?? "");
  }, [existing]);

  async function save() {
    if (!patientId) {
      alert("환자를 선택하세요.");
      return;
    }
    setSaving(true);
    const iso = slot.toISOString();
    const body = {
      patientId,
      treatmentDateTime: iso,
      treatmentName: DEFAULT_TREATMENT_NAME,
      treatmentOption: treatmentOption || null,
      treatmentStatus,
      treatmentDetail: treatmentDetail || null,
      referenceNotes: referenceNotes || null,
      remarks: remarks || null,
    };
    try {
      if (existing) {
        await fetch(`/api/appointments/${existing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...body,
            patientId,
          }),
        });
      } else {
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  const timeStr = formatTimeHm(slot);
  const filled = !!existing;

  return (
    <tr className={filled ? "bg-white" : "bg-slate-50/80"}>
      <td className="border border-slate-200 px-2 py-1.5 whitespace-nowrap text-xs">{dayLabel}</td>
      <td className="border border-slate-200 px-2 py-1.5 font-mono text-xs whitespace-nowrap">{timeStr}</td>
      <td className="border border-slate-200 px-1 py-1">
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="max-w-[220px] rounded border border-slate-300 px-1 py-1 text-xs"
        >
          <option value="">선택</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {patientLabel(p)}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-slate-200 px-2 py-1.5 text-xs">{DEFAULT_TREATMENT_NAME}</td>
      <td className="border border-slate-200 px-1 py-1">
        <select
          value={treatmentOption}
          onChange={(e) => setTreatmentOption(e.target.value)}
          className={`rounded border border-slate-300 px-1 py-1 text-xs font-medium ${optColor(treatmentOption || " ")}`}
        >
          <option value="">—</option>
          {TREATMENT_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </td>
      <td className="border border-slate-200 px-1 py-1">
        <select
          value={treatmentStatus}
          onChange={(e) => setTreatmentStatus(e.target.value)}
          className="rounded border border-slate-300 px-1 py-1 text-xs"
        >
          <option value={TREATMENT_STATUSES.SCHEDULED}>예약</option>
          <option value={TREATMENT_STATUSES.COMPLETED}>완료</option>
          <option value={TREATMENT_STATUSES.CANCELLED}>취소</option>
        </select>
        {treatmentStatus === TREATMENT_STATUSES.COMPLETED && (
          <span className="ml-1 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white">완료</span>
        )}
      </td>
      <td className="border border-slate-200 px-1 py-1">
        <textarea
          value={treatmentDetail}
          onChange={(e) => setTreatmentDetail(e.target.value)}
          rows={2}
          className="w-full min-w-[160px] rounded border border-slate-200 px-1 py-0.5 text-xs"
        />
      </td>
      <td className="border border-slate-200 px-1 py-1">
        <textarea
          value={referenceNotes}
          onChange={(e) => setReferenceNotes(e.target.value)}
          rows={2}
          className="w-full min-w-[160px] rounded border border-slate-200 px-1 py-0.5 text-xs"
        />
      </td>
      <td className="border border-slate-200 px-1 py-1">
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={2}
          className="w-full min-w-[100px] rounded border border-slate-200 px-1 py-0.5 text-xs"
        />
      </td>
      <td className="border border-slate-200 px-2 py-1 whitespace-nowrap">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="rounded bg-blue-800 px-2 py-1 text-xs text-white hover:bg-blue-900 disabled:opacity-50"
        >
          {saving ? "…" : "저장"}
        </button>
      </td>
    </tr>
  );
}
