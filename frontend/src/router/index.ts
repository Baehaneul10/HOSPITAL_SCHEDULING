import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/LoginView.vue"),
      meta: { public: true },
    },
    {
      path: "/register",
      name: "register",
      component: () => import("@/views/RegisterView.vue"),
      meta: { public: true },
    },
    {
      path: "/",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        { path: "", name: "home", component: () => import("@/views/HomeView.vue") },
        { path: "schedule/counter-pulsation", name: "counterPulsation", component: () => import("@/views/CounterPulsationView.vue") },
        { path: "schedule/calendar", name: "scheduleCalendar", component: () => import("@/views/ScheduleCalendarView.vue") },
        { path: "schedule/search", name: "scheduleSearch", component: () => import("@/views/SchedulePeriodSearchView.vue") },
        { path: "patients", name: "patients", component: () => import("@/views/PatientsView.vue") },
        {
          path: "admin/pending-users",
          name: "adminPendingUsers",
          meta: { requiresAdmin: true },
          component: () => import("@/views/AdminPendingUsersView.vue"),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (to.meta.public) return true;
  if (auth.token && !auth.user) {
    try {
      await auth.fetchMe();
    } catch {
      auth.logout();
    }
  }
  if (to.meta.requiresAuth && !auth.token) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.matched.some((r) => r.meta.requiresAdmin) && !auth.isAdmin) {
    return { name: "home" };
  }
  return true;
});

export default router;
