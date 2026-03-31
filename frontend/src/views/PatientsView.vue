<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { VISIT_TYPES } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth";
import { usePatientsStore } from "@/stores/patients";
import { apiFetch } from "@/lib/api";
import type { PatientRow } from "@/types/models";

const auth = useAuthStore();
const patients = usePatientsStore();

const q = ref("");
const editing = ref<PatientRow | null>(null);
const form = ref({
  chartNumber: "",
  name: "",
  visitType: VISIT_TYPES.INPATIENT,
  wardOrNote: "",
  admissionDate: "",
  treatmentStartDate: "",
  dischargeDate: "",
  treatmentEndDate: "",
  treatmentInfo: "",
  estimatedAmount: "",
  notes: "",
});

function fmtDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("ko-KR");
}

async function load() {
  await patients.load(q.value);
}

function resetForm() {
  editing.value = null;
  form.value = {
    chartNumber: "",
    name: "",
    visitType: VISIT_TYPES.INPATIENT,
    wardOrNote: "",
    admissionDate: "",
    treatmentStartDate: "",
    dischargeDate: "",
    treatmentEndDate: "",
    treatmentInfo: "",
    estimatedAmount: "",
    notes: "",
  };
}

function startEdit(p: PatientRow) {
  editing.value = p;
  form.value = {
    chartNumber: p.chartNumber,
    name: p.name,
    visitType: p.visitType,
    wardOrNote: p.wardOrNote ?? "",
    admissionDate: p.admissionDate ? p.admissionDate.slice(0, 10) : "",
    treatmentStartDate: p.treatmentStartDate ? p.treatmentStartDate.slice(0, 10) : "",
    dischargeDate: p.dischargeDate ? p.dischargeDate.slice(0, 10) : "",
    treatmentEndDate: p.treatmentEndDate ? p.treatmentEndDate.slice(0, 10) : "",
    treatmentInfo: p.treatmentInfo ?? "",
    estimatedAmount: p.estimatedAmount != null ? String(p.estimatedAmount) : "",
    notes: p.notes ?? "",
  };
}

async function save(e: Event) {
  e.preventDefault();
  if (!auth.token) return;
  const payload = {
    chartNumber: form.value.chartNumber,
    name: form.value.name,
    visitType: form.value.visitType,
    wardOrNote: form.value.wardOrNote || null,
    admissionDate: form.value.admissionDate || null,
    treatmentStartDate: form.value.treatmentStartDate || null,
    dischargeDate: form.value.dischargeDate || null,
    treatmentEndDate: form.value.treatmentEndDate || null,
    treatmentInfo: form.value.treatmentInfo || null,
    estimatedAmount: form.value.estimatedAmount === "" ? null : Number(form.value.estimatedAmount),
    notes: form.value.notes || null,
  };
  if (editing.value) {
    await apiFetch(`/api/patients/${editing.value.id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
      token: auth.token,
    });
  } else {
    await apiFetch("/api/patients", {
      method: "POST",
      body: JSON.stringify(payload),
      token: auth.token,
    });
  }
  resetForm();
  await load();
}

async function remove(id: string) {
  if (!auth.token) return;
  if (!confirm("삭제할까요?")) return;
  await apiFetch(`/api/patients/${id}`, { method: "DELETE", token: auth.token });
  await load();
}

onMounted(() => {
  void load();
});

watch(q, () => {
  void load();
});
</script>

<template>
  <div>
    <h1 class="h1">환자명부</h1>
    <p class="desc">
      차트번호·환자명·입원/외래·입원일·치료기간·치료정보·예상금액·참고사항을 관리합니다. 로그인한 계정이라면 등록·수정·삭제가 가능합니다.
    </p>

    <div class="toolbar">
      <label class="field">
        <span class="lbl">검색</span>
        <input v-model="q" placeholder="차트번호·이름" class="input" />
      </label>
      <button type="button" class="btn-sec" @click="load">새로고침</button>
    </div>

    <form v-if="auth.token" class="card" @submit="save">
      <h2 class="h2">{{ editing ? "환자 수정" : "환자 등록" }}</h2>
      <div class="grid-form">
        <label class="field">
          <span class="lbl">차트번호 *</span>
          <input v-model="form.chartNumber" required class="input" :disabled="!!editing" />
        </label>
        <label class="field">
          <span class="lbl">환자명 *</span>
          <input v-model="form.name" required class="input" />
        </label>
        <label class="field">
          <span class="lbl">입원/외래 *</span>
          <select v-model="form.visitType" class="input">
            <option :value="VISIT_TYPES.INPATIENT">입원</option>
            <option :value="VISIT_TYPES.OUTPATIENT">외래</option>
          </select>
        </label>
        <label class="field">
          <span class="lbl">병동·표기</span>
          <input
            v-model="form.wardOrNote"
            placeholder="예: 1 · 외래는 비워두면 (외) 표시"
            class="input"
          />
        </label>
        <label class="field">
          <span class="lbl">입원일</span>
          <input v-model="form.admissionDate" type="date" class="input" />
        </label>
        <label class="field">
          <span class="lbl">치료시작일</span>
          <input v-model="form.treatmentStartDate" type="date" class="input" />
        </label>
        <label class="field">
          <span class="lbl">퇴원일</span>
          <input v-model="form.dischargeDate" type="date" class="input" />
        </label>
        <label class="field">
          <span class="lbl">치료종료일</span>
          <input v-model="form.treatmentEndDate" type="date" class="input" />
        </label>
        <label class="field">
          <span class="lbl">예상금액</span>
          <input v-model="form.estimatedAmount" type="number" class="input" />
        </label>
        <label class="field wide">
          <span class="lbl">치료정보</span>
          <textarea v-model="form.treatmentInfo" rows="2" class="input" />
        </label>
        <label class="field wide">
          <span class="lbl">참고사항</span>
          <textarea v-model="form.notes" rows="2" class="input" />
        </label>
      </div>
      <div class="actions">
        <button type="submit" class="btn-primary">{{ editing ? "저장" : "등록" }}</button>
        <button
          v-if="editing || form.chartNumber"
          type="button"
          class="btn-sec"
          @click="resetForm"
        >
          취소
        </button>
      </div>
    </form>

    <div class="table-wrap">
      <p v-if="patients.loading" class="loading">불러오는 중…</p>
      <table v-else class="table">
        <thead>
          <tr>
            <th>차트</th>
            <th>환자명</th>
            <th>입원/외래(병동)</th>
            <th>입원·치료시작</th>
            <th>퇴원·치료종료</th>
            <th>치료정보</th>
            <th>예상금액</th>
            <th>참고</th>
            <th v-if="auth.token">작업</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in patients.items" :key="p.id">
            <td class="mono">{{ p.chartNumber }}</td>
            <td>{{ p.name }}</td>
            <td>
              {{ p.visitType === VISIT_TYPES.OUTPATIENT ? "외래" : "입원" }}
              {{ p.wardOrNote ? ` (${p.wardOrNote})` : p.visitType === VISIT_TYPES.OUTPATIENT ? " (외)" : "" }}
            </td>
            <td class="nowrap small">{{ fmtDate(p.admissionDate) }} / {{ fmtDate(p.treatmentStartDate) }}</td>
            <td class="nowrap small">{{ fmtDate(p.dischargeDate) }} / {{ fmtDate(p.treatmentEndDate) }}</td>
            <td class="truncate" :title="p.treatmentInfo ?? ''">{{ p.treatmentInfo }}</td>
            <td class="small">
              {{ p.estimatedAmount != null ? p.estimatedAmount.toLocaleString("ko-KR") : "" }}
            </td>
            <td class="truncate narrow" :title="p.notes ?? ''">{{ p.notes }}</td>
            <td v-if="auth.token" class="nowrap">
              <button type="button" class="link" @click="startEdit(p)">수정</button>
              <button type="button" class="link danger" @click="remove(p.id)">삭제</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.h1 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}
.desc {
  margin: 0 0 1.25rem;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 1.25rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.lbl {
  font-size: 0.7rem;
  font-weight: 500;
  color: #64748b;
}
.input {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 0.45rem 0.6rem;
  font-size: 0.875rem;
}
.btn-sec {
  background: #e2e8f0;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-sec:hover {
  background: #cbd5e1;
}
.card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: #fff;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.h2 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}
.grid-form {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
}
.wide {
  grid-column: 1 / -1;
}
.actions {
  margin-top: 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.btn-primary {
  background: #1d4ed8;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-primary:hover {
  background: #1e40af;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
}
.loading {
  padding: 2rem;
  text-align: center;
  color: #64748b;
}
.table {
  min-width: 1000px;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  text-align: left;
}
.table thead {
  background: #f1f5f9;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: #64748b;
}
.table th,
.table td {
  padding: 0.5rem 0.65rem;
  border-top: 1px solid #f1f5f9;
}
.mono {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
}
.nowrap {
  white-space: nowrap;
}
.small {
  font-size: 0.75rem;
}
.truncate {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.truncate.narrow {
  max-width: 160px;
}
.link {
  background: none;
  border: none;
  color: #1d4ed8;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
  padding: 0;
}
.link.danger {
  color: #dc2626;
  margin-left: 0.5rem;
}
</style>
