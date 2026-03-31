<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { apiFetch } from "@/lib/api";

type PendingUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
};

const auth = useAuthStore();
const users = ref<PendingUser[]>([]);
const loading = ref(false);
const error = ref("");
const busyId = ref<string | null>(null);

function fmtWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

async function load() {
  if (!auth.token) return;
  error.value = "";
  loading.value = true;
  try {
    const res = await apiFetch<{ users: PendingUser[] }>("/api/admin/users/pending", { token: auth.token });
    users.value = res.users;
  } catch (e) {
    error.value = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

async function approve(u: PendingUser) {
  if (!auth.token) return;
  error.value = "";
  busyId.value = u.id;
  try {
    await apiFetch(`/api/admin/users/${u.id}/approve`, { method: "POST", token: auth.token });
    await load();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "승인에 실패했습니다.";
  } finally {
    busyId.value = null;
  }
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="page">
    <h1 class="h1">가입 승인</h1>
    <p class="lead">
      회원가입한 계정은 관리자가 이 화면에서 승인하기 전까지 로그인할 수 없습니다. 승인 후에는 관리자 권한으로 모든 메뉴를 사용할 수 있습니다.
    </p>
    <div class="toolbar">
      <button type="button" class="btn-refresh" :disabled="loading" @click="load">
        {{ loading ? "불러오는 중…" : "새로고침" }}
      </button>
    </div>
    <p v-if="error" class="err">{{ error }}</p>
    <div v-if="!loading && users.length === 0 && !error" class="empty">승인 대기 중인 계정이 없습니다.</div>
    <div v-else class="table-wrap">
      <table class="table">
        <thead>
          <tr>
            <th>가입 일시</th>
            <th>이메일</th>
            <th>이름</th>
            <th>역할</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td>{{ fmtWhen(u.createdAt) }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.name ?? "—" }}</td>
            <td>{{ u.role === "ADMIN" ? "관리자(승인 후)" : u.role }}</td>
            <td class="actions">
              <button
                type="button"
                class="btn-ok"
                :disabled="busyId === u.id"
                @click="approve(u)"
              >
                {{ busyId === u.id ? "…" : "승인" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 960px;
}
.h1 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}
.lead {
  margin: 0 0 1rem;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.55;
}
.toolbar {
  margin-bottom: 0.75rem;
}
.btn-refresh {
  padding: 0.45rem 0.9rem;
  background: #1e40af;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-refresh:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.err {
  color: #b91c1c;
  font-size: 0.875rem;
}
.empty {
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 8px;
  color: #64748b;
  font-size: 0.9rem;
}
.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.table th,
.table td {
  padding: 0.6rem 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}
.table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #334155;
}
.table tbody tr:last-child td {
  border-bottom: none;
}
.actions {
  white-space: nowrap;
}
.btn-ok {
  padding: 0.35rem 0.75rem;
  background: #0f766e;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
}
.btn-ok:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
.btn-ok:hover:not(:disabled) {
  background: #0d9488;
}
</style>
