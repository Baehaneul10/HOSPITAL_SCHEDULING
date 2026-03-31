import "../src/env.js";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function ymd(y: number, m: number, d: number) {
  return new Date(y, m - 1, d);
}

function slotAt(y: number, mo: number, day: number, hour: number, minute: number) {
  return new Date(y, mo - 1, day, hour, minute, 0, 0);
}

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  await prisma.user.upsert({
    where: { email: "admin@hospital.local" },
    update: { approved: true },
    create: {
      email: "admin@hospital.local",
      passwordHash: await hash("admin1234"),
      name: "경영 관리자",
      role: "ADMIN",
      approved: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "therapist@hospital.local" },
    update: { approved: true },
    create: {
      email: "therapist@hospital.local",
      passwordHash: await hash("therapy1234"),
      name: "치료사",
      role: "ADMIN",
      approved: true,
    },
  });

  const demoPatients = [
    {
      chartNumber: "P-001",
      name: "강희원",
      visitType: "INPATIENT",
      wardOrNote: "1",
      admissionDate: ymd(2024, 11, 4),
      treatmentStartDate: ymd(2024, 11, 5),
      treatmentInfo: "B2(월8)+싸이1(월4)+압2+pj2(역&파)",
      estimatedAmount: 108,
      notes: "예시 환자",
    },
    {
      chartNumber: "P-002",
      name: "김경희",
      visitType: "INPATIENT",
      wardOrNote: "3",
      admissionDate: ymd(2024, 11, 1),
      treatmentStartDate: ymd(2024, 11, 2),
      treatmentInfo: "싸이(주2)+압A(4단계)주3+메시마90포+PJ(주2)",
      estimatedAmount: 110,
      notes: "압노바 단계 소진 안내",
    },
    {
      chartNumber: "P-003",
      name: "박은미",
      visitType: "INPATIENT",
      wardOrNote: "1",
      admissionDate: ymd(2024, 11, 3),
      treatmentStartDate: ymd(2024, 11, 4),
      treatmentInfo: "역박동 주1",
      estimatedAmount: 95,
      notes: null,
    },
    {
      chartNumber: "P-004",
      name: "조기종",
      visitType: "INPATIENT",
      wardOrNote: "5",
      admissionDate: ymd(2024, 10, 20),
      treatmentStartDate: ymd(2024, 10, 22),
      treatmentInfo: "고주파+싸이 병행",
      estimatedAmount: 120,
      notes: null,
    },
    {
      chartNumber: "P-005",
      name: "최동훈",
      visitType: "OUTPATIENT",
      wardOrNote: null,
      admissionDate: null,
      treatmentStartDate: ymd(2025, 4, 1),
      treatmentInfo: "B2+싸이1+압2+pj2(도2)*역 주1",
      estimatedAmount: 127,
      notes: "외래",
    },
    {
      chartNumber: "P-006",
      name: "한종수",
      visitType: "OUTPATIENT",
      wardOrNote: null,
      admissionDate: null,
      treatmentStartDate: ymd(2024, 11, 1),
      treatmentInfo: "역박동 체험 후 정기",
      estimatedAmount: 88,
      notes: null,
    },
    {
      chartNumber: "P-007",
      name: "이기정",
      visitType: "INPATIENT",
      wardOrNote: "5",
      admissionDate: ymd(2024, 10, 15),
      treatmentStartDate: ymd(2024, 10, 16),
      treatmentInfo: "역박동 J 옵션",
      estimatedAmount: 102,
      notes: null,
    },
    {
      chartNumber: "P-008",
      name: "홍영숙",
      visitType: "INPATIENT",
      wardOrNote: "5",
      admissionDate: ymd(2024, 10, 1),
      treatmentStartDate: ymd(2024, 10, 5),
      treatmentInfo: "S 옵션 완료 이력",
      estimatedAmount: 99,
      notes: null,
    },
    {
      chartNumber: "P-009",
      name: "윤횡중",
      visitType: "INPATIENT",
      wardOrNote: "1",
      admissionDate: ymd(2024, 5, 28),
      treatmentStartDate: ymd(2024, 6, 1),
      treatmentInfo: "고3+압1+pj1",
      estimatedAmount: 102,
      notes: null,
    },
    {
      chartNumber: "P-010",
      name: "신금희",
      visitType: "INPATIENT",
      wardOrNote: "3",
      admissionDate: ymd(2023, 6, 6),
      treatmentStartDate: ymd(2023, 6, 10),
      treatmentInfo: "B월2+싸이1(월4)+압2+pj1(도)",
      estimatedAmount: 152,
      notes: "면책 기간 확인",
    },
  ];

  const created: { id: string; chartNumber: string }[] = [];
  for (const p of demoPatients) {
    const row = await prisma.patient.create({ data: p });
    created.push({ id: row.id, chartNumber: row.chartNumber });
  }

  const byChart = (c: string) => created.find((x) => x.chartNumber === c)!.id;
  const now = new Date();
  const Y = now.getFullYear();
  const M = now.getMonth() + 1;

  const lastDay = new Date(Y, M, 0).getDate();
  const d = (n: number) => Math.min(n, lastDay);

  await prisma.appointment.createMany({
    data: [
      {
        patientId: byChart("P-001"),
        treatmentDateTime: slotAt(Y, M, d(3), 8, 40),
        treatmentName: "역박동",
        treatmentOption: "K",
        treatmentStatus: "COMPLETED",
      },
      {
        patientId: byChart("P-002"),
        treatmentDateTime: slotAt(Y, M, d(5), 10, 0),
        treatmentName: "역박동",
        treatmentOption: "J",
        treatmentStatus: "COMPLETED",
      },
      {
        patientId: byChart("P-003"),
        treatmentDateTime: slotAt(Y, M, d(7), 11, 20),
        treatmentName: "역박동",
        treatmentOption: "K",
        treatmentStatus: "SCHEDULED",
      },
      {
        patientId: byChart("P-005"),
        treatmentDateTime: slotAt(Y, M, d(10), 15, 0),
        treatmentName: "역박동",
        treatmentOption: "S",
        treatmentStatus: "COMPLETED",
      },
      {
        patientId: byChart("P-007"),
        treatmentDateTime: slotAt(Y, M, d(12), 9, 20),
        treatmentName: "도수",
        treatmentOption: null,
        treatmentStatus: "SCHEDULED",
      },
      {
        patientId: byChart("P-010"),
        treatmentDateTime: slotAt(Y, M, d(18), 14, 20),
        treatmentName: "역박동",
        treatmentOption: "J",
        treatmentStatus: "COMPLETED",
      },
    ],
  });

  console.log("Seed 완료: 환자 10명(P-001~P-010), 예약 샘플, 사용자 admin@hospital.local / admin1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
