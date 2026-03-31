import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { apiFetch } from "@/lib/api";
import { ROLES } from "@/lib/constants";
import type { UserMe } from "@/types/models";
const TOKEN_KEY = "hospital_token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const user = ref<UserMe | null>(null);
  const loading = ref(false);

  const isAdmin = computed(() => user.value?.role === ROLES.ADMIN);

  function setToken(t: string | null) {
    token.value = t;
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function restoreSession() {
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    token.value = t;
    try {
      await fetchMe();
    } catch {
      setToken(null);
      user.value = null;
    }
  }

  async function fetchMe() {
    if (!token.value) return;
    const me = await apiFetch<UserMe>("/api/auth/me", { token: token.value });
    user.value = me;
  }

  async function loginEmail(email: string, password: string) {
    loading.value = true;
    try {
      const res = await apiFetch<{ token: string; user: UserMe }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      user.value = res.user;
    } finally {
      loading.value = false;
    }
  }

  async function register(email: string, password: string, name?: string) {
    loading.value = true;
    try {
      await apiFetch<{ message: string; user: UserMe }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          ...(name?.trim() ? { name: name.trim() } : {}),
        }),
      });
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    setToken(null);
    user.value = null;
  }

  return {
    token,
    user,
    loading,
    isAdmin,
    setToken,
    restoreSession,
    fetchMe,
    loginEmail,
    register,
    logout,
  };
});
