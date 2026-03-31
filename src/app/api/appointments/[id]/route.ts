import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  const body = await req.json();

  const data: Prisma.AppointmentUpdateInput = {};
  if ("treatmentDateTime" in body && body.treatmentDateTime)
    data.treatmentDateTime = new Date(body.treatmentDateTime);
  if ("treatmentName" in body) data.treatmentName = body.treatmentName != null ? String(body.treatmentName) : undefined;
  if ("treatmentOption" in body)
    data.treatmentOption = body.treatmentOption != null && body.treatmentOption !== "" ? String(body.treatmentOption) : null;
  if ("treatmentStatus" in body && body.treatmentStatus != null)
    data.treatmentStatus = String(body.treatmentStatus);
  if ("treatmentDetail" in body) data.treatmentDetail = body.treatmentDetail != null ? String(body.treatmentDetail) : null;
  if ("referenceNotes" in body) data.referenceNotes = body.referenceNotes != null ? String(body.referenceNotes) : null;
  if ("remarks" in body) data.remarks = body.remarks != null ? String(body.remarks) : null;
  if ("patientId" in body && body.patientId) data.patient = { connect: { id: String(body.patientId) } };

  const appt = await prisma.appointment.update({
    where: { id },
    data,
    include: { patient: true },
  });

  return NextResponse.json(appt);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const r = await requireUser();
  if ("error" in r) return r.error;
  const { id } = await ctx.params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
