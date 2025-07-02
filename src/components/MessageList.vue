<template>
  <div class="message-list-wrapper">
    <div class="message-list" ref="messageContainer">
      <div v-if="messages.length" class="messages-inner">
        <div class="header">
          <h2># {{ selectedChannel ? selectedChannel.name : '' }}</h2>
        </div>
        <div class="messages" ref="messageContainer">
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
        <p>メッセージはまだありません。</p>
        <p>最初のメッセージを送信しましょう！</p>
      </div>
    </div>
        <button v-if="showScrollToBottomButton" @click="scrollToBottom" class="scroll-to-bottom-button">
      ▼
    </button>

    <ConfirmModal :show="showConfirmModal" title="メッセージの削除" message="本当にこのメッセージを削除しますか？" @confirm="handleConfirmDelete" @cancel="handleCancelDelete" />
  </div>
</template>

<script>
import { computed, ref, watch, nextTick, onMounted, onUnmounted, onDeactivated } from 'vue';
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
    const highlightedMessageId = ref(null); // ★ ハイライト用のIDを保持
    const showScrollToBottomButton = ref(false); // ★ ボタン表示用の状態を追加

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
      // Vue の DOM 更新を待つ
      await nextTick();

      // ブラウザの描画サイクルに処理を委ねるため setTimeout を使用
      setTimeout(() => {
        const container = messageContainer.value;
        if (!container) return;

        // デバッグ用ログ
        console.log('コンテナの状態 (setTimeout内):', {
          scrollHeight: container.scrollHeight,
          clientHeight: container.clientHeight,
          firstUnreadIndex: firstUnreadIndex.value,
        });

        // 未読メッセージがある場合
        if (firstUnreadIndex.value !== -1) {
          const separator = container.querySelector('.unread-separator');
          if (separator) {
            // 未読セパレータへスクロール
            container.scrollTop = separator.offsetTop - 20;
            return;
          }
        }

        // それ以外は一番下へスクロール
        container.scrollTop = container.scrollHeight;
      }, 0); // 0ミリ秒の遅延で、イベントキューの最後に処理を配置

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
    // ★ 返信元のメッセージにスクロールする関数を追加
    const scrollToMessage = (messageId) => {
      const targetElement = document.querySelector(`[data-message-id='${messageId}']`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // ハイライト処理
        highlightedMessageId.value = messageId;
        setTimeout(() => {
          highlightedMessageId.value = null;
        }, 1500); // 1.5秒後にハイライトを解除
      }
    };
    // ★ 一番下にスクロールする関数を追加
    const scrollToBottom = () => {
      const container = messageContainer.value;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }
    };

    // ★ スクロールイベントを処理する関数を追加
    const handleScroll = () => {
      const container = messageContainer.value;
      if (container) {
        const threshold = 200; // ボタンを表示するスクロール位置の閾値
        const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > threshold;
        showScrollToBottomButton.value = isScrolledUp;
      }
    };
    
    // ★ コンポーネントがマウントされたらイベントリスナーを追加
    onMounted(() => {
      const container = messageContainer.value;
      if (container) {
        container.addEventListener('scroll', handleScroll);
      }
    });

    // ★ コンポーネントが破棄される前にイベントリスナーを削除
    onUnmounted(() => {
      const container = messageContainer.value;
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    });

    // ★ コンポーネントが非アクティブになった際にもリスナーを削除
    onDeactivated(() => {
        const container = messageContainer.value;
        if (container) {
            container.removeEventListener('scroll', handleScroll);
        }
    });

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
      renderMessageText,
      scrollToMessage,
      highlightedMessageId,
      showScrollToBottomButton, // ★ return に追加
      scrollToBottom,           // ★ return に追加
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

.message-wrapper.highlight .message {
  transition: background-color 0.5s ease-out;
  background-color: #fff0b3; /* ハイライトの色 */
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
  font-size: 0.9em;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 10;
  transition: opacity 0.3s ease;
}

.scroll-to-bottom-button:hover {
  background-color: rgba(54, 163, 116, 1);
}

</style>