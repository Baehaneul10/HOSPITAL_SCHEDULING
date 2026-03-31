<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import {
  TREATMENT_NAMES,
  TREATMENT_OPTIONS,
  TREATMENT_STATUSES,
  VISIT_TYPES,
} from "@/lib/constants";
import { formatTimeHm } from "@/lib/slots";
import { apiFetch } from "@/lib/api";
import type { AppointmentRow, PatientBrief } from "@/types/models";

const props = defineProps<{
  slot: Date;
  dayLabel: string;
  patients: PatientBrief[];
  existing?: AppointmentRow;
  token: string;
}>();

const emit = defineEmits<{
  saved: [];
}>();

function initialTreatmentName(ex?: AppointmentRow): string {
  const n = ex?.treatmentName;
  if (n && (TREATMENT_NAMES as readonly string[]).includes(n)) return n;
  if (n) return n;
  return TREATMENT_NAMES[0];
}

const patientId = ref(props.existing?.patientId ?? "");
const treatmentName = ref(initialTreatmentName(props.existing));
const treatmentOption = ref(props.existing?.treatmentOption ?? "");
const treatmentStatus = ref(props.existing?.treatmentStatus ?? TREATMENT_STATUSES.SCHEDULED);
const treatmentDetail = ref(props.existing?.treatmentDetail ?? "");
const referenceNotes = ref(props.existing?.referenceNotes ?? "");
const remarks = ref(props.existing?.remarks ?? "");

const syncingFromProps = ref(false);
const fallbackApptId = ref<string | null>(null);
const saving = ref(false);

const nameOptions = computed(() => {
  const n = treatmentName.value;
  const base = [...TREATMENT_NAMES];
  if (n && !(TREATMENT_NAMES as readonly string[]).includes(n)) {
    return [n, ...base];
  }
  return base;
});

const selectedPatient = computed(() => props.patients.find((p) => p.id === patientId.value));

watch(
  () => props.existing?.id,
  (id) => {
    if (id) fallbackApptId.value = null;
  }
);

watch(
  () => props.existing,
  async (ex) => {
    syncingFromProps.value = true;
    fallbackApptId.value = null;
    patientId.value = ex?.patientId ?? "";
    treatmentName.value = initialTreatmentName(ex);
    treatmentOption.value = ex?.treatmentOption ?? "";
    treatmentStatus.value = ex?.treatmentStatus ?? TREATMENT_STATUSES.SCHEDULED;
    treatmentDetail.value = ex?.treatmentDetail ?? "";
    referenceNotes.value = ex?.referenceNotes ?? "";
    remarks.value = ex?.remarks ?? "";
    await nextTick();
    syncingFromProps.value = false;
  },
  { deep: true, immediate: true }
);

watch(patientId, (id) => {
  if (syncingFromProps.value) return;
  const p = props.patients.find((x) => x.id === id);
  if (id && p?.treatmentInfo != null && String(p.treatmentInfo).trim() !== "") {
    treatmentDetail.value = p.treatmentInfo ?? "";
  }
});

async function save() {
  if (syncingFromProps.value) return;

  if (!patientId.value) {
    const delId = props.existing?.id ?? fallbackApptId.value;
    if (!delId) {
      alert("삭제할 예약이 없습니다. 환자를 선택한 뒤 저장하면 등록됩니다.");
      return;
    }
    if (!confirm("이 슬롯의 예약을 삭제할까요?")) return;
    saving.value = true;
    try {
      await apiFetch(`/api/appointments/${delId}`, { method: "DELETE", token: props.token });
      fallbackApptId.value = null;
      syncingFromProps.value = true;
      patientId.value = "";
      treatmentName.value = TREATMENT_NAMES[0];
      treatmentOption.value = "";
      treatmentStatus.value = TREATMENT_STATUSES.SCHEDULED;
      treatmentDetail.value = "";
      referenceNotes.value = "";
      remarks.value = "";
      await nextTick();
      syncingFromProps.value = false;
      emit("saved");
    } finally {
      saving.value = false;
    }
    return;
  }

  saving.value = true;
  try {
    const body = {
      patientId: patientId.value,
      treatmentDateTime: props.slot.toISOString(),
      treatmentName: treatmentName.value,
      treatmentOption: treatmentOption.value || null,
      treatmentStatus: treatmentStatus.value,
      treatmentDetail: treatmentDetail.value || null,
      referenceNotes: referenceNotes.value || null,
      remarks: remarks.value || null,
    };

    const id = props.existing?.id ?? fallbackApptId.value ?? null;
    if (id) {
      await apiFetch(`/api/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...body, patientId: patientId.value }),
        token: props.token,
      });
    } else {
      const created = await apiFetch<AppointmentRow>("/api/appointments", {
        method: "POST",
        body: JSON.stringify(body),
        token: props.token,
      });
      fallbackApptId.value = created.id;
    }
    emit("saved");
  } finally {
    saving.value = false;
  }
}

function patientLabel(p: PatientBrief) {
  const ward =
    p.visitType === VISIT_TYPES.OUTPATIENT ? "(외)" : p.wardOrNote ? `(${p.wardOrNote})` : "";
  return `${p.name}${ward}`;
}

function optClass(code: string) {
  if (code === "K") return "opt-k";
  if (code === "J") return "opt-j";
  if (code === "S") return "opt-s";
  if (code === "무료") return "opt-free";
  return "opt-empty";
}

const timeStr = formatTimeHm(props.slot);
const filled = computed(() => !!props.existing || !!fallbackApptId.value || !!patientId.value);
</script>

<template>
  <tr :class="filled ? 'row-filled' : 'row-empty'">
    <td class="cell nowrap small">{{ dayLabel }}</td>
    <td class="cell nowrap mono small">{{ timeStr }}</td>
    <td class="cell patient-cell">
      <select v-model="patientId" class="select narrow">
        <option value="">선택</option>
        <option v-for="p in patients" :key="p.id" :value="p.id">{{ patientLabel(p) }}</option>
      </select>
      <div v-if="selectedPatient?.treatmentInfo" class="registry-info" :title="selectedPatient.treatmentInfo">
        명부: {{ selectedPatient.treatmentInfo }}
      </div>
    </td>
    <td class="cell">
      <select v-model="treatmentName" class="select narrow">
        <option v-for="n in nameOptions" :key="n" :value="n">{{ n }}</option>
      </select>
    </td>
    <td class="cell">
      <select v-model="treatmentOption" :class="['select', 'opt', optClass(treatmentOption || ' ')]">
        <option value="">—</option>
        <option v-for="o in TREATMENT_OPTIONS" :key="o" :value="o">{{ o }}</option>
      </select>
    </td>
    <td class="cell">
      <select v-model="treatmentStatus" class="select">
        <option :value="TREATMENT_STATUSES.SCHEDULED">예약</option>
        <option :value="TREATMENT_STATUSES.COMPLETED">완료</option>
        <option :value="TREATMENT_STATUSES.CANCELLED">취소</option>
      </select>
      <span v-if="treatmentStatus === TREATMENT_STATUSES.COMPLETED" class="badge-done">완료</span>
    </td>
    <td class="cell">
      <textarea v-model="treatmentDetail" rows="2" class="textarea" />
    </td>
    <td class="cell">
      <textarea v-model="referenceNotes" rows="2" class="textarea" />
    </td>
    <td class="cell">
      <textarea v-model="remarks" rows="2" class="textarea narrow" />
    </td>
    <td class="cell nowrap">
      <button type="button" class="btn-save" :disabled="saving" @click="save">{{ saving ? "…" : "저장" }}</button>
    </td>
  </tr>
</template>

<style scoped>
.row-filled {
  background: #fff;
}
.row-empty {
  background: #f8fafc;
}
.cell {
  border: 1px solid #e2e8f0;
  padding: 0.35rem 0.5rem;
  vertical-align: top;
}
.patient-cell {
  max-width: 280px;
}
.registry-info {
  margin-top: 0.35rem;
  font-size: 0.65rem;
  line-height: 1.35;
  color: #475569;
  max-height: 3.6em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.nowrap {
  white-space: nowrap;
}
.small {
  font-size: 0.75rem;
}
.mono {
  font-family: ui-monospace, monospace;
}
.select {
  max-width: 220px;
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0.25rem;
  font-size: 0.75rem;
}
.select.narrow {
  max-width: 220px;
}
.opt {
  font-weight: 600;
}
.opt-k {
  background: #ffe4e6;
  color: #881337;
}
.opt-j {
  background: #fef3c7;
  color: #92400e;
}
.opt-s {
  background: #ffedd5;
  color: #9a3412;
}
.opt-free {
  background: #e0e7ff;
  color: #3730a3;
}
.opt-empty {
  background: #f1f5f9;
}
.textarea {
  width: 100%;
  min-width: 160px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 0.25rem;
  font-size: 0.75rem;
  resize: vertical;
}
.textarea.narrow {
  min-width: 100px;
}
.badge-done {
  margin-left: 0.25rem;
  background: #2563eb;
  color: #fff;
  font-size: 0.65rem;
  padding: 0.1rem 0.35rem;
  border-radius: 3px;
  vertical-align: middle;
}
.btn-save {
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  cursor: pointer;
}
.btn-save:disabled {
  opacity: 0.5;
}
.btn-save:hover:not(:disabled) {
  background: #1e3a8a;
}
</style>
