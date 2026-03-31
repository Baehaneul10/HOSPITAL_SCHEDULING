<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { useAppointmentsStore } from "@/stores/appointments";
import { formatCalendarLine } from "@/lib/formatSchedule";
import type { AppointmentRow } from "@/types/models";

const auth = useAuthStore();
const appts = useAppointmentsStore();

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const cursor = ref(startOfMonth(new Date()));
const filterTreatment = ref("");
const filterStatus = ref("");

const fromStr = computed(() => toYmd(startOfMonth(cursor.value)));
const toStr = computed(() => toYmd(endOfMonth(cursor.value)));

const filteredItems = computed(() => {
  let list = appts.items.slice();
  const ft = filterTreatment.value.trim();
  if (ft) list = list.filter((x) => x.treatmentName.includes(ft));
  const fs = filterStatus.value.trim();
  if (!fs) return list;
  const lower = fs.toLowerCase();
  list = list.filter((x) => {
    if (x.treatmentStatus.toLowerCase().includes(lower)) return true;
    if (fs.includes("완") && x.treatmentStatus === "COMPLETED") return true;
    if (fs.includes("예약") && x.treatmentStatus === "SCHEDULED") return true;
    if (fs.includes("취소") && x.treatmentStatus === "CANCELLED") return true;
    return false;
  });
  return list;
});

const byDay = computed(() => {
  const map = new Map<string, AppointmentRow[]>();
  for (const a of filteredItems.value) {
    const d = new Date(a.treatmentDateTime);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  for (const arr of map.values()) {
    arr.sort((x, y) => new Date(x.treatmentDateTime).getTime() - new Date(y.treatmentDateTime).getTime());
  }
  return map;
});

const weeks = computed(() => {
  const first = startOfMonth(cursor.value);
  const last = endOfMonth(cursor.value);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(cursor.value.getFullYear(), cursor.value.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
});

const title = computed(() => `${cursor.value.getFullYear()}년 ${cursor.value.getMonth() + 1}월`);

async function load() {
  if (!auth.token) return;
  await appts.load(fromStr.value, toStr.value);
}

onMounted(() => {
  void load();
});

watch(cursor, () => {
  void load();
});

watch(
  () => auth.token,
  (t) => {
    if (t) void load();
  }
);

function goPrev() {
  cursor.value = addMonths(cursor.value, -1);
}
function goNext() {
  cursor.value = addMonths(cursor.value, 1);
}
function goToday() {
  cursor.value = startOfMonth(new Date());
}
</script>

<template>
  <div class="page">
    <h1 class="h1">월별 캘린더</h1>
    <p class="lead">
      각 줄 형식: <code>시간 ▶ 환자(병동) ▶ 치료명 ▶ 옵션 ▶ 상태</code> · 치료스케줄관리에서
      <strong>저장</strong>한 내용이 여기에 표시됩니다.
    </p>

    <div class="toolbar">
      <div class="row">
        <button type="button" class="btn-sec" @click="goPrev">이전 달</button>
        <span class="month-title">{{ title }}</span>
        <button type="button" class="btn-sec" @click="goNext">다음 달</button>
        <button type="button" class="btn-today" @click="goToday">오늘</button>
      </div>
      <div class="filters">
        <label class="fil">
          <span class="fil-lbl">치료명 필터</span>
          <input v-model="filterTreatment" class="fil-inp" placeholder="부분일치 (예: 역박동)" />
        </label>
        <label class="fil">
          <span class="fil-lbl">상태 필터</span>
          <input v-model="filterStatus" class="fil-inp" placeholder="완료 · 예약 · 취소" />
        </label>
        <button type="button" class="btn-apply" @click="load">새로고침</button>
      </div>
    </div>

    <p v-if="appts.loading" class="loading">불러오는 중…</p>
    <div v-else class="cal-wrap">
      <table class="cal">
        <thead>
          <tr>
            <th v-for="w in ['일', '월', '화', '수', '목', '금', '토']" :key="w" class="th">{{ w }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(week, wi) in weeks" :key="wi">
            <td
              v-for="(day, di) in week"
              :key="`${wi}-${di}`"
              class="td"
              :class="{ empty: !day, today: day && sameDay(day, new Date()) }"
            >
              <template v-if="day">
                <div class="day-head">{{ day.getDate() }}</div>
                <ul class="events">
                  <li
                    v-for="a in byDay.get(`${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`) ?? []"
                    :key="a.id"
                    class="ev"
                  >
                    {{ formatCalendarLine(a) }}
                  </li>
                </ul>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1200px;
}
.h1 {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
}
.lead {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
}
.lead code {
  font-size: 0.78rem;
  background: #e2e8f0;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  margin-bottom: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}
.month-title {
  min-width: 140px;
  text-align: center;
  font-weight: 600;
  color: #0f172a;
}
.btn-sec {
  border: 1px solid #cbd5e1;
  background: #fff;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-sec:hover {
  background: #f8fafc;
}
.btn-today {
  margin-left: 0.35rem;
  border: none;
  background: #e2e8f0;
  padding: 0.4rem 0.85rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-today:hover {
  background: #cbd5e1;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}
.fil {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.fil-lbl {
  font-size: 0.65rem;
  color: #64748b;
}
.fil-inp {
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.875rem;
}
.btn-apply {
  background: #1e40af;
  color: #fff;
  border: none;
  padding: 0.45rem 0.9rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
}
.btn-apply:hover {
  background: #1e3a8a;
}
.loading {
  color: #64748b;
}
.cal-wrap {
  overflow-x: auto;
  border: 1px solid #94a3b8;
  border-radius: 4px;
  background: #fff;
}
.cal {
  width: 100%;
  min-width: 900px;
  border-collapse: collapse;
  font-size: 0.68rem;
}
.th {
  background: #1e3a5f;
  color: #fff;
  border: 1px solid #334155;
  padding: 0.45rem 0.35rem;
  font-weight: 600;
}
.td {
  min-height: 6.5rem;
  width: 14.28%;
  vertical-align: top;
  border: 1px solid #94a3b8;
  padding: 0;
  background: #fff;
}
.td.empty {
  background: #f1f5f9;
}
.td.today {
  background: #eff6ff;
}
.day-head {
  text-align: center;
  font-weight: 700;
  color: #1d4ed8;
  padding: 0.25rem 0.2rem;
  background: #dbeafe;
  border-bottom: 1px solid #bfdbfe;
}
.events {
  list-style: none;
  margin: 0;
  padding: 0.2rem 0.25rem;
  /* 한 줄이 셀 너비를 넘기면 셀 안에서만 가로 스크롤 */
  overflow-x: auto;
  overflow-y: visible;
  max-width: 100%;
}
.ev {
  line-height: 1.4;
  color: #0f172a;
  margin-bottom: 0.25rem;
  font-size: 0.62rem;
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}
.ev:last-child {
  margin-bottom: 0;
}
</style>
