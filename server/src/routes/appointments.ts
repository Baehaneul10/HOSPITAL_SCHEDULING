import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireUser } from "../middleware/requireAuth.js";

export const appointmentsRouter = Router();

appointmentsRouter.get("/", requireUser, async (req: AuthedRequest, res) => {
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const q = String(req.query.q ?? "").trim();
  const treatmentName = req.query.treatmentName ? String(req.query.treatmentName).trim() : undefined;

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

  res.json({ items });
});

appointmentsRouter.post("/", requireUser, async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const patientId = body.patientId != null ? String(body.patientId) : "";
  const treatmentDateTime = body.treatmentDateTime != null ? String(body.treatmentDateTime) : "";
  if (!patientId || !treatmentDateTime) {
    res.status(400).json({ error: "환자와 치료일시는 필수입니다." });
    return;
  }

  const appt = await prisma.appointment.create({
    data: {
      patientId,
      treatmentDateTime: new Date(treatmentDateTime),
      treatmentName: body.treatmentName != null ? String(body.treatmentName) : "역박동",
      treatmentOption: body.treatmentOption != null && body.treatmentOption !== "" ? String(body.treatmentOption) : null,
      treatmentStatus: body.treatmentStatus != null ? String(body.treatmentStatus) : "SCHEDULED",
      treatmentDetail: body.treatmentDetail != null ? String(body.treatmentDetail) : null,
      referenceNotes: body.referenceNotes != null ? String(body.referenceNotes) : null,
      remarks: body.remarks != null ? String(body.remarks) : null,
    },
    include: { patient: true },
  });

  res.status(201).json(appt);
});

appointmentsRouter.patch("/:id", requireUser, async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const data: Prisma.AppointmentUpdateInput = {};
  if ("treatmentDateTime" in body && body.treatmentDateTime)
    data.treatmentDateTime = new Date(String(body.treatmentDateTime));
  if ("treatmentName" in body) data.treatmentName = body.treatmentName != null ? String(body.treatmentName) : undefined;
  if ("treatmentOption" in body)
    data.treatmentOption =
      body.treatmentOption != null && body.treatmentOption !== "" ? String(body.treatmentOption) : null;
  if ("treatmentStatus" in body && body.treatmentStatus != null)
    data.treatmentStatus = String(body.treatmentStatus);
  if ("treatmentDetail" in body) data.treatmentDetail = body.treatmentDetail != null ? String(body.treatmentDetail) : null;
  if ("referenceNotes" in body) data.referenceNotes = body.referenceNotes != null ? String(body.referenceNotes) : null;
  if ("remarks" in body) data.remarks = body.remarks != null ? String(body.remarks) : null;
  if ("patientId" in body && body.patientId) data.patient = { connect: { id: String(body.patientId) } };

  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const appt = await prisma.appointment.update({
    where: { id },
    data,
    include: { patient: true },
  });

  res.json(appt);
});

appointmentsRouter.delete("/:id", requireUser, async (req: AuthedRequest, res) => {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await prisma.appointment.delete({ where: { id } });
  res.json({ ok: true });
});
