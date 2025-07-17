// src/preload.js

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  notify: (options) => ipcRenderer.send("notify-message", options),
  onAutoLoginRequest: (callback) => {
    ipcRenderer.on("auto-login-request", (_event, empId) => callback(empId));
  },
});
