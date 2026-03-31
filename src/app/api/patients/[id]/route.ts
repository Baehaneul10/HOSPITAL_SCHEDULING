import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/auth-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) return NextResponse.json({ error: "없음" }, { status: 404 });
  return NextResponse.json(patient);
}

export async function PATCH(req: Request, ctx: Ctx) {
  const r = await requireAdmin();
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  const body = await req.json() as Record<string, unknown>;

  const data: {
    chartNumber?: string;
    name?: string;
    visitType?: string;
    wardOrNote?: string | null;
    admissionDate?: Date | null;
    treatmentStartDate?: Date | null;
    dischargeDate?: Date | null;
    treatmentEndDate?: Date | null;
    treatmentInfo?: string | null;
    estimatedAmount?: number | null;
    notes?: string | null;
  } = {};

  if ("chartNumber" in body) data.chartNumber = String(body.chartNumber ?? "");
  if ("name" in body) data.name = String(body.name ?? "");
  if ("visitType" in body) data.visitType = String(body.visitType ?? "");
  if ("wardOrNote" in body) data.wardOrNote = body.wardOrNote != null ? String(body.wardOrNote) : null;
  if ("admissionDate" in body) data.admissionDate = body.admissionDate ? new Date(String(body.admissionDate)) : null;
  if ("treatmentStartDate" in body)
    data.treatmentStartDate = body.treatmentStartDate ? new Date(String(body.treatmentStartDate)) : null;
  if ("dischargeDate" in body) data.dischargeDate = body.dischargeDate ? new Date(String(body.dischargeDate)) : null;
  if ("treatmentEndDate" in body) data.treatmentEndDate = body.treatmentEndDate ? new Date(String(body.treatmentEndDate)) : null;
  if ("treatmentInfo" in body) data.treatmentInfo = body.treatmentInfo != null ? String(body.treatmentInfo) : null;
  if ("estimatedAmount" in body)
    data.estimatedAmount = body.estimatedAmount != null && body.estimatedAmount !== "" ? Number(body.estimatedAmount) : null;
  if ("notes" in body) data.notes = body.notes != null ? String(body.notes) : null;

  try {
    const patient = await prisma.patient.update({
      where: { id },
      data,
    });
    return NextResponse.json(patient);
  } catch {
    return NextResponse.json({ error: "수정 실패 (차트번호 중복 등)" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const r = await requireAdmin();
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  await prisma.patient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
