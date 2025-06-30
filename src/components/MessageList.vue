<template>
  <div class="message-list-wrapper">
    <div class="message-list">
      <div v-if="messages.length" class="messages-inner">
        <div class="header">
          <h2># {{ selectedChannel ? selectedChannel.name : '' }}</h2>
        </div>
        <div class="messages" ref="messageContainer">
          <template v-for="(message, index) in messages" :key="message.id">
            <div v-if="index === firstUnreadIndex" class="unread-separator">
              <span>ここから未読</span>
            </div>
            <div class="message-wrapper" :class="{ own: currentUser && message.user === currentUser.username }">
              <div class="message">
                <div v-if="message.replyToId" class="reply-context">
                  <small>↪ <strong>{{ message.repliedToUser }}</strong> への返信</small>
                  <p class="reply-text">{{ message.repliedToText }}</p>
                </div>
                <div class="user-info">
                  <strong>{{ message.user }}</strong>
                  <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
                  <button @click="startReply(message)" class="reply-button" title="リプライ">↪</button>
                  <button v-if="currentUser && message.user === currentUser.username" @click="requestDelete(message.id)" class="delete-button">
                    ×
                  </button>
                </div>
                <p class="text" v-html="renderMessageText(message.text)"></p>
              </div>
            </div>
          </template>
        </div>
      </div>
      <div v-else class="no-messages">
        <p>メッセージはまだありません。</p>
        <p>最初のメッセージを送信しましょう！</p>
      </div>
    </div>
    <ConfirmModal :show="showConfirmModal" title="メッセージの削除" message="本当にこのメッセージを削除しますか？" @confirm="handleConfirmDelete" @cancel="handleCancelDelete" />
  </div>
</template>

<script>
import { computed, ref, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import ConfirmModal from './ConfirmModal.vue';

export default {
  name: 'MessageList',
  components: {
    ConfirmModal
  },
  setup() {
    const store = useStore();
    const messageContainer = ref(null);
    const showConfirmModal = ref(false);
    const messageIdToDelete = ref(null);

    const selectedChannel = computed(() => store.getters.selectedChannel);
    const messages = computed(() => store.getters.messagesForSelectedChannel);
    const currentUser = computed(() => store.getters.currentUser);
    const lastReadMessageId = computed(() => store.getters.lastReadMessageIdForSelectedChannel);

    const firstUnreadIndex = computed(() => {
      if (!lastReadMessageId.value || messages.value.length === 0) {
        return -1;
      }
      const lastReadIndex = messages.value.findIndex(m => m.id === lastReadMessageId.value);
      if (lastReadIndex === -1 || lastReadIndex === messages.value.length - 1) {
        return -1;
      }
      return lastReadIndex + 1;
    });

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      return date.toLocaleTimeString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };
    
    const startReply = (message) => {
      store.dispatch('startReply', message);
    };

    const requestDelete = (messageId) => {
      messageIdToDelete.value = messageId;
      showConfirmModal.value = true;
    };

    const handleConfirmDelete = () => {
      if (messageIdToDelete.value) {
        store.dispatch('deleteMessage', messageIdToDelete.value);
      }
      handleCancelDelete();
    };

    const handleCancelDelete = () => {
      showConfirmModal.value = false;
      messageIdToDelete.value = null;
    };

    watch(messages, async () => {
      await nextTick();
      const container = messageContainer.value;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, { deep: true });

    const renderMessageText = (text) => {
      // HTTP/HTTPS URLを検出
      let newText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

      // \\から始まる共有フォルダパスを検出（例: \\server\share\folder）
      newText = newText.replace(/(\\?(\\[^\\\s]+){2,})/g, (match) => {
        // file://プロトコルを使用してローカルパスとしてリンク
        return `<a href="file:///${match.replace(/\\/g, '/')}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      });

      // C:から始まる内部ドライブパスを検出（例: C:\path\to\file）
      newText = newText.replace(/([A-Za-z]:\\[^:\n\r\t"]*)/g, (match) => {
        // file://プロトコルを使用してローカルパスとしてリンク
        return `<a href="file:///${match.replace(/\\/g, '/')}" target="_blank" rel="noopener noreferrer">${match}</a>`;
      });
      
      return newText;
    };

    return {
      selectedChannel,
      messages,
      messageContainer,
      formatTimestamp,
      currentUser,
      requestDelete,
      showConfirmModal,
      handleConfirmDelete,
      handleCancelDelete,
      firstUnreadIndex,
      startReply,
      renderMessageText
    };
  }
};
</script>

<style scoped>
.unread-separator {
  text-align: center;
  margin: 10px 0;
  border-top: 1px solid #e04040;
  position: relative;
}

.unread-separator span {
  background-color: #f0f2f5;
  color: #e04040;
  padding: 0 10px;
  position: relative;
  top: -11px;
  font-size: 0.8em;
  font-weight: bold;
}

.message-list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  background-color: #f0f2f5;
}

.messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
  text-align: center;
}

.message-wrapper {
  display: flex;
  margin-bottom: 15px;
}

.message {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 12px;
  background-color: #ffffff;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
}

.user-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

strong {
  font-weight: bold;
}

.timestamp {
  font-size: 0.75em;
  color: #999;
  margin-left: 10px;
}

.text {
  margin: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size:1.2em;
}

.message-wrapper.own {
  justify-content: flex-end;
}

.message-wrapper.own .message {
  background-color: #dcf8c6;
}

.delete-button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2em;
  line-height: 1;
  padding: 0 5px;
}

.delete-button:hover {
  color: #f00;
}

.no-messages {
  text-align: center;
  margin: auto;
  color: #888;
}

.reply-button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2em;
  padding: 0 5px;
  margin-left: 5px;
}
.reply-button:hover {
  color: #42b983;
}

.reply-context {
  background-color: #e8e8e8;
  border-left: 3px solid #42b983;
  padding: 5px 8px;
  margin: -5px -10px 8px -10px;
  border-radius: 4px;
  font-size: 0.9em;
}

.message-wrapper.own .reply-context {
  background-color: #d0efc1;
}

.reply-text {
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #555;
}
</style>