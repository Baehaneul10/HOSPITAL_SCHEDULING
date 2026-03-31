import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.appointment.deleteMany();

  const hash = (p: string) => bcrypt.hash(p, 10);

  await prisma.user.upsert({
    where: { email: "admin@hospital.local" },
    update: {},
    create: {
      email: "admin@hospital.local",
      passwordHash: await hash("admin1234"),
      name: "경영 관리자",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "therapist@hospital.local" },
    update: {},
    create: {
      email: "therapist@hospital.local",
      passwordHash: await hash("therapy1234"),
      name: "치료사",
      role: "THERAPIST",
    },
  });

  const p1 = await prisma.patient.upsert({
    where: { chartNumber: "C2024-001" },
    update: {},
    create: {
      chartNumber: "C2024-001",
      name: "강희원",
      visitType: "INPATIENT",
      wardOrNote: "1",
      admissionDate: new Date("2024-10-01"),
      treatmentStartDate: new Date("2024-10-02"),
      treatmentInfo: "싸이(주2)+압A(4단계)주3",
      estimatedAmount: 150000,
      notes: "참고",
    },
  });

  await prisma.patient.upsert({
    where: { chartNumber: "C2024-002" },
    update: {},
    create: {
      chartNumber: "C2024-002",
      name: "최동훈",
      visitType: "OUTPATIENT",
      wardOrNote: null,
      treatmentStartDate: new Date("2024-11-01"),
      treatmentInfo: "역박동 주2",
      estimatedAmount: 80000,
    },
  });

  const slot1 = new Date();
  slot1.setHours(8, 40, 0, 0);
  const slot2 = new Date(slot1);
  slot2.setMinutes(slot2.getMinutes() + 40);

  await prisma.appointment.createMany({
    data: [
      {
        patientId: p1.id,
        treatmentDateTime: slot1,
        treatmentName: "역박동",
        treatmentOption: "K",
        treatmentStatus: "COMPLETED",
        treatmentDetail: "싸이(주2)+압A(4단계)주3",
        referenceNotes: "Abnoba 3단계 10회 보유",
      },
      {
        patientId: p1.id,
        treatmentDateTime: slot2,
        treatmentName: "역박동",
        treatmentOption: "J",
        treatmentStatus: "SCHEDULED",
        treatmentDetail: "",
        referenceNotes: "",
      },
    ],
  });

  console.log("Seed 완료: admin@hospital.local / admin1234, therapist@hospital.local / therapy1234");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
