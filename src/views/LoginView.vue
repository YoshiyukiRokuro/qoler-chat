<template>
  <div class="login-container">
    <div class="login-form">
      <h2>{{ isRegistering ? 'ユーザー登録' : 'クオラチャットログイン' }}</h2>

      <a href="#" @click.prevent="toggleMode">
        {{ isRegistering ? 'ログイン画面へ' : '新しいアカウントを作成' }}
      </a>
      <br>
      <input type="text" v-model="username" placeholder="ユーザー名" />
      <input type="password" v-model="password" placeholder="パスワード" />
      <button @click="handleSubmit">{{ isRegistering ? '登録' : 'ログイン' }}</button>

      <template v-if="!isRegistering">
        <p class="caution-text">
          ※以下は初回起動時以外は変更する必要無し<br>
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
    const ipAddress = ref('');
    const port = ref('3000');
    const username = ref('');
    const password = ref('');
    const isRegistering = ref(false);

    // コンポーネント表示時にlocalStorageから各種情報を読み込む
    onMounted(() => {
      // IPアドレスを読み込む
      const savedIp = localStorage.getItem('ipAddress');
      if (savedIp) {
        ipAddress.value = savedIp;
      }
      // ポート番号を読み込む
      const savedPort = localStorage.getItem('port');
      if (savedPort) {
        port.value = savedPort;
      }
      // ユーザー名を読み込む
      const savedUsername = localStorage.getItem('lastLoggedInUser');
      if (savedUsername) {
        username.value = savedUsername;
      }
    });

    const toggleMode = () => {
      isRegistering.value = !isRegistering.value;
    };

    const handleSubmit = async () => {
      try {
        if (!isRegistering.value) {
            store.dispatch('updateApiBaseUrl', { ip: ipAddress.value, port: port.value });
            // IPアドレスとポート番号をlocalStorageに保存
            localStorage.setItem('ipAddress', ipAddress.value);
            localStorage.setItem('port', port.value);
        }

        let success = false;
        if (isRegistering.value) {
          success = await store.dispatch('register', { username: username.value, password: password.value });
          if (success) {
            toast.success("登録が完了しました。ログインしてください。");
            isRegistering.value = false;
          }
        } else {
          success = await store.dispatch('login', { username: username.value, password: password.value });
          if (success) {
            // ログイン成功時にユーザー名をlocalStorageへ保存
            localStorage.setItem('lastLoggedInUser', username.value);
          }
        }
        
        if (success && !isRegistering.value) {
          router.push('/');
        }
      } catch (err) {
        toast.error(err.message || 'エラーが発生しました。');
      }
    };

    return {
      ipAddress,
      port,
      username,
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