import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";

export async function GET(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { name: { contains: q } },
          { chartNumber: { contains: q } },
          { wardOrNote: { contains: q } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { chartNumber: "asc" },
      skip,
      take: limit,
    }),
    prisma.patient.count({ where }),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: Request) {
  const r = await requireAdmin();
  if ("error" in r) return r.error;

  const body = await req.json();
  const {
    chartNumber,
    name,
    visitType,
    wardOrNote,
    admissionDate,
    treatmentStartDate,
    dischargeDate,
    treatmentEndDate,
    treatmentInfo,
    estimatedAmount,
    notes,
  } = body;

  if (!chartNumber || !name || !visitType) {
    return NextResponse.json({ error: "차트번호, 환자명, 입원/외래는 필수입니다." }, { status: 400 });
  }

  const patient = await prisma.patient.create({
    data: {
      chartNumber: String(chartNumber),
      name: String(name),
      visitType: String(visitType),
      wardOrNote: wardOrNote != null ? String(wardOrNote) : null,
      admissionDate: admissionDate ? new Date(admissionDate) : null,
      treatmentStartDate: treatmentStartDate ? new Date(treatmentStartDate) : null,
      dischargeDate: dischargeDate ? new Date(dischargeDate) : null,
      treatmentEndDate: treatmentEndDate ? new Date(treatmentEndDate) : null,
      treatmentInfo: treatmentInfo != null ? String(treatmentInfo) : null,
      estimatedAmount:
        estimatedAmount != null && estimatedAmount !== "" ? Number(estimatedAmount) : null,
      notes: notes != null ? String(notes) : null,
    },
  });

  return NextResponse.json(patient, { status: 201 });
}
