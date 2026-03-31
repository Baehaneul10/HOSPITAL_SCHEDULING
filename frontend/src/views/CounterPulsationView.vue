<script setup lang="ts">
import { ref, computed, watch, onMounted, useTemplateRef } from "vue";
import { eachDayInclusive, formatDateLabel, formatTimeHm, generateTimeSlotsForDay, startOfDay, toLocalYmd } from "@/lib/slots";
import { useAuthStore } from "@/stores/auth";
import { usePatientsStore } from "@/stores/patients";
import { useAppointmentsStore } from "@/stores/appointments";
import type { AppointmentRow, PatientBrief } from "@/types/models";
import ScheduleGridRow from "@/components/ScheduleGridRow.vue";

const auth = useAuthStore();
const patientsStore = usePatientsStore();
const apptsStore = useAppointmentsStore();

const endAnchor = useTemplateRef<HTMLDivElement>("endAnchor");

const today = new Date();
const fromStr = ref(toLocalYmd(today));
const endRange = new Date(today);
endRange.setDate(endRange.getDate() + 14);
const toStr = ref(toLocalYmd(endRange));

function parseLocalDate(s: string): Date {
  const [y, mo, d] = s.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

function rowKeyFromSlot(slot: Date) {
  const d = startOfDay(slot);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}_${formatTimeHm(slot)}`;
}

const apptBySlot = computed(() => {
  const map = new Map<string, AppointmentRow>();
  for (const a of apptsStore.items) {
    const dt = new Date(a.treatmentDateTime);
    const k = rowKeyFromSlot(dt);
    if (!map.has(k)) map.set(k, a);
  }
  return map;
});

const days = computed(() => eachDayInclusive(parseLocalDate(fromStr.value), parseLocalDate(toStr.value)));

const patientList = computed<PatientBrief[]>(() =>
  patientsStore.items.map((p) => ({
    id: p.id,
    chartNumber: p.chartNumber,
    name: p.name,
    visitType: p.visitType,
    wardOrNote: p.wardOrNote,
    treatmentInfo: p.treatmentInfo,
  }))
);

async function refresh() {
  if (!auth.token) return;
  await patientsStore.load();
  await apptsStore.load(fromStr.value, toStr.value);
}

function onSlotSaved() {
  void refresh();
}

function scrollToLatest() {
  endAnchor.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

onMounted(() => {
  void refresh();
});

watch([fromStr, toStr], () => {
  void refresh();
});
</script>

<template>
  <div>
    <div class="page-title">
      <h1>치료스케줄관리 [무등산생태요양병원]</h1>
    </div>

    <div class="toolbar">
      <button type="button" class="btn-jump" @click="scrollToLatest">최신 날짜로 이동</button>
      <span class="toolbar-hint">입력은 화면에 그대로 유지됩니다. 반영은 맨 오른쪽 <strong>저장</strong>을 누르면 서버·월별 캘린더에 적용됩니다.</span>
    </div>

    <div class="filters">
      <label class="field">
        <span class="label">시작일 (연-월-일)</span>
        <input v-model="fromStr" type="date" class="input" lang="ko-KR" />
      </label>
      <label class="field">
        <span class="label">종료일 (연-월-일)</span>
        <input v-model="toStr" type="date" class="input" lang="ko-KR" />
      </label>
      <button type="button" class="btn-query" @click="refresh">조회</button>
    </div>
    <p class="date-hint">날짜는 <strong>연도 → 월 → 일</strong> 순으로 선택합니다. (브라우저 표시는 환경에 따라 다를 수 있습니다.)</p>

    <p v-if="!auth.token" class="loading">로그인이 필요합니다.</p>
    <p v-else-if="apptsStore.loading" class="loading">불러오는 중…</p>
    <div v-else class="table-wrap">
      <table class="grid">
        <thead>
          <tr>
            <th>치료일자</th>
            <th>치료시작시간</th>
            <th>환자명 (병동) · 명부 치료정보</th>
            <th>치료명</th>
            <th>치료옵션</th>
            <th>치료상태</th>
            <th>치료정보</th>
            <th>참고사항</th>
            <th>비고</th>
            <th>저장</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="day in days" :key="day.toISOString()">
            <ScheduleGridRow
              v-for="slot in generateTimeSlotsForDay(day)"
              :key="rowKeyFromSlot(slot)"
              :slot="slot"
              :day-label="formatDateLabel(day)"
              :patients="patientList"
              :existing="apptBySlot.get(rowKeyFromSlot(slot))"
              :token="auth.token!"
              @saved="onSlotSaved"
            />
          </template>
        </tbody>
      </table>
    </div>
    <div ref="endAnchor" />
  </div>
</template>

<style scoped>
.page-title {
  margin-bottom: 1rem;
  border-bottom: 2px solid #1e3a5f;
  background: #1e3a5f;
  color: #fff;
  padding: 0.75rem 1rem;
}
.page-title h1 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #fde68a;
  background: #fffbeb;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}
.btn-jump {
  background: #ea580c;
  color: #fff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.btn-jump:hover {
  background: #c2410c;
}
.toolbar-hint {
  color: #334155;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  margin-bottom: 0.35rem;
  font-size: 0.875rem;
}
.date-hint {
  margin: 0 0 1rem;
  font-size: 0.75rem;
  color: #64748b;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.label {
  font-size: 0.7rem;
  color: #64748b;
}
.input {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
}
.btn-query {
  background: #334155;
  color: #fff;
  border: none;
  padding: 0.4rem 0.85rem;
  border-radius: 4px;
  cursor: pointer;
}
.btn-query:hover {
  background: #1e293b;
}
.loading {
  color: #64748b;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}
.grid {
  min-width: 1100px;
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.grid thead tr {
  background: #f1f5f9;
  text-align: left;
  font-size: 0.7rem;
  color: #334155;
}
.grid th {
  border: 1px solid #e2e8f0;
  padding: 0.5rem 0.35rem;
  white-space: nowrap;
}
</style>
