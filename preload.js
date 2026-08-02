const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveFile: (content, defaultFilename) => ipcRenderer.invoke('save-file', content, defaultFilename),
  openFile: () => ipcRenderer.invoke('open-file'),
  onMenuAction: (callback) => ipcRenderer.on('menu-action', (event, action) => callback(action))
});
