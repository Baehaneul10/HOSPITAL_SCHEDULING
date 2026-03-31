<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

const email = ref("");
const password = ref("");
const password2 = ref("");
const name = ref("");
const error = ref("");

onMounted(() => {
  if (auth.token) {
    void router.replace(typeof route.query.redirect === "string" ? route.query.redirect : "/");
  }
});

async function submit() {
  error.value = "";
  if (password.value.length < 8) {
    error.value = "비밀번호는 8자 이상 입력하세요.";
    return;
  }
  if (password.value !== password2.value) {
    error.value = "비밀번호 확인이 일치하지 않습니다.";
    return;
  }
  try {
    await auth.register(email.value.trim(), password.value, name.value.trim() || undefined);
    await router.replace({ name: "login", query: { registered: "1" } });
  } catch (e) {
    error.value = e instanceof Error ? e.message : "회원가입 실패";
  }
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <h1 class="title">회원가입</h1>
      <p class="hint">
        이메일·비밀번호로 계정을 만듭니다. 가입 직후에는 로그인할 수 없으며, 병원 관리자가 「가입 승인」에서 승인한 뒤에 로그인할 수 있습니다. 승인된 계정은 환자명부 등 전 기능을 쓸 수 있는 관리자 권한으로 사용됩니다.
      </p>
      <form class="form" @submit.prevent="submit">
        <label class="field">
          <span>이메일 (로그인 ID)</span>
          <input v-model="email" type="email" autocomplete="email" required class="input" />
        </label>
        <label class="field">
          <span>이름 (선택)</span>
          <input v-model="name" type="text" autocomplete="name" class="input" />
        </label>
        <label class="field">
          <span>비밀번호 (8자 이상)</span>
          <input v-model="password" type="password" autocomplete="new-password" required minlength="8" class="input" />
        </label>
        <label class="field">
          <span>비밀번호 확인</span>
          <input
            v-model="password2"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="input"
          />
        </label>
        <p v-if="error" class="err">{{ error }}</p>
        <button type="submit" class="btn" :disabled="auth.loading">{{ auth.loading ? "…" : "가입하기" }}</button>
      </form>
      <p class="footer">
        이미 계정이 있나요?
        <RouterLink :to="{ name: 'login', query: route.query }" class="link">로그인</RouterLink>
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
  max-width: 420px;
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
  background: #0f766e;
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
  background: #0d9488;
}
.footer {
  margin: 1.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
  text-align: center;
}
.link {
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: none;
}
.link:hover {
  text-decoration: underline;
}
</style>
