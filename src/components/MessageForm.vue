<template>
  <div class="message-form-container">
    <div v-if="replyingToMessage" class="replying-to-banner">
      <span><strong>{{ replyingToMessage.user }}</strong> へ返信中...</span>
      <button @click="cancelReply" class="cancel-reply-button">×</button>
    </div>

    <div v-if="showEmojiPicker" class="emoji-picker-wrapper">
      <EmojiPicker :native="true" @select="onSelectEmoji" />
    </div>

    <div class="message-form">
      <button class="emoji-button" @click="toggleEmojiPicker">😀</button>
      <textarea v-model="newMessage" @keydown.enter.exact.prevent="sendMessage" placeholder="メッセージを入力... (Shift+Enterで改行)" rows="1" ref="textarea" @input="autoResize"></textarea>
      <button @click="sendMessage" class="send-button">送信</button>
    </div>
  </div>
</template>

<script>
import { ref, nextTick, computed } from "vue";
import { useStore } from "vuex";
import EmojiPicker from "vue3-emoji-picker";
import "vue3-emoji-picker/css";

export default {
  name: "MessageForm",
  components: {
    EmojiPicker,
  },
  setup() {
    const store = useStore();
    const newMessage = ref("");
    const textarea = ref(null);
    const showEmojiPicker = ref(false);

    const replyingToMessage = computed(() => store.getters.replyingToMessage);

    const cancelReply = () => {
      store.dispatch("cancelReply");
    };

    const sendMessage = () => {
      if (newMessage.value.trim()) {
        store.dispatch("sendMessage", newMessage.value);
        newMessage.value = "";
        showEmojiPicker.value = false;
        nextTick(() => {
          if (textarea.value) {
            textarea.value.style.height = "auto";
            textarea.value.focus();
          }
        });
      }
    };

    const autoResize = () => {
      if (textarea.value) {
        textarea.value.style.height = "auto";
        textarea.value.style.height = textarea.value.scrollHeight + "px";
      }
    };

    const toggleEmojiPicker = () => {
      showEmojiPicker.value = !showEmojiPicker.value;
    };

    const onSelectEmoji = (emoji) => {
      const textareaEl = textarea.value;
      if (!textareaEl) return;

      const start = textareaEl.selectionStart;
      const end = textareaEl.selectionEnd;
      const text = newMessage.value;

      newMessage.value =
        text.substring(0, start) + emoji.i + text.substring(end);

      nextTick(() => {
        textareaEl.selectionStart = textareaEl.selectionEnd =
          start + emoji.i.length;
        textareaEl.focus();
        autoResize();
      });
    };

    return {
      newMessage,
      sendMessage,
      textarea,
      autoResize,
      showEmojiPicker,
      toggleEmojiPicker,
      onSelectEmoji,
      replyingToMessage,
      cancelReply,
    };
  },
};

</script>

<style scoped>
.message-form-container {
  position: relative;
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 60px;
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
  border-radius: 18px;
  resize: none;
  overflow-y: auto;
  min-height: 22px;
  max-height: 120px;
  line-height: 1.5;
  font-family: inherit;
  font-size: inherit;
  margin: 0 10px;
}

.emoji-button,
.send-button {
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  height: 42px;
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

.replying-to-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 15px;
  background-color: #e8e9eb;
  font-size: 0.9em;
  border-top: 1px solid #ddd;
}

.cancel-reply-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 5px;
  color: #666;
}

.cancel-reply-button:hover {
  color: #000;
}

</style>