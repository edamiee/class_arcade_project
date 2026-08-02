const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultFilename) => ipcRenderer.invoke('save-file', content, defaultFilename),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action))
});
