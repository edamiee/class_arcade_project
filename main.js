const { app, BrowserWindow, nativeImage } = require('electron');
const path = require('path');

app.setName("Penelope's Learning Arcade");

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    title: "Penelope's Learning Arcade",
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  if (process.platform === 'darwin') {
    app.dock.setIcon(nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')));
  }
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
