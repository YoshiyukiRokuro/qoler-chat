'use strict'

import { app, protocol, BrowserWindow, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import sqlite3 from 'sqlite3'
import { WebSocketServer } from 'ws' // wsをインポート

const isDevelopment = process.env.NODE_ENV !== 'production'

// WebSocketサーバーをポート8080で起動
const wss = new WebSocketServer({ port: 8081 });

// 接続されたクライアントを管理
wss.on('connection', ws => {
  console.log('Client connected');

  // クライアントが切断したときの処理
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// 全クライアントにメッセージをブロードキャストする関数
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let db;
let win; // ウィンドウオブジェクトをグローバルで保持

function createDatabase() {
  const dbPath = isDevelopment
    ? path.join(__dirname, '../database.sqlite')
    : path.join(app.getPath('userData'), 'database.sqlite');

  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Database opening error: ', err);
    }
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channelId INTEGER,
        user TEXT,
        text TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  createDatabase(); // データベースを作成または接続
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow();
})

// メッセージ取得
ipcMain.handle('get-messages', async (event, channelId) => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM messages WHERE channelId = ? ORDER BY timestamp ASC', [channelId], (err, rows) => {
      if (err) {
        reject(err);
      }
      resolve(rows);
    });
  });
});

// メッセージ追加
ipcMain.handle('add-message', async (event, { channelId, user, text }) => {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO messages (channelId, user, text) VALUES (?, ?, ?)', [channelId, user, text], function(err) {
      if (err) {
        reject(err);
      }
      // 保存したメッセージを返す
      db.get('SELECT * FROM messages WHERE id = ?', [this.lastID], (err, row) => {
        if (err) {
          reject(err);
        }
        // DBに保存後、全クライアントにブロードキャスト
        broadcast(row);
        resolve(row);
      });
    });
  });
});

// Exit cleanly on request from parent process in development mode.
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
