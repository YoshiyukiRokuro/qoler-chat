// src/main.js

import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import axios from 'axios'
import Toast from "vue-toastification"; // --- [1] Toastをインポート
import "vue-toastification/dist/index.css"; // --- [2] CSSをインポート

const app = createApp(App)
app.config.globalProperties.$axios = axios

// --- [3] Toastプラグインをオプション付きで登録 ---
const options = {
  position: "top-right",
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
};

app.use(Toast, options); // オプションを渡してuseする

app.use(store).use(router).mount('#app')