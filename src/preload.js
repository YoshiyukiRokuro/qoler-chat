const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getMessages: (channelId) => ipcRenderer.invoke('get-messages', channelId),
  addMessage: (message) => ipcRenderer.invoke('add-message', message),
});