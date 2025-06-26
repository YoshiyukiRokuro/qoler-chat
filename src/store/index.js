// src/store/index.js
import { createStore } from 'vuex'
import axios from 'axios'

// axiosのベースURLを設定
const apiClient = axios.create({
  baseURL: 'http://192.168.100.37:3000', // サーバーのアドレス
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプターを追加
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

const store = createStore({
  state: {
    // localStorageからユーザー情報とトークンを復元
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    onlineUsers: [], // onlineUsersを追加
    channels: [
      { id: 1, name: 'general' },
      { id: 2, name: 'random' },
      { id: 3, name: 'vue' }
    ],
    selectedChannelId: 1,
    messages: {}
  },
  mutations: {
    // setOnlineUsersミューテーションを追加
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
    },

    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId
    },
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages
    },
    addMessage(state, messageData) {
      const message = messageData.data; // new_messageイベントのdataプロパティ
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = []
      }
      if (!state.messages[channelId].some(m => m.id === message.id)) {
        state.messages[channelId].push(message)
      }
    },
    // メッセージ削除用のミューテーション
    removeMessage(state, { channelId, messageId }) {
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          (m) => m.id !== messageId
        );
      }
    },
    setUser(state, { user, token }) {
      state.user = user;
      state.token = token;
      if (user && token) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
      } else {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
 },
  actions: {
    // --- initializeWebSocketアクションを修正 ---
    initializeWebSocket({ commit, state }) {
      // 接続済みの場合は何もしない
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        return; // トークンがなければ接続しない
      }
      
      // サーバーにトークンを渡して接続
      const ws = new WebSocket(`ws://192.168.100.37:3000?token=${token}`);

      ws.onopen = () => console.log('Connected to WebSocket server');
      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        commit('setOnlineUsers', []); // 切断されたらリストを空にする
      }
      ws.onerror = (err) => console.error('WebSocket Error:', err);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'new_message') {
            commit('addMessage', payload);
          } else if (payload.type === 'message_deleted') {
            Object.keys(state.messages).forEach(channelId => {
              commit('removeMessage', { 
                channelId: Number(channelId), 
                messageId: payload.id 
              });
            });
          } else if (payload.type === 'user_list_update') { // --- [4] user_list_updateを処理 ---
            commit('setOnlineUsers', payload.data);
          }
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

    async register(_context, { username, password }) {
      try {
        await apiClient.post('/register', { username, password });
        return true;
      } catch (error) {
        const message = error.response?.data?.error || '登録に失敗しました。';
        throw new Error(message);
      }
    },

    // --- ログイン成功時にWebSocketを初期化 ---
    async login({ commit, dispatch }, { username, password }) { // dispatchを追加
      try {
        const { data } = await apiClient.post('/login', { username, password });
        commit('setUser', { user: data.user, token: data.token });
        dispatch('initializeWebSocket'); // ログイン後に接続開始
        return true;
      } catch (error) {
        const message = error.response?.data?.error || 'ログインに失敗しました。';
        throw new Error(message);
      }
    },

    logout({ commit }) {
      // ユーザー情報とトークンをクリア
      commit('setUser', { user: null, token: null });
    },

    async sendMessage({ state }, text) {
      if (!state.user) {
        console.error('User not logged in.');
        return;
      }
      try {
        await apiClient.post('/messages', {
          channelId: state.selectedChannelId,
          user: state.user.username,
          text: text,
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    
    // メッセージ削除アクション
    async deleteMessage(_, messageId) {
      try {
        await apiClient.delete(`/messages/${messageId}`);
        // 成功した場合、ローカルのstateからの削除はWebSocket経由で行われる
      } catch (error) {
        console.error('Failed to delete message:', error);
        // 必要であれば、ここでエラー通知を行う
        // 例: toast.error('メッセージの削除に失敗しました。');
      }
    }
  },
  getters: {
    onlineUsers: state => state.onlineUsers, // --- onlineUsersのゲッターを追加 ---
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || [],
    // トークンの有無で認証状態を判断
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
  }
})

// アプリケーション起動時に、ログイン済みであればWebSocketを初期化
if (store.getters.isAuthenticated) {
  store.dispatch('initializeWebSocket');
}

export default store;