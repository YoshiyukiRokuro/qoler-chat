// src/preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  notify: (options) => ipcRenderer.send('notify-message', options),

  //【ここから追加】
  // メインプロセスからの自動ログイン要求を受け取るリスナーを登録する関数
  onAutoLoginRequest: (callback) => {
    ipcRenderer.on('auto-login-request', (_event, empId) => callback(empId));
  }
  //【ここまで追加】
});