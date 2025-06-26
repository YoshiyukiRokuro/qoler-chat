<template>
  <div class="message-list-wrapper">
    <div class="message-list">
      <div class="header">
        <h2># {{ selectedChannel ? selectedChannel.name : '' }}</h2>
      </div>
      <div class="messages" ref="messageContainer">
        <div
          v-for="message in messages"
          :key="message.id"
          class="message-wrapper"
          :class="{ own: currentUser && message.user === currentUser.username }"
        >
          <div class="message">
            <div class="user-info">
              <strong>{{ message.user }}</strong>
              <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
              <button
                v-if="currentUser && message.user === currentUser.username"
                @click="requestDelete(message.id)"
                class="delete-button"
              >
                ×
              </button>
            </div>
            <p class="text">{{ message.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <ConfirmModal
      :show="showConfirmModal"
      title="メッセージの削除"
      message="本当にこのメッセージを削除しますか？"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />
  </div>
</template>

<script>
import { computed, ref, watch, nextTick } from 'vue'
import { useStore } from 'vuex'
import ConfirmModal from './ConfirmModal.vue'; // モーダルコンポーネントをインポート

export default {
  name: 'MessageList',
  components: {
    ConfirmModal
  },
  setup() {
    const store = useStore()
    const messageContainer = ref(null)
    const showConfirmModal = ref(false);
    const messageIdToDelete = ref(null);

    const selectedChannel = computed(() => store.getters.selectedChannel)
    const messages = computed(() => store.getters.messagesForSelectedChannel)
    const currentUser = computed(() => store.getters.currentUser)

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('ja-JP', { year: "numeric", month: "numeric", day: "numeric", hour: '2-digit', minute: '2-digit' })
    }

    // confirmの代わりにモーダルを開くメソッド
    const requestDelete = (messageId) => {
      messageIdToDelete.value = messageId;
      showConfirmModal.value = true;
    };

    // モーダルで「削除」が押されたときの処理
    const handleConfirmDelete = () => {
      if (messageIdToDelete.value) {
        store.dispatch('deleteMessage', messageIdToDelete.value);
      }
      handleCancelDelete(); // モーダルを閉じる
    };

    // モーダルで「キャンセル」が押された、または背景がクリックされたときの処理
    const handleCancelDelete = () => {
      showConfirmModal.value = false;
      messageIdToDelete.value = null;
    };

    watch(messages, async () => {
      await nextTick()
      const container = messageContainer.value
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }, { deep: true })


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
    }
  }
}
</script>

<style scoped>
.message-list-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative; /* モーダルの位置の基準にする */
  overflow: hidden; /* 追加 */
}

.message-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: hidden;
  background-color: #f0f2f5;
}
.header {
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
  text-align: center;
}
.messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
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
}

/* 自分のメッセージを右側に表示するためのスタイル */
.message-wrapper.own {
  justify-content: flex-end;
}
.message-wrapper.own .message {
  background-color: #dcf8c6;
}

/* 削除ボタンのスタイル */
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
</style>