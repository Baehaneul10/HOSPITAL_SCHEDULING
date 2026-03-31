"use client";

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VISIT_TYPES } from "@/lib/constants";

type Row = {
  id: string;
  treatmentDateTime: string;
  treatmentName: string;
  treatmentOption: string | null;
  treatmentStatus: string;
  treatmentDetail: string | null;
  referenceNotes: string | null;
  remarks: string | null;
  patient: {
    name: string;
    chartNumber: string;
    visitType: string;
    wardOrNote: string | null;
  };
};

function wardLabel(p: Row["patient"]) {
  if (p.visitType === VISIT_TYPES.OUTPATIENT) return "외래 (외)";
  return p.wardOrNote ? `입원 (${p.wardOrNote})` : "입원";
}

function fmtDt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const columnHelper = createColumnHelper<Row>();

export function ScheduleSearchClient() {
  const [from, setFrom] = useState(() => new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(() => {
    const t = new Date();
    t.setMonth(t.getMonth() + 1);
    return t.toISOString().slice(0, 10);
  });
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("from", from);
    params.set("to", to);
    if (q.trim()) params.set("q", q.trim());
    const res = await fetch(`/api/appointments?${params}`);
    const data = await res.json();
    setRows(data.items ?? []);
    setLoading(false);
  }, [from, to, q]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      columnHelper.accessor((r) => fmtDt(r.treatmentDateTime), { id: "when", header: "치료일시" }),
      columnHelper.accessor((r) => r.patient.name, { id: "pname", header: "환자명" }),
      columnHelper.accessor((r) => wardLabel(r.patient), { id: "ward", header: "입원/외래" }),
      columnHelper.accessor("treatmentName", { header: "치료" }),
      columnHelper.accessor("treatmentOption", { header: "옵션" }),
      columnHelper.accessor("treatmentStatus", { header: "상태" }),
      columnHelper.accessor("treatmentDetail", { header: "치료정보" }),
      columnHelper.accessor("referenceNotes", { header: "참고" }),
      columnHelper.accessor("remarks", { header: "비고" }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">시작일</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">종료일</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border px-2 py-1.5 text-sm" />
        </div>
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">키워드</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·치료명·병동·옵션·상태…"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>
        <button type="button" onClick={() => load()} className="rounded bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900">
          검색
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-center text-slate-500">검색 중…</p>
        ) : (
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-200 bg-slate-100 text-xs text-slate-700">
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2 font-semibold whitespace-nowrap">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="max-w-[280px] truncate px-3 py-2 text-xs" title={String(cell.getValue() ?? "")}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && rows.length === 0 && <p className="p-6 text-center text-slate-500">결과가 없습니다.</p>}
      </div>
    </div>
  );
}
