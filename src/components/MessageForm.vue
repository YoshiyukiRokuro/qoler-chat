<template>
  <div class="message-form">
    <input
      type="text"
      v-model="newMessage"
      @keyup.enter="sendMessage"
      placeholder="メッセージを入力..."
    />
    <button @click="sendMessage">送信</button>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MessageForm',
  setup() {
    const store = useStore()
    const newMessage = ref('')

    const sendMessage = () => {
      if (newMessage.value.trim()) {
        store.dispatch('sendMessage', newMessage.value)
        newMessage.value = ''
      }
    }

    return {
      newMessage,
      sendMessage
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
}
input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
}
button {
  margin-left: 10px;
  padding: 10px 15px;
  border: none;
  background-color: #42b983;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}
button:hover {
  background-color: #36a374;
}
</style>