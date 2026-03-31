export type UserMe = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  approved: boolean;
};

export type PatientRow = {
  id: string;
  chartNumber: string;
  name: string;
  visitType: string;
  wardOrNote: string | null;
  admissionDate: string | null;
  treatmentStartDate: string | null;
  dischargeDate: string | null;
  treatmentEndDate: string | null;
  treatmentInfo: string | null;
  estimatedAmount: number | null;
  notes: string | null;
};

export type PatientBrief = {
  id: string;
  chartNumber: string;
  name: string;
  visitType: string;
  wardOrNote: string | null;
  /** 환자명부 치료정보(스케줄에서 선택 시 표시·반영) */
  treatmentInfo?: string | null;
};

export type AppointmentRow = {
  id: string;
  patientId: string;
  treatmentDateTime: string;
  treatmentName: string;
  treatmentOption: string | null;
  treatmentStatus: string;
  treatmentDetail: string | null;
  referenceNotes: string | null;
  remarks: string | null;
  patient: PatientBrief;
};
