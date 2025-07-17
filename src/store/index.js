import { createStore } from "vuex";
import axios from "axios";
import { useToast } from "vue-toastification";

const toast = useToast();

const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

const getInitialState = () => ({
  user: null,
  token: null,
  onlineUsers: [],
  channels: [],
  selectedChannelId: null,
  previousChannelId: null,
  messages: {},
  unreadCounts: {},
  lastReadMessageIds: {},
  replyingToMessage: null,
  ws: null,
  apiBaseUrl: "",
  allUsers: [],
  channelMembers: {},
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
      delete apiClient.defaults.headers.common["Authorization"];
    },
    setToken(state, token) {
      state.token = token;
      if (token) {
        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        delete apiClient.defaults.headers.common["Authorization"];
      }
    },
    setChannels(state, channels) {
      state.channels = channels;
    },
    addChannel(state, channel) {
      if (!state.channels.some((c) => c.id === channel.id)) {
        state.channels.push(channel);
        state.channels.sort((a, b) => a.id - b.id);
      }
    },
    removeChannel(state, channelId) {
      state.channels = state.channels.filter((c) => c.id !== channelId);
      if (state.selectedChannelId === channelId) {
        state.selectedChannelId =
          state.channels.length > 0 ? state.channels[0].id : null;
      }
    },
    setSelectedChannel(state, channelId) {
      if (state.selectedChannelId !== channelId) {
        state.previousChannelId = state.selectedChannelId;
      }
      state.selectedChannelId = channelId;
    },
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages;
    },
    addMessage(state, messageData) {
      const message = messageData.data || messageData;
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      if (!state.messages[channelId].some((m) => m.id === message.id)) {
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
    setWebSocket(state, ws) {
      state.ws = ws;
    },
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
    },
    setAllUnreadCounts(state, counts) {
      state.unreadCounts = counts;
    },
    incrementUnreadCount(state, channelId) {
      if (state.selectedChannelId !== channelId) {
        if (!state.unreadCounts[channelId]) {
          state.unreadCounts[channelId] = 0;
        }
        state.unreadCounts[channelId]++;
      }
    },
    clearUnreadCount(state, channelId) {
      state.unreadCounts[channelId] = 0;
    },
    setLastReadMessageId(state, { channelId, messageId }) {
      state.lastReadMessageIds[channelId] = messageId;
    },
    setReplyingTo(state, message) {
      state.replyingToMessage = message;
    },
    clearReplyingTo(state) {
      state.replyingToMessage = null;
    },
    setAllUsers(state, users) {
      state.allUsers = users;
    },
    setChannelMembers(state, { channelId, members }) {
      state.channelMembers = { ...state.channelMembers, [channelId]: members };
    },
    updateChannel(state, channelData) {
      const channel = state.channels.find((c) => c.id === channelData.id);
      if (channel) {
        Object.assign(channel, channelData);
      }
    },
  },
  actions: {
    updateApiBaseUrl({ commit }, { ip, port }) {
      const baseUrl = `http://${ip}:${port}`;
      commit("setApiBaseUrl", baseUrl);
    },
    async initializeApp({ dispatch }) {
      await dispatch("fetchChannels");
      dispatch("initializeWebSocket");
      await dispatch("fetchAllUsers");
      await dispatch("fetchUnreadCounts");
    },
    initializeWebSocket({ commit, state, dispatch }) {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) return;
      if (!state.token || !state.apiBaseUrl) return;
      const wsUrl = state.apiBaseUrl.replace(/^http/, "ws");
      const ws = new WebSocket(`${wsUrl}?token=${state.token}`);
      ws.onopen = () => commit("setWebSocket", ws);
      ws.onclose = () => {
        commit("setOnlineUsers", []);
        commit("setWebSocket", null);
      };
      ws.onerror = (err) => console.error("WebSocket Error:", err);
      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        switch (payload.type) {
          case "new_message":
            commit("addMessage", payload);
            commit("incrementUnreadCount", payload.data.channelId);
            if (state.user && state.user.username !== payload.data.user) {
              window.electronAPI.notify({
                title: `新しいメッセージ: ${payload.data.user}`,
                body: payload.data.text,
              });
            }
            break;
          case "message_deleted":
            Object.keys(state.messages).forEach((channelId) =>
              commit("removeMessage", {
                channelId: Number(channelId),
                messageId: payload.id,
              })
            );
            break;
          case "user_list_update":
            commit("setOnlineUsers", payload.data);
            break;
          case "channel_created":
            commit("addChannel", payload.data);
            break;
          case "channel_deleted":
            commit("removeChannel", payload.id);
            break;
          case "channel_updated":
            commit("updateChannel", payload.data);
            break;
          case "members_updated":
            if (state.selectedChannelId === payload.data.channelId) {
              dispatch("fetchChannelMembers", payload.data.channelId);
            }
            break;
          case "refetch_channels":
            toast.info("グループ情報が更新されました。");
            dispatch("fetchChannels");
            break;
        }
      };
    },
    async fetchChannels({ commit, state }) {
      try {
        const { data } = await apiClient.get("/channels");
        commit("setChannels", data);
        if (state.selectedChannelId === null && data.length > 0) {
          commit("setSelectedChannel", data[0].id);
        }
      } catch (error) {
        toast.error("チャンネルの取得に失敗しました。");
      }
    },
    async createChannel(_, channelName) {
      await apiClient.post("/channels", { name: channelName });
    },
    async deleteChannel(_, channelId) {
      await apiClient.delete(`/channels/${channelId}`);
    },
    async selectChannel({ commit, dispatch, getters, state }, channelId) {
      // stateを引数に追加
      // チャンネルを切り替える前に、以前表示していたチャンネルを既読にする
      if (state.previousChannelId) {
        await dispatch("markChannelAsRead", state.previousChannelId);
      }
      commit("setSelectedChannel", channelId);
      await dispatch("loadMessages", channelId);
      const selected = getters.selectedChannel;
      if (selected && selected.is_group) {
        dispatch("fetchChannelMembers", channelId);
      }
    },
    async loadMessages({ commit }, channelId) {
      if (!channelId) return;
      try {
        const { data } = await apiClient.get(`/messages/${channelId}`);
        commit("setMessages", { channelId, messages: data });
      } catch (error) {
        if (error.response?.status !== 403) {
          toast.error("メッセージの読み込みに失敗しました。");
        }
      }
    },
    async register(_, { id, username, password }) {
      try {
        await apiClient.post("/register", { id, username, password });
        return true;
      } catch (error) {
        throw new Error(error.response?.data?.error || "登録に失敗しました。");
      }
    },
    async login({ commit, dispatch }, { id, password }) {
      try {
        const { data } = await apiClient.post("/login", { id, password });
        commit("setUser", data.user);
        commit("setToken", data.token);
        await dispatch("initializeApp");
        return true;
      } catch (error) {
        throw new Error(
          error.response?.data?.error || "ログインに失敗しました。"
        );
      }
    },
    async autoLogin({ commit, dispatch }, { id }) {
      try {
        const { data } = await apiClient.post("/login/auto", { id });
        commit("setUser", data.user);
        commit("setToken", data.token);
        await dispatch("initializeApp");
        return true;
      } catch (error) {
        return false;
      }
    },
    logout({ commit, state }) {
      if (state.ws) state.ws.close();
      commit("resetState");
    },
    async sendMessage({ state, commit }, text) {
      try {
        const replyToId = state.replyingToMessage
          ? state.replyingToMessage.id
          : null;
        await apiClient.post("/messages", {
          channelId: state.selectedChannelId,
          text,
          replyToId,
        });
        commit("clearReplyingTo");
      } catch (error) {
        toast.error("メッセージの送信に失敗しました。");
      }
    },
    async deleteMessage(_, messageId) {
      try {
        await apiClient.delete(`/messages/${messageId}`);
      } catch (error) {
        toast.error("メッセージの削除に失敗しました。");
      }
    },
    async markChannelAsRead({ state, commit }, channelId) {
      try {
        const messages = state.messages[channelId];
        if (!messages || messages.length === 0) return;
        const lastMessageId = messages[messages.length - 1].id;
        console.log(
          `Marking channel ${channelId} as read up to message ${lastMessageId}`
        );
        await apiClient.post(`/messages/${channelId}/read`, { lastMessageId });
        commit("clearUnreadCount", channelId);
        commit("setLastReadMessageId", { channelId, messageId: lastMessageId });
      } catch (error) {
        console.error(`Failed to mark channel ${channelId} as read:`, error);
      }
    },
    async fetchUnreadCounts({ commit }) {
      try {
        const { data } = await apiClient.get("/messages/unread-counts");
        commit("setAllUnreadCounts", data);
      } catch (error) {
        /* Do nothing */
      }
    },
    startReply({ commit }, message) {
      commit("setReplyingTo", message);
    },
    cancelReply({ commit }) {
      commit("clearReplyingTo");
    },
    async fetchAllUsers({ commit }) {
      try {
        const { data } = await apiClient.get("/users");
        commit("setAllUsers", data);
      } catch (error) {
        /* Do nothing */
      }
    },
    async createGroupChannel(_, { name, memberIds }) {
      await apiClient.post("/channels/group", { name, memberIds });
    },
    async updateChannelName(_, { channelId, name }) {
      await apiClient.put(`/channels/${channelId}/name`, { name });
    },
    async fetchChannelMembers({ commit }, channelId) {
      try {
        const { data } = await apiClient.get(`/channels/${channelId}/members`);
        commit("setChannelMembers", { channelId, members: data });
      } catch (error) {
        /* Do nothing */
      }
    },
    async addMembersToChannel(_, { channelId, userIds }) {
      await apiClient.post(`/channels/${channelId}/members`, { userIds });
    },
    async removeMembersFromChannel(_, { channelId, userIds }) {
      await apiClient.delete(`/channels/${channelId}/members`, {
        data: { userIds },
      });
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    channels: (state) => state.channels,
    selectedChannel: (state) =>
      state.channels.find((c) => c.id === state.selectedChannelId),
    messagesForSelectedChannel: (state) =>
      state.messages[state.selectedChannelId] || [],
    currentUser: (state) => state.user,
    onlineUsers: (state) => state.onlineUsers,
    unreadCounts: (state) => state.unreadCounts,
    replyingToMessage: (state) => state.replyingToMessage,
    publicChannels: (state) => state.channels.filter((c) => !c.is_group),
    groupChannels: (state) => state.channels.filter((c) => c.is_group),
    allUsers: (state) => state.allUsers,
    membersForSelectedChannel: (state) =>
      state.channelMembers[state.selectedChannelId] || [],
  },
  lastReadMessageIdForSelectedChannel: (state) =>
    state.lastReadMessageIds[state.selectedChannelId],
});

export default store;
