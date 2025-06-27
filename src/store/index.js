import { createStore } from 'vuex';
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '', 
  headers: {
    'Content-Type': 'application/json',
  },
});

const getInitialState = () => ({
  user: null,
  token: null,
  onlineUsers: [],
  channels: [],
  selectedChannelId: null,
  messages: {},
  unreadCounts: {},
  lastReadMessageIds: {},
  ws: null,
  apiBaseUrl: '',
});

const store = createStore({
  state: getInitialState(),
  mutations: {
    setApiBaseUrl(state, baseUrl) {
      state.apiBaseUrl = baseUrl;
      apiClient.defaults.baseURL = baseUrl;
    },
    resetState(state) {
      const initial = getInitialState();
      const baseUrl = state.apiBaseUrl;
      Object.assign(state, initial);
      state.apiBaseUrl = baseUrl;
      apiClient.defaults.baseURL = baseUrl;
    },
    setChannels(state, channels) {
      state.channels = channels;
    },
    addChannel(state, channel) {
      if (!state.channels.some(c => c.id === channel.id)) {
        state.channels.push(channel);
      }
    },
    removeChannel(state, channelId) {
      state.channels = state.channels.filter(c => c.id !== channelId);
      if (state.selectedChannelId === channelId) {
        state.selectedChannelId = state.channels.length > 0 ? state.channels[0].id : null;
      }
    },
    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId;
    },
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages;
    },
    addMessage(state, messageData) {
      const message = messageData.data;
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      if (!state.messages[channelId].some(m => m.id === message.id)) {
        state.messages[channelId].push(message);
      }
    },
    removeMessage(state, { channelId, messageId }) {
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          (m) => m.id !== messageId
        );
      }
    },
    setUser(state, user) {
        state.user = user;
    },
    setToken(state, token) {
      state.token = token;
    },
    setWebSocket(state, ws) {
      state.ws = ws;
    },
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
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
    incrementUnreadCount(state, channelId) {
      if (state.selectedChannelId !== channelId) {
          if (!state.unreadCounts[channelId]) {
              state.unreadCounts[channelId] = 0;
          }
          state.unreadCounts[channelId]++;
      }
    },
    setLastReadMessageId(state, { channelId, messageId }) {
      state.lastReadMessageIds[channelId] = messageId;
    },
  },
  actions: {
    updateApiBaseUrl({ commit }, { ip, port }) {
      const baseUrl = `http://${ip}:${port}`;
      commit('setApiBaseUrl', baseUrl);
    },
    async initializeApp({ dispatch }) {
      await dispatch('fetchChannels');
      dispatch('initializeWebSocket');
    },
    initializeWebSocket({ commit, state }) {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        return;
      }
      if (!state.token || !state.apiBaseUrl) {
        return;
      }
      const wsUrl = state.apiBaseUrl.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsUrl}?token=${state.token}`);

      ws.onopen = () => {
        console.log('Connected to WebSocket server');
        commit('setWebSocket', ws);
      };

      ws.onclose = () => {
        console.log('Disconnected from WebSocket server');
        commit('setOnlineUsers', []);
        commit('setWebSocket', null);
      };

      ws.onerror = (err) => console.error('WebSocket Error:', err);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          
          if (payload.type === 'new_message') {
            commit('addMessage', payload);
            commit('incrementUnreadCount', payload.data.channelId);
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
          } else if (payload.type === 'channel_created') {
            commit('addChannel', payload.data);
          } else if (payload.type === 'channel_deleted') {
            commit('removeChannel', payload.id);
          }
        } catch (e) {
          console.error('Failed to parse message:', event.data, e);
        }
      };
    },
    async fetchChannels({ commit, state }) {
      if (!state.token) return;
      try {
        const { data } = await apiClient.get('/channels', {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setChannels', data);
        if (state.selectedChannelId === null && data.length > 0) {
          commit('setSelectedChannel', data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    },
    async createChannel({ state }, channelName) {
      try {
        await apiClient.post('/channels', { name: channelName }, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
      } catch (error) {
        console.error('Failed to create channel:', error);
        throw error;
      }
    },
    async deleteChannel({ state }, channelId) {
      try {
        await apiClient.delete(`/channels/${channelId}`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
      } catch (error) {
        console.error('Failed to delete channel:', error);
        throw error;
      }
    },
    async selectChannel({ commit, dispatch }, channelId) {
        commit('setSelectedChannel', channelId);
        await dispatch('loadMessages', channelId);
        await dispatch('fetchLastReadMessageId', channelId);
        dispatch('markChannelAsRead', channelId);
    },
    async loadMessages({ commit, state }, channelId) {
      if (!channelId) return;
      try {
        const response = await apiClient.get(`/messages/${channelId}`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
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
        commit('setUser', data.user);
        commit('setToken', data.token);
        await dispatch('initializeApp');
        return true;
      } catch (error) {
        const message = error.response?.data?.error || 'ログインに失敗しました。';
        throw new Error(message);
      }
    },
    logout({ commit, state }) {
      if (state.ws) {
        state.ws.close();
      }
      commit('resetState');
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
        }, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    async deleteMessage({state}, messageId) {
      try {
        await apiClient.delete(`/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    },
    async markChannelAsRead({ state, commit }, channelId) {
      const messages = state.messages[channelId];
      if (messages && messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        try {
          await apiClient.post(`/messages/${channelId}/read`, { lastMessageId }, {
            headers: { Authorization: `Bearer ${state.token}` }
          });
          commit('clearUnreadCount', channelId);
        } catch (error) {
          console.error('Failed to mark channel as read:', error);
        }
      }
    },
    async fetchUnreadCounts({ commit, state }) {
      try {
        const { data } = await apiClient.get('/messages/unread-counts', {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setAllUnreadCounts', data);
      } catch (error) {
        console.error('Failed to fetch unread counts:', error);
      }
    },
    async fetchLastReadMessageId({ commit, state }, channelId) {
      try {
        const { data } = await apiClient.get(`/channels/${channelId}/last-read`, {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        commit('setLastReadMessageId', { channelId, messageId: data.last_read_message_id });
      } catch (error) {
        console.error('Failed to fetch last read message id:', error);
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
    lastReadMessageIdForSelectedChannel: (state) => {
      return state.lastReadMessageIds[state.selectedChannelId];
    },
  }
});

export default store;