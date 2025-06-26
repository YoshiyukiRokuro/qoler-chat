// src/background.js (大幅に簡略化)
'use strict'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS3_DEVTOOLS } from 'electron-devtools-installer'
import path from 'path'
import sqlite3 from 'sqlite3'

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

let db;

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
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
      contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
      // preload.js を指定
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('ready', async () => {
  createDatabase(); // データベースを作成または接続
  if (isDevelopment && !process.env.IS_TEST) {
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createDatabase();
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