<template>
  <div class="login-container">
    <div class="login-form">
      <h2>{{ isRegistering ? 'ユーザー登録' : 'ログイン' }}</h2>
      <input type="text" v-model="username" placeholder="ユーザー名" />
      <input type="password" v-model="password" placeholder="パスワード" />
      <button @click="handleSubmit">{{ isRegistering ? '登録' : 'ログイン' }}</button>
      <a href="#" @click.prevent="toggleMode">
        {{ isRegistering ? 'ログイン画面へ' : '新しいアカウントを作成' }}
      </a>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from "vue-toastification"; // --- [1] useToastをインポート

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();
    const toast = useToast(); // --- [2] toastインスタンスを取得
    const username = ref('');
    const password = ref('');
    const isRegistering = ref(false);
    // error refは不要になります
    // const error = ref(null);

    const toggleMode = () => {
      isRegistering.value = !isRegistering.value;
      // error.value = null;
    };

    const handleSubmit = async () => {
      // error.value = null;
      try {
        let success = false;

        if (isRegistering.value) {
          success = await store.dispatch('register', { username: username.value, password: password.value });
          if (success) {
            // --- [3] 成功時のトースト表示 ---
            toast.success("登録が完了しました。ログインしてください。");
            isRegistering.value = false; // ログインモードに切り替え
          }
        } else {
          success = await store.dispatch('login', { username: username.value, password: password.value });
        }
        
        if (success && !isRegistering.value) {
          router.push('/');
        }
      } catch (err) {
        // --- [4] エラー時のトースト表示 ---
        // error.value = err.message || 'エラーが発生しました。';
        toast.error(err.message || 'エラーが発生しました。');
      }
    };

    return {
      username,
      password,
      isRegistering,
      // error, // 不要
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
  height: 100vh;
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
</style>