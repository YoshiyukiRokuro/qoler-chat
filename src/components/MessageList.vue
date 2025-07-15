<template>
  <div class="message-list-wrapper">
    <div class="message-list" ref="messageContainer">
      <div v-if="selectedChannel" class="messages-inner">
        <div class="header">
          <h2># {{ selectedChannel.name }}</h2>
          <div v-if="selectedChannel.is_group" class="header-actions">
            <button @click="showManageGroupModal = true" class="manage-group-button">
              グループ設定
            </button>
          </div>
        </div>
        <div v-if="messages.length === 0" class="no-messages-prompt">
          <div class="prompt-content">
            <h3>#{{ selectedChannel.name }} へようこそ！</h3>
            <p>このチャンネルにはまだメッセージがありません。</p>
            <p>最初のメッセージを投稿してみましょう！👇</p>
          </div>
        </div>
        <div class="messages">
          <template v-for="(message, index) in messages" :key="message.id">
            <div v-if="index === firstUnreadIndex" class="unread-separator">
              <span>ここから未読</span>
            </div>
            <div
              class="message-wrapper"
              :data-message-id="message.id"
              :class="{ 
                own: currentUser && message.user === currentUser.username,
                highlight: message.id === highlightedMessageId
              }"
            >
              <div class="message">
                <div v-if="message.replyToId" class="reply-context" @click="scrollToMessage(message.replyToId)">
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
        <p>チャンネルを選択してください。</p>
      </div>
    </div>
    <button v-if="showScrollToBottomButton" @click="scrollToBottom" class="scroll-to-bottom-button">
      ▼
    </button>
    
    <ConfirmModal 
      :show="showConfirmModal" 
      title="メッセージの削除" 
      message="本当にこのメッセージを削除しますか？この操作は取り消せません。" 
      @confirm="handleConfirmDelete" 
      @cancel="handleCancelDelete" 
    />
    
    <ManageGroupModal
      :show="showManageGroupModal"
      :channelId="selectedChannelId"
      @close="showManageGroupModal = false"
    />
  </div>
</template>

<script>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import ManageGroupModal from './ManageGroupModal.vue';
import ConfirmModal from './ConfirmModal.vue';

export default {
  name: 'MessageList',
  components: {
    ManageGroupModal,
    ConfirmModal,
  },
  setup() {
    const store = useStore();
    const messageContainer = ref(null);
    const highlightedMessageId = ref(null);
    const showScrollToBottomButton = ref(false);
    const showManageGroupModal = ref(false);
    const showConfirmModal = ref(false);
    const messageIdToDelete = ref(null);

    const selectedChannelId = computed(() => store.state.selectedChannelId);
    const selectedChannel = computed(() => store.getters.selectedChannel);
    const messages = computed(() => store.getters.messagesForSelectedChannel);
    const currentUser = computed(() => store.getters.currentUser);
    const lastReadMessageId = computed(() => store.getters.lastReadMessageIdForSelectedChannel);

    const firstUnreadIndex = computed(() => {
      if (!lastReadMessageId.value || messages.value.length === 0) return -1;
      const lastReadIndex = messages.value.findIndex(m => m.id === lastReadMessageId.value);
      return (lastReadIndex === -1 || lastReadIndex === messages.value.length - 1) ? -1 : lastReadIndex + 1;
    });

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    };
    
    const startReply = (message) => store.dispatch('startReply', message);

    const requestDelete = (messageId) => {
      messageIdToDelete.value = messageId;
      showConfirmModal.value = true;
    };

    const handleConfirmDelete = () => {
      if (messageIdToDelete.value) {
        store.dispatch('deleteMessage', messageIdToDelete.value);
      }
      showConfirmModal.value = false;
      messageIdToDelete.value = null;
    };

    const handleCancelDelete = () => {
      showConfirmModal.value = false;
      messageIdToDelete.value = null;
    };
    
    const scrollToBottom = (behavior = 'auto') => {
        nextTick(() => {
            const el = messageContainer.value;
            if(el) {
                el.scrollTo({ top: el.scrollHeight, behavior });
            }
        });
    };
    
    watch(messages, () => {
      setTimeout(() => scrollToBottom(), 0);
    }, { deep: true });

    watch(() => store.state.selectedChannelId, () => {
        scrollToBottom();
    })

    const renderMessageText = (text) => {
      let newText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
      newText = newText.replace(/(\\\\[^\\\s]+(\\[^\\\s]+)+)/g, '<a href="file:///$&" target="_blank">$&</a>');
      return newText;
    };

    const scrollToMessage = (messageId) => {
      const target = document.querySelector(`[data-message-id='${messageId}']`);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlightedMessageId.value = messageId;
        setTimeout(() => { highlightedMessageId.value = null; }, 1500);
      }
    };

    const handleScroll = () => {
        const el = messageContainer.value;
        if(el) {
            showScrollToBottomButton.value = el.scrollHeight - el.scrollTop - el.clientHeight > 200;
        }
    };

    onMounted(() => messageContainer.value?.addEventListener('scroll', handleScroll));
    onUnmounted(() => messageContainer.value?.removeEventListener('scroll', handleScroll));

    return {
      selectedChannel,
      selectedChannelId,
      messages,
      messageContainer,
      formatTimestamp,
      currentUser,
      requestDelete,
      firstUnreadIndex,
      startReply,
      renderMessageText,
      scrollToMessage,
      highlightedMessageId,
      showScrollToBottomButton,
      scrollToBottom,
      showManageGroupModal,
      showConfirmModal,
      handleConfirmDelete,
      handleCancelDelete
    };
  }
};
</script>

<style scoped>
/* スタイルは変更なし */

.no-messages-prompt {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  color: #888;
  padding: 20px;
}
.prompt-content {
  border: 2px dashed #ddd;
  padding: 30px 40px;
  border-radius: 10px;
}
.prompt-content h3 {
  margin-top: 0;
  color: #555;
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
.messages-inner {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
.messages {
  flex: 1;
  padding: 15px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
}
h2 {
  margin: 0;
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
.timestamp {
  font-size: 0.75em;
  color: #999;
  margin-left: 10px;
}
.text {
  margin: 0;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 1.2em;
}
.message-wrapper.own {
  justify-content: flex-end;
}
.message-wrapper.own .message {
  background-color: #dcf8c6;
}
.delete-button,
.reply-button {
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 1.2em;
}
.no-messages {
  text-align: center;
  margin: auto;
  color: #888;
}
.reply-context {
  background-color: #e8e8e8;
  border-left: 3px solid #42b983;
  padding: 5px 8px;
  margin: -5px -10px 8px -10px;
  border-radius: 4px;
  font-size: 0.9em;
  cursor: pointer;
}
.reply-text {
  margin: 2px 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #555;
}
.highlight .message {
  background-color: #fff0b3;
}
.scroll-to-bottom-button {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: rgba(66, 185, 131, 0.8);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
}
.manage-group-button {
  padding: 4px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}
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
</style>