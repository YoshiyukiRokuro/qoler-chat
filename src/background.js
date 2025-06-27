import { app, protocol, BrowserWindow, ipcMain, Notification } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
const path = require('path')
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let win // win変数をグローバルスコープで宣言

// レンダラープロセスから通知の要求を受け取る
ipcMain.on('notify-message', (event, options) => {

  const notification = new Notification({
    title: options.title,
    body: options.body,
    silent: false // 通知音を鳴らす
  })

  // 通知クリック時のイベントハンドラを追加
  notification.on('click', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  notification.show()
})

async function createWindow() {
  // win変数にBrowserWindowインスタンスを代入
  win = new BrowserWindow({
    width: 800,
    height: 800,
    title: 'クオラチャット', // ウィンドウタイトルを変更
    maximizable: true,
    autoHideMenuBar: true,
    webPreferences: {
      // preloadスクリプトを有効にし、プロセス間通信を安全に行います
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
}

// アプリケーションのイベントリスナーを設定
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// macOSでは、すべてのウィンドウが閉じられたときにアプリケーションを終了しない
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})


// アプリケーションが準備完了時にウィンドウを作成
// isDevelopmentフラグがtrueの場合、Vue Devtoolsをインストールします
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}