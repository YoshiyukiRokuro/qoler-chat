import { createRouter, createWebHashHistory } from "vue-router"; // createWebHistoryをcreateWebHashHistoryに変更
import store from "../store";
import ChatView from "../views/ChatView.vue";
import LoginView from "../views/LoginView.vue";

const routes = [
  {
    path: "/",
    name: "Chat",
    component: ChatView,
    meta: { requiresAuth: true }, // このルートは認証が必要
  },
  {
    path: "/login",
    name: "Login",
    component: LoginView,
  },
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
});

// ナビゲーションガード
router.beforeEach((to, from, next) => {
  if (
    to.matched.some((record) => record.meta.requiresAuth) &&
    !store.getters.isAuthenticated
  ) {
    // 認証が必要なページに、未認証でアクセスしようとした場合
    next("/login");
  } else {
    next();
  }
});

export default router;
