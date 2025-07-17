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
import ChannelList from "../components/ChannelList.vue";
import MessageList from "../components/MessageList.vue";
import MessageForm from "../components/MessageForm.vue";
import { useStore } from "vuex";
import { ref, onMounted } from "vue";

export default {
  name: "ChatView",
  components: {
    ChannelList,
    MessageList,
    MessageForm,
  },
  setup() {
    const store = useStore();
    const isReady = ref(false);

    onMounted(async () => {
      if (store.getters.isAuthenticated) {
        await store.dispatch("initializeApp"); 
        isReady.value = true;

        if (store.state.selectedChannelId) {
          store.dispatch("loadMessages", store.state.selectedChannelId);
        }
      } else {
        // 未認証の場合は何もしないか、ログインページにリダイレクト
        isReady.value = true; // この場合も表示は行う
      }
    });
    return {
      isReady,
    };
  },
};
</script>

<style>
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

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  font-size: 1.2em;
  color: #888;
}

</style>