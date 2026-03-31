"use client";

import { useSession } from "next-auth/react";
import { ROLES, VISIT_TYPES } from "@/lib/constants";
import { useCallback, useEffect, useState } from "react";

type Patient = {
  id: string;
  chartNumber: string;
  name: string;
  visitType: string;
  wardOrNote: string | null;
  admissionDate: string | null;
  treatmentStartDate: string | null;
  dischargeDate: string | null;
  treatmentEndDate: string | null;
  treatmentInfo: string | null;
  estimatedAmount: number | null;
  notes: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR");
}

export function PatientsClient() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === ROLES.ADMIN;

  const [items, setItems] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Patient | null>(null);
  const [form, setForm] = useState<{
    chartNumber: string;
    name: string;
    visitType: string;
    wardOrNote: string;
    admissionDate: string;
    treatmentStartDate: string;
    dischargeDate: string;
    treatmentEndDate: string;
    treatmentInfo: string;
    estimatedAmount: string;
    notes: string;
  }>({
    chartNumber: "",
    name: "",
    visitType: VISIT_TYPES.INPATIENT,
    wardOrNote: "",
    admissionDate: "",
    treatmentStartDate: "",
    dischargeDate: "",
    treatmentEndDate: "",
    treatmentInfo: "",
    estimatedAmount: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/patients?${params.toString()}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  function resetForm() {
    setForm({
      chartNumber: "",
      name: "",
      visitType: VISIT_TYPES.INPATIENT,
      wardOrNote: "",
      admissionDate: "",
      treatmentStartDate: "",
      dischargeDate: "",
      treatmentEndDate: "",
      treatmentInfo: "",
      estimatedAmount: "",
      notes: "",
    });
    setEditing(null);
  }

  function startEdit(p: Patient) {
    setEditing(p);
    setForm({
      chartNumber: p.chartNumber,
      name: p.name,
      visitType: p.visitType,
      wardOrNote: p.wardOrNote ?? "",
      admissionDate: p.admissionDate ? p.admissionDate.slice(0, 10) : "",
      treatmentStartDate: p.treatmentStartDate ? p.treatmentStartDate.slice(0, 10) : "",
      dischargeDate: p.dischargeDate ? p.dischargeDate.slice(0, 10) : "",
      treatmentEndDate: p.treatmentEndDate ? p.treatmentEndDate.slice(0, 10) : "",
      treatmentInfo: p.treatmentInfo ?? "",
      estimatedAmount: p.estimatedAmount != null ? String(p.estimatedAmount) : "",
      notes: p.notes ?? "",
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    const payload = {
      chartNumber: form.chartNumber,
      name: form.name,
      visitType: form.visitType,
      wardOrNote: form.wardOrNote || null,
      admissionDate: form.admissionDate || null,
      treatmentStartDate: form.treatmentStartDate || null,
      dischargeDate: form.dischargeDate || null,
      treatmentEndDate: form.treatmentEndDate || null,
      treatmentInfo: form.treatmentInfo || null,
      estimatedAmount: form.estimatedAmount === "" ? null : Number(form.estimatedAmount),
      notes: form.notes || null,
    };
    if (editing) {
      await fetch(`/api/patients/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }
    resetForm();
    load();
  }

  async function remove(id: string) {
    if (!isAdmin) return;
    if (!confirm("삭제할까요?")) return;
    await fetch(`/api/patients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">검색</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="차트번호·이름"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button type="button" onClick={() => load()} className="rounded bg-slate-200 px-3 py-2 text-sm hover:bg-slate-300">
          새로고침
        </button>
      </div>

      {isAdmin && (
        <form onSubmit={save} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">{editing ? "환자 수정" : "환자 등록"}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="차트번호 *">
              <input
                required
                value={form.chartNumber}
                onChange={(e) => setForm((f) => ({ ...f, chartNumber: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
                disabled={!!editing}
              />
            </Field>
            <Field label="환자명 *">
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="입원/외래 *">
              <select
                value={form.visitType}
                onChange={(e) => setForm((f) => ({ ...f, visitType: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              >
                <option value={VISIT_TYPES.INPATIENT}>입원</option>
                <option value={VISIT_TYPES.OUTPATIENT}>외래</option>
              </select>
            </Field>
            <Field label="병동·표기">
              <input
                value={form.wardOrNote}
                onChange={(e) => setForm((f) => ({ ...f, wardOrNote: e.target.value }))}
                placeholder="예: 1 · 외래는 비워두면 (외) 표시"
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="입원일">
              <input
                type="date"
                value={form.admissionDate}
                onChange={(e) => setForm((f) => ({ ...f, admissionDate: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="치료시작일">
              <input
                type="date"
                value={form.treatmentStartDate}
                onChange={(e) => setForm((f) => ({ ...f, treatmentStartDate: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="퇴원일">
              <input
                type="date"
                value={form.dischargeDate}
                onChange={(e) => setForm((f) => ({ ...f, dischargeDate: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="치료종료일">
              <input
                type="date"
                value={form.treatmentEndDate}
                onChange={(e) => setForm((f) => ({ ...f, treatmentEndDate: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="예상금액">
              <input
                type="number"
                value={form.estimatedAmount}
                onChange={(e) => setForm((f) => ({ ...f, estimatedAmount: e.target.value }))}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="치료정보" className="sm:col-span-2 lg:col-span-3">
              <textarea
                value={form.treatmentInfo}
                onChange={(e) => setForm((f) => ({ ...f, treatmentInfo: e.target.value }))}
                rows={2}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
            <Field label="참고사항" className="sm:col-span-2 lg:col-span-3">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
                className="w-full rounded border px-2 py-1.5 text-sm"
              />
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="rounded bg-blue-700 px-4 py-2 text-sm text-white hover:bg-blue-800">
              {editing ? "저장" : "등록"}
            </button>
            {(editing || form.chartNumber) && (
              <button type="button" onClick={resetForm} className="rounded border border-slate-300 px-4 py-2 text-sm">
                취소
              </button>
            )}
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">불러오는 중…</p>
        ) : (
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2">차트</th>
                <th className="px-3 py-2">환자명</th>
                <th className="px-3 py-2">입원/외래(병동)</th>
                <th className="px-3 py-2">입원·치료시작</th>
                <th className="px-3 py-2">퇴원·치료종료</th>
                <th className="px-3 py-2">치료정보</th>
                <th className="px-3 py-2">예상금액</th>
                <th className="px-3 py-2">참고</th>
                {isAdmin && <th className="px-3 py-2">작업</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-mono text-xs">{p.chartNumber}</td>
                  <td className="px-3 py-2">{p.name}</td>
                  <td className="px-3 py-2">
                    {p.visitType === VISIT_TYPES.OUTPATIENT ? "외래" : "입원"}
                    {p.wardOrNote ? ` (${p.wardOrNote})` : p.visitType === VISIT_TYPES.OUTPATIENT ? " (외)" : ""}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {fmtDate(p.admissionDate)} / {fmtDate(p.treatmentStartDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {fmtDate(p.dischargeDate)} / {fmtDate(p.treatmentEndDate)}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2 text-xs" title={p.treatmentInfo ?? ""}>
                    {p.treatmentInfo}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {p.estimatedAmount != null ? p.estimatedAmount.toLocaleString("ko-KR") : ""}
                  </td>
                  <td className="max-w-[200px] truncate px-3 py-2 text-xs" title={p.notes ?? ""}>
                    {p.notes}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <button type="button" className="text-blue-700 hover:underline" onClick={() => startEdit(p)}>
                        수정
                      </button>
                      <button type="button" className="ml-2 text-red-600 hover:underline" onClick={() => remove(p.id)}>
                        삭제
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-0.5 block text-xs text-slate-600">{label}</label>
      {children}
    </div>
  );
}
