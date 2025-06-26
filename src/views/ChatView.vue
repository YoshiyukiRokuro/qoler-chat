<template>
  <div id="chat-container">
    <ChannelList />
    <div class="chat-area">
      <MessageList />
      <MessageForm />
    </div>
  </div>
</template>

<script>
import ChannelList from '../components/ChannelList.vue'
import MessageList from '../components/MessageList.vue'
import MessageForm from '../components/MessageForm.vue'
import { useStore } from 'vuex'
import { onMounted } from 'vue'

export default {
  name: 'ChatView',
  components: {
    ChannelList,
    MessageList,
    MessageForm
  },
  setup() {
    const store = useStore();
    onMounted(() => {
      if (store.state.selectedChannelId) {
        store.dispatch('loadMessages', store.state.selectedChannelId);
      }
    });
  }
}
</script>

<style>
/* App.vueからスタイルを移動 */
#chat-container {
  display: flex;
  height: 100%;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>