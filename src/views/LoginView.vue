<template>
  <div class="login-container">
    <div class="login-form">
      <h2>{{ isRegistering ? 'ユーザー登録' : 'クオラチャット' }}</h2>
      <!--
      <a href="#" @click.prevent="toggleMode">
        {{ isRegistering ? 'ログイン画面へ' : '新しいアカウントを作成' }}
      </a>
      <br>
      -->
      <span class="caution-text">基本ミニカルテのサブメニューから自動ログイン
      </span>
      <input type="text" inputmode="numeric" v-model="loginId" placeholder="電子カルテの職員ID (1～5桁の数字)" />
      
      <template v-if="isRegistering">
        <input type="text" v-model="name" placeholder="名前" />
      </template>

      <input type="password" v-model="password" placeholder="パスワード" />
      <button @click="handleSubmit">{{ isRegistering ? '登録' : 'ログイン' }}</button>

      <template v-if="!isRegistering">
        <p class="caution-text">
          ※以下は接続設定情報です
        </p>
        <input type="text" v-model="ipAddress" placeholder="IPアドレス" />
        <input type="text" v-model="port" placeholder="ポート番号" />
      </template>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification";

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();
    const toast = useToast();
    const ipAddress = ref('192.168.100.37');
    const port = ref('3001');

    const name = ref('');
    const loginId = ref('');
    const password = ref('');
    const isRegistering = ref(false);

    onMounted(() => {
      const savedIp = localStorage.getItem('ipAddress');
      const savedPort = localStorage.getItem('port');
      if (savedIp) {
        ipAddress.value = savedIp;
      }
      if (savedPort) {
        port.value = savedPort;
      }
      const savedLoginId = localStorage.getItem('lastLoggedInId');
      if (savedLoginId) {
        loginId.value = savedLoginId;
      }
    });

    const toggleMode = () => {
      isRegistering.value = !isRegistering.value;
      name.value = '';
      password.value = '';
      // ログインIDはモード切替時にクリアしない方が便利な場合もあるため、そのままにする
    };

    const handleSubmit = async () => {
      try {
        // IPとPortはどちらの処理でも先に設定・保存
        store.dispatch('updateApiBaseUrl', { ip: ipAddress.value, port: port.value });
        localStorage.setItem('ipAddress', ipAddress.value);
        localStorage.setItem('port', port.value);

        if (isRegistering.value) { // 登録処理
          const success = await store.dispatch('register', { id: loginId.value, username: name.value, password: password.value });
          if (success) {
            toast.success(`ID「${loginId.value}」で登録が完了しました。ログインしてください。`);
            isRegistering.value = false;
            name.value = '';
            password.value = '';
          }
        } else { // ログイン処理
            const success = await store.dispatch('login', { id: loginId.value, password: password.value });
            if (success) {
              localStorage.setItem('lastLoggedInId', loginId.value);
              router.push('/');
            }
        }
      } catch (err) {
        toast.error(err.message || 'エラーが発生しました。');
      }
    };

    return {
      ipAddress,
      port,
      name,
      loginId,
      password,
      isRegistering,
      toggleMode,
      handleSubmit,
    };
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 96vh;
  background-color: #f0f2f5;
}
.login-form {
  width: 300px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
}
input {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
button {
  padding: 10px;
  border: none;
  background-color: #42b983;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;
}
button:hover {
  background-color: #36a374;
}
a {
  text-align: center;
  font-size: 0.9em;
}
.error-message {
  color: red;
  margin-bottom: 10px;
  text-align: center;
}
.caution-text {
  font-size: 0.8em;
  color: #666;
  text-align: center;
  margin-top: -5px;
  margin-bottom: 15px;
}
</style>