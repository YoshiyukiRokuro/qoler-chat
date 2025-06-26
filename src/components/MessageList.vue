<template>
  <div class="message-list">
    <div class="header">
      <h2># {{ selectedChannel ? selectedChannel.name : '' }}</h2>
    </div>
    <div class="messages" ref="messageContainer">
      <div
        v-for="message in messages"
        :key="message.id"
        class="message-wrapper"
        :class="{ own: message.user === 'You' }"
      >
        <div class="message">
          <div class="user-info">
            <strong>{{ message.user }}</strong>
            <span class="timestamp">{{ formatTimestamp(message.timestamp) }}</span>
          </div>
          <p class="text">{{ message.text }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, watch, nextTick } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MessageList',
  setup() {
    const store = useStore()
    const messageContainer = ref(null)

    const selectedChannel = computed(() => store.getters.selectedChannel)
    const messages = computed(() => store.getters.messagesForSelectedChannel)

    const formatTimestamp = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      return date.toLocaleTimeString('ja-JP', { year: "numeric", month: "numeric", day: "numeric", hour: '2-digit', minute: '2-digit' })
    }

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
      formatTimestamp
    }
  }
}
</script>

<style scoped>
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
</style>