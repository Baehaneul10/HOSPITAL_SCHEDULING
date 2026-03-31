import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/requireAuth.js";
import { requireUser } from "../middleware/requireAuth.js";

export const patientsRouter = Router();

patientsRouter.get("/", requireUser, async (req: AuthedRequest, res) => {
  const q = String(req.query.q ?? "").trim();
  const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10));
  const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? "50"), 10)));
  const skip = (page - 1) * limit;

  const where: Prisma.PatientWhereInput = q
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

  res.json({ items, total, page, limit });
});

patientsRouter.post("/", requireUser, async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const chartNumber = body.chartNumber != null ? String(body.chartNumber) : "";
  const name = body.name != null ? String(body.name) : "";
  const visitType = body.visitType != null ? String(body.visitType) : "";
  if (!chartNumber || !name || !visitType) {
    res.status(400).json({ error: "차트번호, 환자명, 입원/외래는 필수입니다." });
    return;
  }
  const patient = await prisma.patient.create({
    data: {
      chartNumber,
      name,
      visitType,
      wardOrNote: body.wardOrNote != null ? String(body.wardOrNote) : null,
      admissionDate: body.admissionDate ? new Date(String(body.admissionDate)) : null,
      treatmentStartDate: body.treatmentStartDate ? new Date(String(body.treatmentStartDate)) : null,
      dischargeDate: body.dischargeDate ? new Date(String(body.dischargeDate)) : null,
      treatmentEndDate: body.treatmentEndDate ? new Date(String(body.treatmentEndDate)) : null,
      treatmentInfo: body.treatmentInfo != null ? String(body.treatmentInfo) : null,
      estimatedAmount:
        body.estimatedAmount != null && body.estimatedAmount !== "" ? Number(body.estimatedAmount) : null,
      notes: body.notes != null ? String(body.notes) : null,
    },
  });
  res.status(201).json(patient);
});

patientsRouter.get("/:id", requireUser, async (req: AuthedRequest, res) => {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  const patient = await prisma.patient.findUnique({ where: { id } });
  if (!patient) {
    res.status(404).json({ error: "없음" });
    return;
  }
  res.json(patient);
});

patientsRouter.patch("/:id", requireUser, async (req: AuthedRequest, res) => {
  const body = req.body as Record<string, unknown>;
  const data: Prisma.PatientUpdateInput = {};
  if ("chartNumber" in body) data.chartNumber = String(body.chartNumber ?? "");
  if ("name" in body) data.name = String(body.name ?? "");
  if ("visitType" in body) data.visitType = String(body.visitType ?? "");
  if ("wardOrNote" in body) data.wardOrNote = body.wardOrNote != null ? String(body.wardOrNote) : null;
  if ("admissionDate" in body) data.admissionDate = body.admissionDate ? new Date(String(body.admissionDate)) : null;
  if ("treatmentStartDate" in body)
    data.treatmentStartDate = body.treatmentStartDate ? new Date(String(body.treatmentStartDate)) : null;
  if ("dischargeDate" in body) data.dischargeDate = body.dischargeDate ? new Date(String(body.dischargeDate)) : null;
  if ("treatmentEndDate" in body)
    data.treatmentEndDate = body.treatmentEndDate ? new Date(String(body.treatmentEndDate)) : null;
  if ("treatmentInfo" in body) data.treatmentInfo = body.treatmentInfo != null ? String(body.treatmentInfo) : null;
  if ("estimatedAmount" in body)
    data.estimatedAmount =
      body.estimatedAmount != null && body.estimatedAmount !== "" ? Number(body.estimatedAmount) : null;
  if ("notes" in body) data.notes = body.notes != null ? String(body.notes) : null;

  const pid = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  try {
    const patient = await prisma.patient.update({
      where: { id: pid },
      data,
    });
    res.json(patient);
  } catch {
    res.status(400).json({ error: "수정 실패 (차트번호 중복 등)" });
  }
});

patientsRouter.delete("/:id", requireUser, async (req: AuthedRequest, res) => {
  const id = String(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
  await prisma.patient.delete({ where: { id } });
  res.json({ ok: true });
});
