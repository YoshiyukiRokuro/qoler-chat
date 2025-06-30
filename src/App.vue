// src/App.vue

<template>
  <div id="app-wrapper">
    <router-view/>
  </div>
</template>

<script>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'App',
  setup() {
    const store = useStore();
    const router = useRouter();

    onMounted(() => {
      // メインプロセスからの自動ログイン要求を待つ
      window.electronAPI.onAutoLoginRequest(async (empId) => {
        console.log('Auto login request received for EmpCd:', empId);

        // APIのURLを設定（localStorageから読み込む）
        const savedIp = localStorage.getItem('ipAddress') || ''; // デフォルト値
        const savedPort = localStorage.getItem('port') || '3000'; // デフォルト値
        store.dispatch('updateApiBaseUrl', { ip: savedIp, port: savedPort });

        // 自動ログインアクションを実行
        const success = await store.dispatch('autoLogin', { id: empId });
        if (success) {
          router.push('/');
        }
      });
    });
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  height: 96vh;
  margin: 0;
}
#app-wrapper {
  height: 100%;
}
</style>