import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import router from "./router";
import axios from "axios";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";

const app = createApp(App);
app.config.globalProperties.$axios = axios;

// アプリケーション起動時にlocalStorageから接続情報を復元
const savedIp = localStorage.getItem("ipAddress");
const savedPort = localStorage.getItem("port");
if (savedIp && savedPort) {
  store.dispatch("updateApiBaseUrl", { ip: savedIp, port: savedPort });
}

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
  rtl: false,
};

app.use(Toast, options);

app.use(store).use(router).mount("#app");
