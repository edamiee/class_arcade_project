const { app, BrowserWindow, nativeImage, Menu, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

app.setName("Penelope's Learning Arcade");

const isMac = process.platform === 'darwin';

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    title: "Penelope's Learning Arcade",
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  win.loadFile('index.html');
  return win;
}

function sendMenuAction(action) {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
  if (win) win.webContents.send('menu-action', action);
}

const menuTemplate = [
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { label: 'Check for Updates…', click: () => autoUpdater.checkForUpdatesAndNotify() },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  {
    label: 'File',
    submenu: [
      { label: 'Export Entire Bank…', click: () => sendMenuAction('export-bank') },
      { label: 'Export Selected Course…', click: () => sendMenuAction('export-course') },
      { label: 'Import…', click: () => sendMenuAction('import') },
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'selectAll' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  isMac
    ? { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }] }
    : { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'close' }] },
  {
    label: 'Help',
    submenu: [
      ...(isMac ? [] : [{ label: 'Check for Updates…', click: () => autoUpdater.checkForUpdatesAndNotify() }])
    ]
  }
];

ipcMain.handle('save-file', async (event, content, defaultFilename) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    defaultPath: defaultFilename,
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'Markdown', extensions: ['md'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (canceled || !filePath) return { canceled: true };
  fs.writeFileSync(filePath, content, 'utf-8');
  return { canceled: false, filePath };
});

ipcMain.handle('open-file', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  if (canceled || !filePaths || !filePaths[0]) return { canceled: true };
  const content = fs.readFileSync(filePaths[0], 'utf-8');
  return { canceled: false, filePath: filePaths[0], content: content };
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  if (isMac) {
    app.dock.setIcon(nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')));
  }
  createWindow();
  autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (!isMac) app.quit();
});
