import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router' // ルーターをインポート
import axios from 'axios'

// axiosをグローバルプロパティとして設定
const app = createApp(App)
app.config.globalProperties.$axios = axios

app.use(store).use(router).mount('#app') // .use(router) を追加