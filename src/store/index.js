// src/store/index.js
import { createStore } from 'vuex'
import axios from 'axios' // axiosをインポート

// axiosのベースURLを設定
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // サーバーのアドレス
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    addMessage(state, message) {
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = []
      }
      if (!state.messages[channelId].some(m => m.id === message.id)) {
        state.messages[channelId].push(message)
      }
    }
  },
  actions: {
    initializeWebSocket({ commit }) {
      const ws = new WebSocket('ws://localhost:3000'); // サーバーのアドレス:ポート

      ws.onopen = () => console.log('Connected to WebSocket server');
      ws.onclose = () => console.log('Disconnected from WebSocket server');
      ws.onerror = (err) => console.error('WebSocket Error:', err);

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          commit('addMessage', message);
        } catch (e) {
          console.error('Failed to parse message:', event.data, e);
        }
      };
    },
    selectChannel({ commit, dispatch }, channelId) {
      commit('setSelectedChannel', channelId)
      dispatch('loadMessages', channelId)
    },
    async loadMessages({ commit }, channelId) {
      try {
        const response = await apiClient.get(`/messages/${channelId}`);
        commit('setMessages', { channelId, messages: response.data });
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    },
    async sendMessage({ state }, text) {
      try {
        await apiClient.post('/messages', {
          channelId: state.selectedChannelId,
          user: 'You', // TODO: ユーザー認証で動的に
          text: text,
        });
        // メッセージ送信後の処理はWebSocketに任せるため、ここでは何もしない
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || []
  }
})

// ストア作成時にWebSocketの初期化アクションをディスパッチ
store.dispatch('initializeWebSocket');

export default store;