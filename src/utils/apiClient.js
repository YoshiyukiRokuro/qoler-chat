// src/utils/apiClient.js

import axios from "axios";
import store from "../store"; // Vuexストアをインポート

const apiClient = axios.create({
  baseURL: "",
});

// リクエストインターセプターを設定
apiClient.interceptors.request.use(
  (config) => {
    // リクエストが送信される直前にストアからトークンを取得
    const token = store.state.token;
    if (token) {
      // トークンがあれば、Authorizationヘッダーに付与
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
