import { createStore } from 'vuex'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://192.168.100.37:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    onlineUsers: [],
    channels: [
      { id: 1, name: 'general' },
      { id: 2, name: 'random' },
      { id: 3, name: 'vue' }
    ],
    selectedChannelId: 1,
    messages: {},
    unreadCounts: {},
    lastReadMessageIds: {}, // ★ 追加: チャンネルごとの最後に読んだメッセージIDを保持
  },
  mutations: {
    // ★ 追加: 最後に読んだメッセージIDをセットする
    setLastReadMessageId(state, { channelId, messageId }) {
      state.lastReadMessageIds[channelId] = messageId;
    },
    setUnreadCount(state, { channelId, count }) {
        state.unreadCounts[channelId] = count;
    },
    setAllUnreadCounts(state, counts) {
        state.unreadCounts = counts;
    },
    clearUnreadCount(state, channelId) {
        state.unreadCounts[channelId] = 0;
    },
    // 新しいメッセージが来た時に未読カウントを増やす
    incrementUnreadCount(state, channelId) {
        if (state.selectedChannelId !== channelId) {
            if (!state.unreadCounts[channelId]) {
                state.unreadCounts[channelId] = 0;
            }
            state.unreadCounts[channelId]++;
        }
    },
    
    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId
    },
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages
    },
    addMessage(state, messageData) {
      const message = messageData.data;
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = []
      }
      if (!state.messages[channelId].some(m => m.id === message.id)) {
        state.messages[channelId].push(message)
      }
    },
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
    },
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
    },
 },
  actions: {

    // ★ 追加: 最後に読んだメッセージIDを取得するアクション
    async fetchLastReadMessageId({ commit }, channelId) {
      try {
        const { data } = await apiClient.get(`/channels/${channelId}/last-read`);
        commit('setLastReadMessageId', { channelId, messageId: data.last_read_message_id });
      } catch (error) {
        console.error('Failed to fetch last read message id:', error);
      }
    },

    initializeWebSocket({ commit, state }) {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        return;
      }
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      const ws = new WebSocket(`ws://192.168.100.37:3000?token=${token}`);

      ws.onopen = () => console.log('Connected to WebSocket server');
      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        commit('setOnlineUsers', []);
      }
      ws.onerror = (err) => console.error('WebSocket Error:', err);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'new_message') {
            commit('addMessage', payload);
            commit('incrementUnreadCount', payload.data.channelId); // 未読カウントを増やす
            const message = payload.data;
            if (state.user && state.user.username !== message.user) {
              window.electronAPI.notify({
                title: `新しいメッセージ: ${message.user}`,
                body: message.text
              });
            }
          } else if (payload.type === 'message_deleted') {
            Object.keys(state.messages).forEach(channelId => {
              commit('removeMessage', { 
                channelId: Number(channelId), 
                messageId: payload.id 
              });
            });
          } else if (payload.type === 'user_list_update') {
            commit('setOnlineUsers', payload.data);
          }
        } catch (e) {
          console.error('Failed to parse message:', event.data, e);
        }
      };
    },

    // selectChannelアクションを更新
    async selectChannel({ commit, dispatch }, channelId) {
      commit('setSelectedChannel', channelId);
      await dispatch('loadMessages', channelId);
      // ★ 追加: 最後に読んだメッセージIDを取得するアクションを呼ぶ
      await dispatch('fetchLastReadMessageId', channelId);
      // チャンネルを既読にする処理は変更なし
      dispatch('markChannelAsRead', channelId);
    },

    // チャンネルのメッセージを既読にするアクション
    async markChannelAsRead({ state, commit }, channelId) {
        const messages = state.messages[channelId];
        if (messages && messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        try {
            await apiClient.post(`/messages/${channelId}/read`, { lastMessageId });
            commit('clearUnreadCount', channelId);
        } catch (error) {
            console.error('Failed to mark channel as read:', error);
        }
        }
    },
    // 未読メッセージ数をサーバーから取得するアクション
    async fetchUnreadCounts({ commit }) {
        try {
        const { data } = await apiClient.get('/messages/unread-counts');
        commit('setAllUnreadCounts', data);
        } catch (error) {
        console.error('Failed to fetch unread counts:', error);
        }
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
    async login({ commit, dispatch }, { username, password }) {
      try {
        const { data } = await apiClient.post('/login', { username, password });
        commit('setUser', { user: data.user, token: data.token });
        dispatch('initializeWebSocket');
        return true;
      } catch (error) {
        const message = error.response?.data?.error || 'ログインに失敗しました。';
        throw new Error(message);
      }
    },
    logout({ commit }) {
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
    async deleteMessage(_, messageId) {
      try {
        await apiClient.delete(`/messages/${messageId}`);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || [],
    isAuthenticated: state => !!state.token,
    currentUser: state => state.user,
    onlineUsers: state => state.onlineUsers,
    unreadCounts: state => state.unreadCounts,
    // ★ 追加: 選択中のチャンネルの最後に読んだメッセージIDを取得する
    lastReadMessageIdForSelectedChannel: (state) => {
      return state.lastReadMessageIds[state.selectedChannelId];
    },
  }
})

if (store.getters.isAuthenticated) {
  store.dispatch('initializeWebSocket');
}

export default store;