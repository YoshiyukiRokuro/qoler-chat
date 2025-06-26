import { createStore } from 'vuex'

export default createStore({
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
      state.messages[channelId].push(message)
    }
  },
  actions: {
    selectChannel({ commit }, channelId) {
      commit('setSelectedChannel', channelId)
    },
    async loadMessages({ commit }, channelId) {
      const messages = await window.api.getMessages(channelId);
      commit('setMessages', { channelId, messages });
    },
    async sendMessage({ commit, state }, text) {
      const messageData = {
        channelId: state.selectedChannelId,
        user: 'You', // ユーザー認証実装前は固定
        text: text,
      };
      const savedMessage = await window.api.addMessage(messageData);
      commit('addMessage', { channelId: state.selectedChannelId, message: savedMessage });
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || []
  }
})