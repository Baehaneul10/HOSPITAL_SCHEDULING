import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth";
import type { PatientRow } from "@/types/models";

export const usePatientsStore = defineStore("patients", () => {
  const items = ref<PatientRow[]>([]);
  const total = ref(0);
  const loading = ref(false);

  async function load(q = "") {
    const auth = useAuthStore();
    if (!auth.token) return;
    loading.value = true;
    try {
      const params = new URLSearchParams();
      params.set("limit", "500");
      if (q.trim()) params.set("q", q.trim());
      const data = await apiFetch<{ items: PatientRow[]; total: number }>(`/api/patients?${params}`, {
        token: auth.token,
      });
      items.value = data.items;
      total.value = data.total;
    } finally {
      loading.value = false;
    }
  }

  return { items, total, loading, load };
});
