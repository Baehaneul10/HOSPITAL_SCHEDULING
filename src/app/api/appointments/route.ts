import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth-helpers";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const q = searchParams.get("q")?.trim() ?? "";
  const treatmentName = searchParams.get("treatmentName")?.trim();

  const conditions: Prisma.AppointmentWhereInput[] = [];

  if (from || to) {
    const dt: Prisma.DateTimeFilter = {};
    if (from) dt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dt.lte = end;
    }
    conditions.push({ treatmentDateTime: dt });
  }

  if (treatmentName) {
    conditions.push({ treatmentName: { contains: treatmentName } });
  }

  if (q) {
    conditions.push({
      OR: [
        { treatmentName: { contains: q } },
        { treatmentDetail: { contains: q } },
        { referenceNotes: { contains: q } },
        { remarks: { contains: q } },
        { treatmentOption: { contains: q } },
        { treatmentStatus: { contains: q } },
        { patient: { name: { contains: q } } },
        { patient: { chartNumber: { contains: q } } },
        { patient: { wardOrNote: { contains: q } } },
      ],
    });
  }

  const where: Prisma.AppointmentWhereInput = conditions.length ? { AND: conditions } : {};

  const items = await prisma.appointment.findMany({
    where,
    include: { patient: true },
    orderBy: { treatmentDateTime: "asc" },
  });

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const r = await requireUser();
  if ("error" in r) return r.error;

  const body = await req.json();
  const {
    patientId,
    treatmentDateTime,
    treatmentName,
    treatmentOption,
    treatmentStatus,
    treatmentDetail,
    referenceNotes,
    remarks,
  } = body;

  if (!patientId || !treatmentDateTime) {
    return NextResponse.json({ error: "환자와 치료일시는 필수입니다." }, { status: 400 });
  }

  const appt = await prisma.appointment.create({
    data: {
      patientId: String(patientId),
      treatmentDateTime: new Date(treatmentDateTime),
      treatmentName: treatmentName != null ? String(treatmentName) : "역박동",
      treatmentOption: treatmentOption != null && treatmentOption !== "" ? String(treatmentOption) : null,
      treatmentStatus: treatmentStatus != null ? String(treatmentStatus) : "SCHEDULED",
      treatmentDetail: treatmentDetail != null ? String(treatmentDetail) : null,
      referenceNotes: referenceNotes != null ? String(referenceNotes) : null,
      remarks: remarks != null ? String(remarks) : null,
    },
    include: { patient: true },
  });

  return NextResponse.json(appt, { status: 201 });
}
