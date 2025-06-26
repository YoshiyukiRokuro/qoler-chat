<template>
  <div class="message-list">
    <div class="header">
      <h2># {{ selectedChannel ? selectedChannel.name : '' }}</h2>
    </div>
    <div class="messages" ref="messageContainer">
      <div v-for="message in messages" :key="message.id" class="message">
        <strong>{{ message.user }}:</strong> {{ message.text }}
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
      messageContainer
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
}
.header {
  padding: 15px;
  border-bottom: 1px solid #ddd;
  background-color: #fff;
}
.messages {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  background-color: #fff;
}
.message {
  margin-bottom: 10px;
}
</style>