<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { TREATMENT_NAMES, TREATMENT_OPTIONS, VISIT_TYPES } from "@/lib/constants";
import { toLocalYmd, formatDateLabel } from "@/lib/slots";
import { formatTimeFromIso, statusLabelKo, patientNameWard, wardCell } from "@/lib/formatSchedule";
import { useAuthStore } from "@/stores/auth";
import { usePatientsStore } from "@/stores/patients";
import { useAppointmentsStore } from "@/stores/appointments";
import type { AppointmentRow } from "@/types/models";

const auth = useAuthStore();
const patientsStore = usePatientsStore();
const appts = useAppointmentsStore();

const today = new Date();
const fromStr = ref(toLocalYmd(new Date(today.getFullYear(), today.getMonth(), 1)));
const toStr = ref(toLocalYmd(new Date(today.getFullYear(), today.getMonth() + 1, 0)));

const filterPatientId = ref("");
const filterTreatmentName = ref("");
const filterOption = ref("");

async function loadAll() {
  if (!auth.token) return;
  await patientsStore.load();
  await appts.load(fromStr.value, toStr.value);
}

const filtered = computed(() => {
  let list: AppointmentRow[] = appts.items.slice();
  const pid = filterPatientId.value;
  if (pid) list = list.filter((a) => a.patientId === pid);
  const tn = filterTreatmentName.value.trim();
  if (tn) list = list.filter((a) => a.treatmentName.includes(tn));
  const op = filterOption.value.trim();
  if (op) list = list.filter((a) => (a.treatmentOption ?? "").includes(op));
  list.sort((a, b) => new Date(a.treatmentDateTime).getTime() - new Date(b.treatmentDateTime).getTime());
  return list;
});

function dateCellLabel(iso: string) {
  return formatDateLabel(new Date(iso));
}

function patientLabelForSelect(p: { name: string; visitType: string; wardOrNote: string | null }) {
  const ward =
    p.visitType === VISIT_TYPES.OUTPATIENT ? "(외)" : p.wardOrNote ? `(${p.wardOrNote})` : "";
  return `${p.name}${ward}`;
}

const treatmentNameChoices = computed(() => {
  const set = new Set<string>([...TREATMENT_NAMES]);
  for (const a of appts.items) {
    if (a.treatmentName) set.add(a.treatmentName);
  }
  return [...set].sort();
});

onMounted(() => {
  void loadAll();
});

watch([fromStr, toStr], () => {
  void loadAll();
});
</script>

<template>
  <div class="page">
    <header class="header-bar">
      <h1 class="title">기간별 스케줄 검색</h1>
    </header>

    <div class="filters">
      <label class="field">
        <span class="lbl">시작일자</span>
        <input v-model="fromStr" type="date" class="inp" lang="ko-KR" />
      </label>
      <label class="field">
        <span class="lbl">종료일자</span>
        <input v-model="toStr" type="date" class="inp" lang="ko-KR" />
      </label>
      <div class="result-box">
        <span class="result-label">검색결과 ▶</span>
        <span class="result-count">{{ filtered.length }} 건</span>
      </div>
    </div>

    <div class="keyword-row">
      <span class="kw-label">키워드 검색 ▶</span>
      <select v-model="filterPatientId" class="sel">
        <option value="">환자 (전체)</option>
        <option v-for="p in patientsStore.items" :key="p.id" :value="p.id">{{ patientLabelForSelect(p) }}</option>
      </select>
      <select v-model="filterTreatmentName" class="sel">
        <option value="">치료명 (전체)</option>
        <option v-for="n in treatmentNameChoices" :key="n" :value="n">{{ n }}</option>
      </select>
      <select v-model="filterOption" class="sel">
        <option value="">치료옵션 (전체)</option>
        <option v-for="o in TREATMENT_OPTIONS" :key="o" :value="o">{{ o }}</option>
      </select>
      <button type="button" class="btn" @click="loadAll">조회</button>
    </div>

    <p v-if="appts.loading" class="loading">불러오는 중…</p>
    <div v-else class="table-wrap">
      <table class="grid">
        <thead>
          <tr>
            <th>치료일자</th>
            <th>치료시간</th>
            <th>환자명(병동)</th>
            <th>치료명</th>
            <th>병동</th>
            <th>치료옵션</th>
            <th>치료상태</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtered" :key="a.id">
            <td class="nowrap">{{ dateCellLabel(a.treatmentDateTime) }}</td>
            <td class="mono nowrap">{{ formatTimeFromIso(a.treatmentDateTime) }}</td>
            <td>{{ patientNameWard(a) }}</td>
            <td>{{ a.treatmentName }}</td>
            <td class="center">{{ wardCell(a) }}</td>
            <td class="center">{{ a.treatmentOption || "—" }}</td>
            <td>{{ statusLabelKo(a.treatmentStatus) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1400px;
}
.header-bar {
  background: #1e3a5f;
  color: #fff;
  padding: 0.65rem 1rem;
  margin-bottom: 1rem;
  border-radius: 4px;
}
.title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.75rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.lbl {
  font-size: 0.7rem;
  color: #64748b;
}
.inp {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
}
.result-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #94a3b8;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
  background: #f8fafc;
}
.result-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #334155;
}
.result-count {
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}
.keyword-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.6rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
}
.kw-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #92400e;
  margin-right: 0.25rem;
}
.sel {
  min-width: 140px;
  padding: 0.35rem 0.5rem;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  font-size: 0.8rem;
}
.btn {
  background: #334155;
  color: #fff;
  border: none;
  padding: 0.4rem 0.9rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn:hover {
  background: #1e293b;
}
.loading {
  color: #64748b;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid #94a3b8;
  background: #fff;
}
.grid {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  font-size: 0.8rem;
}
.grid th {
  background: #e2e8f0;
  border: 1px solid #94a3b8;
  padding: 0.45rem 0.5rem;
  text-align: left;
  font-weight: 600;
}
.grid td {
  border: 1px solid #cbd5e1;
  padding: 0.4rem 0.5rem;
}
.nowrap {
  white-space: nowrap;
}
.mono {
  font-family: ui-monospace, monospace;
}
.center {
  text-align: center;
}
</style>
