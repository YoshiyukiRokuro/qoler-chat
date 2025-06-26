import { createStore } from 'vuex'

// WebSocketクライアントのセットアップ
const ws = new WebSocket('ws://localhost:8081');

ws.onopen = () => {
  console.log('Connected to WebSocket server');
};

ws.onclose = () => {
  console.log('Disconnected from WebSocket server');
};

const store = createStore({
  state: {
    channels: [
      { id: 1, name: 'general' },
      { id: 2, name: 'random' },
      { id: 3, name: 'vue' }
    ],
    selectedChannelId: 1,
    messages: {}
  },
  mutations: {
    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId
    },
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages
    },
    addMessage(state, { channelId, message }) {
      if (!state.messages[channelId]) {
        state.messages[channelId] = []
      }
      // 重複を避ける
      if (!state.messages[channelId].some(m => m.id === message.id)) {
        state.messages[channelId].push(message)
      }
    }
  },
  actions: {
    // WebSocketサーバーからのメッセージをリッスンするアクション
    listenForMessages({ commit }) {
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        // 受け取ったメッセージをストアに追加
        commit('addMessage', { channelId: message.channelId, message });
      };
    },
    selectChannel({ commit, dispatch }, channelId) {
      commit('setSelectedChannel', channelId)
      dispatch('loadMessages', channelId)
    },
    async loadMessages({ commit }, channelId) {
      const messages = await window.api.getMessages(channelId);
      commit('setMessages', { channelId, messages });
    },
    async sendMessage({ state }, text) { // commitは不要なので削除
      const messageData = {
        channelId: state.selectedChannelId,
        user: 'You', // ユーザー認証実装前は固定
        text: text,
      };
      // addMessageを呼び出すだけで、メインプロセスがDB保存とブロードキャストを行う
      // ブロードキャストされたメッセージはonmessageで受信するので、ここでのcommitは不要
      await window.api.addMessage(messageData);
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || []
  }
})

// アプリケーション初期化時にメッセージの受信を開始
store.dispatch('listenForMessages');

export default store;