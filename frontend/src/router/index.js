import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import DashboardView from "../views/DashboardView.vue";
import AdminView from "../views/AdminView.vue";
import { getUser } from "../services/auth";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/login", component: LoginView, meta: { public: true } },
  { path: "/register", component: RegisterView, meta: { public: true } },
  { path: "/dashboard", component: DashboardView },
  { path: "/admin", component: AdminView, meta: { role: "secretary" } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const user = getUser();

  if (to.meta.public) {
    return true;
  }

  if (!user) {
    return "/login";
  }

  if (to.meta.role && user.role !== to.meta.role) {
    return "/dashboard";
  }

  return true;
});

export default router;
