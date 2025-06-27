import { createStore } from "vuex";
import axios from "axios";

// WebSocketのためのaxiosインスタンスを作成
const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// 初期状態を定義する関数
const getInitialState = () => ({
  user: null,
  token: null,
  onlineUsers: [],
  channels: [],
  selectedChannelId: null,
  messages: {},
  unreadCounts: {},
  lastReadMessageIds: {},
  replyingToMessage: null, // 返信中のメッセージを保持する
  ws: null,
  apiBaseUrl: "",
});

// Vuexストアを作成
const store = createStore({
  state: getInitialState(),
  mutations: {
    // APIのベースURLを設定する
    setApiBaseUrl(state, baseUrl) {
      state.apiBaseUrl = baseUrl;
      apiClient.defaults.baseURL = baseUrl;
    },
    // 返信中のメッセージを設定する
    setReplyingTo(state, message) {
      state.replyingToMessage = message;
    },

    // 返信中のメッセージをクリアする
    clearReplyingTo(state) {
      state.replyingToMessage = null;
    },

    // ストアの状態をリセットする
    resetState(state) {
      const initial = getInitialState();
      const baseUrl = state.apiBaseUrl;
      Object.assign(state, initial);
      state.apiBaseUrl = baseUrl;
      apiClient.defaults.baseURL = baseUrl;
    },

    // チャンネルの状態を管理するためのミューテーション
    setChannels(state, channels) {
      state.channels = channels;
    },

    // チャンネルを追加する
    addChannel(state, channel) {
      if (!state.channels.some((c) => c.id === channel.id)) {
        state.channels.push(channel);
      }
    },

    // チャンネルを削除する
    removeChannel(state, channelId) {
      state.channels = state.channels.filter((c) => c.id !== channelId);
      if (state.selectedChannelId === channelId) {
        state.selectedChannelId =
          state.channels.length > 0 ? state.channels[0].id : null;
      }
    },

    // チャンネルを選択する
    setSelectedChannel(state, channelId) {
      state.selectedChannelId = channelId;
    },

    // メッセージの状態を管理するためのミューテーション
    setMessages(state, { channelId, messages }) {
      state.messages[channelId] = messages;
    },

    // メッセージを追加する
    addMessage(state, messageData) {
      const message = messageData.data;
      const { channelId } = message;
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      if (!state.messages[channelId].some((m) => m.id === message.id)) {
        state.messages[channelId].push(message);
      }
    },

    // メッセージを削除する
    removeMessage(state, { channelId, messageId }) {
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(
          (m) => m.id !== messageId
        );
      }
    },

    // ユーザーの状態を管理するためのミューテーション
    setUser(state, user) {
      state.user = user;
    },

    // トークンの状態を管理するためのミューテーション
    setToken(state, token) {
      state.token = token;
    },

    // WebSocketの状態を管理するためのミューテーション
    setWebSocket(state, ws) {
      state.ws = ws;
    },

    // オンラインユーザーの状態を管理するためのミューテーション
    setOnlineUsers(state, users) {
      state.onlineUsers = users;
    },

    // 未読メッセージ数の状態を管理するためのミューテーション
    setUnreadCount(state, { channelId, count }) {
      state.unreadCounts[channelId] = count;
    },

    // 全てのチャンネルの未読メッセージ数を設定する
    setAllUnreadCounts(state, counts) {
      state.unreadCounts = counts;
    },

    // 未読メッセージ数をクリアする
    clearUnreadCount(state, channelId) {
      state.unreadCounts[channelId] = 0;
    },

    // 未読メッセージ数をインクリメントする
    incrementUnreadCount(state, channelId) {
      if (state.selectedChannelId !== channelId) {
        if (!state.unreadCounts[channelId]) {
          state.unreadCounts[channelId] = 0;
        }
        state.unreadCounts[channelId]++;
      }
    },

    // 最後に読んだメッセージIDを設定する
    setLastReadMessageId(state, { channelId, messageId }) {
      state.lastReadMessageIds[channelId] = messageId;
    },
  },
  actions: {
    // 返信中のメッセージを設定する
    startReply({ commit }, message) {
      commit('setReplyingTo', message);
    },
    // 返信中のメッセージをクリアする
    cancelReply({ commit }) {
      commit('clearReplyingTo');
    },

    // APIのベースURLを更新する
    updateApiBaseUrl({ commit }, { ip, port }) {
      const baseUrl = `http://${ip}:${port}`;
      commit("setApiBaseUrl", baseUrl);
    },

    // アプリケーションの初期化
    async initializeApp({ dispatch }) {
      await dispatch("fetchChannels");
      dispatch("initializeWebSocket");
    },

    // WebSocketの初期化
    // 既に接続されている場合は何もしない
    initializeWebSocket({ commit, state }) {
      if (state.ws && state.ws.readyState === WebSocket.OPEN) {
        return;
      }
      if (!state.token || !state.apiBaseUrl) {
        return;
      }

      // WebSocketのURLをAPIのベースURLから生成
      const wsUrl = state.apiBaseUrl.replace(/^http/, "ws");

      // WebSocketのインスタンスを作成
      // トークンをクエリパラメータとして渡す
      const ws = new WebSocket(`${wsUrl}?token=${state.token}`);

      // 接続時の処理
      ws.onopen = () => {
        console.log("Connected to WebSocket server");
        commit("setWebSocket", ws);
      };
      // 切断時の処理
      ws.onclose = () => {
        console.log("Disconnected from WebSocket server");
        commit("setOnlineUsers", []);
        commit("setWebSocket", null);
      };
      // エラー発生時の処理
      ws.onerror = (err) => console.error("WebSocket Error:", err);

      // メッセージ受信時の処理
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "new_message") { // 新しいメッセージの通知
            commit("addMessage", payload);
            commit("incrementUnreadCount", payload.data.channelId);
            const message = payload.data;
            if (state.user && state.user.username !== message.user) {
              window.electronAPI.notify({
                title: `新しいメッセージ: ${message.user}`,
                body: message.text,
              });
            }
          } else if (payload.type === "message_deleted") { // メッセージ削除の通知
            Object.keys(state.messages).forEach((channelId) => {
              commit("removeMessage", {
                channelId: Number(channelId),
                messageId: payload.id,
              });
            });
          } else if (payload.type === "user_list_update") { // オンラインユーザーの更新
            commit("setOnlineUsers", payload.data);
          } else if (payload.type === "channel_created") { // チャンネル作成の通知
            commit("addChannel", payload.data);
          } else if (payload.type === "channel_deleted") { // チャンネル削除の通知
            commit("removeChannel", payload.id);
          }
        } catch (e) {
          console.error("Failed to parse message:", event.data, e);
        }
      };
    },

    // チャンネルの一覧を取得する
    // 成功した場合はチャンネルの配列をstateに保存する
    // 失敗した場合はエラーをスローする
    async fetchChannels({ commit, state }) {
      if (!state.token) return;
      try {
        const { data } = await apiClient.get("/channels", {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        commit("setChannels", data);
        if (state.selectedChannelId === null && data.length > 0) {
          commit("setSelectedChannel", data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch channels:", error);
      }
    },

    // チャンネルを作成する
    // channelNameは新しいチャンネルの名前
    // 成功した場合は何も返さない
    // 失敗した場合はエラーをスローする
    async createChannel({ state }, channelName) {
      try {
        await apiClient.post(
          "/channels",
          { name: channelName },
          {
            headers: { Authorization: `Bearer ${state.token}` },
          }
        );
      } catch (error) {
        console.error("Failed to create channel:", error);
        throw error;
      }
    },

    // チャンネルを削除する
    // channelIdは削除するチャンネルのID
    // 成功した場合は何も返さない
    // 失敗した場合はエラーをスローする
    async deleteChannel({ state }, channelId) {
      try {
        await apiClient.delete(`/channels/${channelId}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
      } catch (error) {
        console.error("Failed to delete channel:", error);
        throw error;
      }
    },

    // チャンネルを選択する
    async selectChannel({ commit, dispatch }, channelId) {
      commit("setSelectedChannel", channelId);
      await dispatch("loadMessages", channelId);
      await dispatch("fetchLastReadMessageId", channelId);
      dispatch("markChannelAsRead", channelId);
    },

    // メッセージをロードする
    // channelIdが指定されていない場合は何もしない
    async loadMessages({ commit, state }, channelId) {
      if (!channelId) return;
      try {
        const response = await apiClient.get(`/messages/${channelId}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        commit("setMessages", { channelId, messages: response.data });
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    },

    // ユーザー登録処理
    async register(_context, { username, password }) {
      try {
        await apiClient.post("/register", { username, password });
        return true;
      } catch (error) {
        const message = error.response?.data?.error || "登録に失敗しました。";
        throw new Error(message);
      }
    },

    // ログイン処理
    async login({ commit, dispatch }, { username, password }) {
      try {
        const { data } = await apiClient.post("/login", { username, password });
        commit("setUser", data.user);
        commit("setToken", data.token);
        await dispatch("initializeApp");
        return true;
      } catch (error) {
        const message =
          error.response?.data?.error || "ログインに失敗しました。";
        throw new Error(message);
      }
    },
    logout({ commit, state }) {
      if (state.ws) {
        state.ws.close();
      }
      commit("resetState");
    },
    async sendMessage({ state, commit }, text) {
        if (!state.user) {
          console.error("User not logged in.");
          return;
      }
      try {
        // 【修正】送信時に返信先のIDをstateから取得して含める
        const replyToId = state.replyingToMessage ? state.replyingToMessage.id : null;
        
        await apiClient.post(
          "/messages",
          {
            channelId: state.selectedChannelId,
            text: text, // userはバックエンドでトークンから取得するので不要
            replyToId: replyToId
          },
          {
            headers: { Authorization: `Bearer ${state.token}` },
          }
        );
        // 送信後に返信モードを解除
        commit('clearReplyingTo');
      } catch (error) {
        console.error("Failed to send message:", error);
      }

    },

    // メッセージを削除する
    // messageIdは削除するメッセージのID
    // 成功した場合は何も返さない
    // 失敗した場合はエラーをスローする
    // このメソッドは、指定されたメッセージIDのメッセージを
    // サーバーから削除します。
    // 成功した場合は、WebSocketを通じて
    // メッセージ削除の通知が送信されます。
    async deleteMessage({ state }, messageId) {
      try {
        await apiClient.delete(`/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
      } catch (error) {
        console.error("Failed to delete message:", error);
      }
    },

    // チャンネルを既読にする
    // channelIdは既読にするチャンネルのID
    // チャンネルの最後のメッセージIDを取得し、
    // それをサーバーに送信して既読状態を更新する
    // 成功した場合はstateの未読カウントをクリアする
    // 失敗した場合はエラーをスローする
    async markChannelAsRead({ state, commit }, channelId) {
      const messages = state.messages[channelId];
      if (messages && messages.length > 0) {
        const lastMessageId = messages[messages.length - 1].id;
        try {
          await apiClient.post(
            `/messages/${channelId}/read`,
            { lastMessageId },
            {
              headers: { Authorization: `Bearer ${state.token}` },
            }
          );
          commit("clearUnreadCount", channelId);
        } catch (error) {
          console.error("Failed to mark channel as read:", error);
        }
      }
    },

    // オンラインユーザーの一覧を取得する
    // 成功した場合はstateに保存する
    // 失敗した場合はエラーをスローする
    async fetchUnreadCounts({ commit, state }) {
      try {
        const { data } = await apiClient.get("/messages/unread-counts", {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        commit("setAllUnreadCounts", data);
      } catch (error) {
        console.error("Failed to fetch unread counts:", error);
      }
    },

    // 最後に読んだメッセージIDを取得する
    // channelIdはチャンネルのID
    // 成功した場合はstateに保存する
    // 失敗した場合はエラーをスローする
    // このメソッドは、チャンネルの最後に読んだメッセージIDを取得し、
    // stateのlastReadMessageIdsに保存します。
    // これにより、ユーザーがチャンネルを開いたときに
    // 最後に読んだメッセージを表示できるようになります。
    async fetchLastReadMessageId({ commit, state }, channelId) {
      try {
        const { data } = await apiClient.get(
          `/channels/${channelId}/last-read`,
          {
            headers: { Authorization: `Bearer ${state.token}` },
          }
        );
        commit("setLastReadMessageId", {
          channelId,
          messageId: data.last_read_message_id,
        });
      } catch (error) {
        console.error("Failed to fetch last read message id:", error);
      }
    },
  },

  // 状態の取得
  // 各状態の取得用のゲッターを定義
  // channels: チャンネルの一覧
  // selectedChannel: 現在選択されているチャンネル
  // messagesForSelectedChannel: 現在選択されているチャンネルのメッセージ一覧
  // isAuthenticated: ユーザーが認証されて        いるかどうか
  // currentUser: 現在のユーザー情報
  // onlineUsers: オンラインユーザーの一覧
  // unreadCounts: 各チャンネルの未読メッセージ数
  // lastReadMessageIdForSelectedChannel: 現在選択されているチャンネルの最後に読んだメッセージID
  // replyingToMessage: 返信中のメッセージ
  getters: {
    channels: (state) => state.channels,
    selectedChannel: (state) =>
      state.channels.find((c) => c.id === state.selectedChannelId),
    messagesForSelectedChannel: (state) =>
      state.messages[state.selectedChannelId] || [],
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    onlineUsers: (state) => state.onlineUsers,
    unreadCounts: (state) => state.unreadCounts,
    lastReadMessageIdForSelectedChannel: (state) => {
      return state.lastReadMessageIds[state.selectedChannelId];
    },
    replyingToMessage: (state) => state.replyingToMessage
  },
});

export default store;
