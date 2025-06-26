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
    user: JSON.parse(localStorage.getItem('user')) || null, // ローカルストレージからユーザー情報を復元
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
    },
    setUser(state, user) {
      state.user = user;
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        localStorage.removeItem('user');
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

    // registerアクションの引数を再度修正
    async register(_context, { username, password }) {
      try {
        await apiClient.post('/register', { username, password });
        alert('登録が完了しました。ログインしてください。');
        return true;
      } catch (error) {
        const message = error.response?.data?.error || '登録に失敗しました。';
        throw new Error(message);
      }
    },

    async login({ commit }, { username, password }) {
      try {
        const { data } = await apiClient.post('/login', { username, password });
        commit('setUser', data.user);
        return true;
      } catch (error) {
        const message = error.response?.data?.error || 'ログインに失敗しました。';
        throw new Error(message);
      }
    },

    logout({ commit }) {
      commit('setUser', null);
    },

    async sendMessage({ state }, text) {
      if (!state.user) {
        console.error('User not logged in.');
        return;
      }
      try {
        await apiClient.post('/messages', {
          channelId: state.selectedChannelId,
          user: state.user.username, // ログインユーザー名を使用
          text: text,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || [],
    isAuthenticated: state => !!state.user,
    currentUser: state => state.user,

  }
})

// ストア作成時にWebSocketの初期化アクションをディスパッチ
store.dispatch('initializeWebSocket');

export default store;