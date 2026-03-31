<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const error = ref("");

const showRegisteredNotice = computed(() => route.query.registered === "1");

onMounted(() => {
  if (auth.token) {
    void router.replace(typeof route.query.redirect === "string" ? route.query.redirect : "/");
  }
});

async function submit() {
  error.value = "";
  try {
    await auth.loginEmail(email.value.trim(), password.value);
    const redir = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    await router.replace(redir);
  } catch (e) {
    error.value = e instanceof Error ? e.message : "로그인 실패";
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h1 class="title">로그인</h1>
      <p class="hint">가입한 이메일과 비밀번호로 로그인하세요.</p>
      <p v-if="showRegisteredNotice" class="notice">
        회원가입이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다. 승인되면 다시 이 화면에서 로그인하세요.
      </p>
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>이메일</span>
          <input v-model="email" type="email" autocomplete="username" required class="input" />
        </label>
        <label class="field">
          <span>비밀번호</span>
          <input v-model="password" type="password" autocomplete="current-password" required class="input" />
        </label>
        <p v-if="error" class="err">{{ error }}</p>
        <button type="submit" class="btn" :disabled="auth.loading">{{ auth.loading ? "…" : "로그인" }}</button>
      </form>
      <p class="footer">
        계정이 없나요?
        <RouterLink :to="{ name: 'register', query: route.query }" class="link">회원가입</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%);
}
.card {
  width: 100%;
  max-width: 400px;
  background: #fff;
  border-radius: 12px;
  padding: 1.75rem;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}
.title {
  margin: 0 0 0.25rem;
  font-size: 1.35rem;
}
.hint {
  margin: 0 0 1.25rem;
  font-size: 0.8rem;
  color: #64748b;
}
.notice {
  margin: -0.5rem 0 1rem;
  padding: 0.65rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  font-size: 0.8rem;
  color: #065f46;
  line-height: 1.45;
}
.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #334155;
}
.input {
  padding: 0.6rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 1rem;
}
.err {
  color: #b91c1c;
  font-size: 0.85rem;
  margin: 0;
}
.btn {
  margin-top: 0.25rem;
  padding: 0.65rem;
  background: #1d4ed8;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn:hover:not(:disabled) {
  background: #1e40af;
}
.footer {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
}
.link {
  color: #0f766e;
  font-weight: 600;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
</style>
