<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

async function logout() {
  auth.logout();
  await router.push({ name: "login" });
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <div class="brand">무등산생태요양병원 · 치료 스케줄</div>
      <nav class="nav">
        <RouterLink to="/" class="link">홈</RouterLink>
        <RouterLink to="/schedule/counter-pulsation" class="link">치료스케줄관리</RouterLink>
        <RouterLink to="/schedule/calendar" class="link">월별 캘린더</RouterLink>
        <RouterLink to="/schedule/search" class="link">기간별 검색</RouterLink>
        <RouterLink to="/patients" class="link">환자명부</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/admin/pending-users" class="link">가입 승인</RouterLink>
      </nav>
      <div class="user">
        <span v-if="auth.user" class="email">{{ auth.user.email }}</span>
        <span v-if="auth.user" class="role">{{ auth.user.role === "ADMIN" ? "관리자" : "치료" }}</span>
        <button type="button" class="btn-out" @click="logout">로그아웃</button>
      </div>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.25rem;
  background: #1e3a5f;
  color: #fff;
}
.brand {
  font-weight: 600;
  font-size: 0.95rem;
}
.nav {
  display: flex;
  gap: 0.75rem;
  flex: 1;
}
.link {
  color: #e2e8f0;
  text-decoration: none;
  font-size: 0.875rem;
}
.link.router-link-active {
  color: #fff;
  font-weight: 600;
  text-decoration: underline;
}
.user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.email {
  opacity: 0.9;
}
.role {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}
.btn-out {
  background: #0f172a;
  color: #fff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn-out:hover {
  background: #334155;
}
.main {
  flex: 1;
  padding: 1rem 1.25rem 2rem;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}
</style>
