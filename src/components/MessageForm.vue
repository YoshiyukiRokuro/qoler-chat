<template>
  <div class="message-form">
    <textarea
      v-model="newMessage"
      @keydown.enter.exact.prevent="sendMessage"
      placeholder="メッセージを入力... (Shift+Enterで改行)"
      rows="1"
      ref="textarea"
      @input="autoResize"
    ></textarea>
    <button @click="sendMessage">送信</button>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MessageForm',
  setup() {
    const store = useStore()
    const newMessage = ref('')
    const textarea = ref(null)

    const sendMessage = () => {
      if (newMessage.value.trim()) {
        store.dispatch('sendMessage', newMessage.value)
        newMessage.value = ''
        // 送信後に高さをリセット
        nextTick(() => {
          if(textarea.value) {
            textarea.value.style.height = 'auto';
          }
        });
      }
    }

    // 入力内容に応じてテキストエリアの高さを自動調整する
    const autoResize = () => {
      if (textarea.value) {
        textarea.value.style.height = 'auto';
        textarea.value.style.height = textarea.value.scrollHeight + 'px';
      }
    }

    return {
      newMessage,
      sendMessage,
      textarea,
      autoResize
    }
  }
}
</script>

<style scoped>
.message-form {
  display: flex;
  padding: 15px;
  border-top: 1px solid #ddd;
  background-color: #f9f9f9;
  align-items: flex-start; /* ボタンとテキストエリアの縦位置を揃える */
}
textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: none; /* ユーザーによるリサイズを無効化 */
  overflow-y: auto;
  min-height: 22px; /* 1行の時の高さ */
  max-height: 120px; /* 最大の高さを制限 */
  line-height: 1.5;
  font-family: inherit;
  font-size: inherit;
}
button {
  margin-left: 10px;
  padding: 10px 15px;
  border: none;
  background-color: #42b983;
  color: white;
  border-radius: 5px;
  cursor: pointer;
  align-self: flex-end; /* ボタンを一番下に配置 */
}
button:hover {
  background-color: #36a374;
}
</style>