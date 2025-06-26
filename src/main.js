import { createApp } from 'vue'
import App from './App.vue'
import store from './store' // storeをインポート

createApp(App).use(store).mount('#app') // .use(store) を追加