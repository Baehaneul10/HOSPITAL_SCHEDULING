import { defineStore } from "pinia";
import { ref } from "vue";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "./auth";
import type { AppointmentRow } from "@/types/models";

export const useAppointmentsStore = defineStore("appointments", () => {
  const items = ref<AppointmentRow[]>([]);
  const loading = ref(false);

  async function load(from: string, to: string, treatmentName?: string) {
    const auth = useAuthStore();
    if (!auth.token) return;
    loading.value = true;
    try {
      const params = new URLSearchParams();
      params.set("from", from);
      params.set("to", to);
      if (treatmentName) params.set("treatmentName", treatmentName);
      const data = await apiFetch<{ items: AppointmentRow[] }>(`/api/appointments?${params}`, {
        token: auth.token,
      });
      items.value = data.items;
    } finally {
      loading.value = false;
    }
  }

  return { items, loading, load };
});
