import { createStore } from 'vuex'

export default createStore({
  state: {
    channels: [
      { id: 1, name: 'general' },
      { id: 2, name: 'random' },
      { id: 3, name: 'vue' }
    ],
    selectedChannelId: 1,
    messages: {
      1: [
        { id: 1, text: 'generalチャンネルへようこそ！', user: 'Admin' }
      ],
      2: [
        { id: 2, text: 'randomチャンネルへようこそ！', user: 'Admin' }
      ],
      3: [
        { id: 3, text: 'Vueチャンネルへようこそ！', user: 'Admin' }
      ]
    }
  },
  mutations: {
    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId
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
    sendMessage({ commit, state }, text) {
      const message = {
        id: Date.now(),
        text: text,
        user: 'You' // 簡単のためユーザーは固定
      }
      commit('addMessage', { channelId: state.selectedChannelId, message })
    }
  },
  getters: {
    channels: state => state.channels,
    selectedChannel: state => state.channels.find(c => c.id === state.selectedChannelId),
    messagesForSelectedChannel: state => state.messages[state.selectedChannelId] || []
  }
})