-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'THERAPIST',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chartNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "visitType" TEXT NOT NULL DEFAULT 'INPATIENT',
    "wardOrNote" TEXT,
    "admissionDate" DATETIME,
    "treatmentStartDate" DATETIME,
    "dischargeDate" DATETIME,
    "treatmentEndDate" DATETIME,
    "treatmentInfo" TEXT,
    "estimatedAmount" REAL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT NOT NULL,
    "treatmentDateTime" DATETIME NOT NULL,
    "treatmentName" TEXT NOT NULL DEFAULT '역박동',
    "treatmentOption" TEXT,
    "treatmentStatus" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "treatmentDetail" TEXT,
    "referenceNotes" TEXT,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_chartNumber_key" ON "Patient"("chartNumber");

-- CreateIndex
CREATE INDEX "Appointment_treatmentDateTime_idx" ON "Appointment"("treatmentDateTime");
