const { contextBridge, ipcRenderer } = require('electron');

// レンダラープロセス（Vueアプリ）の 'window' オブジェクトに
// 安全に 'electronAPI' というグローバル変数を公開します。
contextBridge.exposeInMainWorld('electronAPI', {
  // 'notify'という名前で、メインプロセスに 'notify-message' という
  // メッセージを送信する関数を公開します。
  notify: (options) => ipcRenderer.send('notify-message', options)
});
