<template>
  <div class="message-form-container">
    <div v-if="showEmojiPicker" class="emoji-picker-wrapper">
      <EmojiPicker :native="true" @select="onSelectEmoji" />
    </div>

    <div class="message-form">
      <button class="emoji-button" @click="toggleEmojiPicker">😀</button>
      <textarea
        v-model="newMessage"
        @keydown.enter.exact.prevent="sendMessage"
        placeholder="メッセージを入力... (Shift+Enterで改行)"
        rows="1"
        ref="textarea"
        @input="autoResize"
      ></textarea>
      <button @click="sendMessage" class="send-button">送信</button>
    </div>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue';
import { useStore } from 'vuex';
//【追加】絵文字ピッカーをインポート
import EmojiPicker from 'vue3-emoji-picker';
//【追加】絵文字ピッカーのスタイルシートをインポート
import 'vue3-emoji-picker/css';

export default {
  name: 'MessageForm',
  components: {
    EmojiPicker //【追加】
  },
  setup() {
    const store = useStore();
    const newMessage = ref('');
    const textarea = ref(null);
    const showEmojiPicker = ref(false); //【追加】

    const sendMessage = () => {
      if (newMessage.value.trim()) {
        store.dispatch('sendMessage', newMessage.value);
        newMessage.value = '';
        showEmojiPicker.value = false; // 送信後にピッカーを閉じる
        nextTick(() => {
          if(textarea.value) {
            textarea.value.style.height = 'auto';
          }
        });
      }
    };

    const autoResize = () => {
      if (textarea.value) {
        textarea.value.style.height = 'auto';
        textarea.value.style.height = textarea.value.scrollHeight + 'px';
      }
    };

    //【ここから追加】
    const toggleEmojiPicker = () => {
      showEmojiPicker.value = !showEmojiPicker.value;
    };

    const onSelectEmoji = (emoji) => {
      const textareaEl = textarea.value;
      if (!textareaEl) return;

      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      const text = newMessage.value;

      // カーソル位置に絵文字を挿入
      newMessage.value = text.substring(0, start) + emoji.i + text.substring(end);

      // 絵文字挿入後にカーソル位置を更新
      nextTick(() => {
        textareaEl.selectionStart = textareaEl.selectionEnd = start + emoji.i.length;
        textareaEl.focus();
        autoResize(); // 高さを再計算
      });
    };
    //【ここまで追加】

    return {
      newMessage,
      sendMessage,
      textarea,
      autoResize,
      showEmojiPicker,    //【追加】
      toggleEmojiPicker,  //【追加】
      onSelectEmoji,      //【追加】
    };
  }
}
</script>

<style scoped>
.message-form-container {
  position: relative; /* 絵文字ピッカーの位置の基準点 */
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 60px; /* message-formの高さに応じて調整 */
  left: 10px;
  z-index: 10;
}

.message-form {
  display: flex;
  padding: 10px 15px;
  border-top: 1px solid #ddd;
  background-color: #f9f9f9;
  align-items: flex-end; 
}

textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 18px; /* 角を丸く */
  resize: none;
  overflow-y: auto;
  min-height: 22px; 
  max-height: 120px; 
  line-height: 1.5;
  font-family: inherit;
  font-size: inherit;
  margin: 0 10px;
}

.emoji-button, .send-button {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 42px; /* textareaの初期高さに合わせる */
}

.emoji-button {
  background-color: transparent;
  font-size: 1.5em;
  padding: 0 5px;
}

.send-button {
  background-color: #42b983;
  color: white;
  font-weight: bold;
}
.send-button:hover {
  background-color: #36a374;
}
</style>