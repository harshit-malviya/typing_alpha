const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const USER_DATA_FILE = 'user-progress.json';

function getProgressFilePath() {
  const userDataDir = app.getPath('userData');
  return path.join(userDataDir, USER_DATA_FILE);
}

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  const mainWindow = new BrowserWindow({
    width: 1380,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#0f172a',
    title: 'TypingAlpha — English Touch-Typing Trainer',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDevFlag = process.argv.includes('--dev');
  const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const distIndex = path.join(__dirname, '..', 'dist', 'index.html');

  if (isDevFlag || !fs.existsSync(distIndex)) {
    mainWindow.loadURL(devServerUrl).catch(() => {
      if (fs.existsSync(distIndex)) {
        mainWindow.loadFile(distIndex);
      }
    });
  } else {
    mainWindow.loadFile(distIndex);
  }
}

// Persistent Disk Storage IPC Handlers (%APPDATA%/typing-alpha/user-progress.json)
ipcMain.handle('storage:load', async () => {
  try {
    const filePath = getProgressFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(raw);
    }
    return null;
  } catch (err) {
    console.error('Failed to load progress file from disk:', err);
    return null;
  }
});

ipcMain.handle('storage:save', async (_event, data) => {
  try {
    const filePath = getProgressFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempPath, filePath);
    return { ok: true, path: filePath };
  } catch (err) {
    console.error('Failed to save progress file to disk:', err);
    return { ok: false, error: String(err) };
  }
});

ipcMain.handle('storage:getPath', async () => {
  return getProgressFilePath();
});

ipcMain.handle('file:openText', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open Custom Text File for Typing Practice',
    filters: [
      { name: 'Text & Code Files', extensions: ['txt', 'md', 'py', 'js', 'ts', 'json', 'cpp', 'rs'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  const selectedPath = result.filePaths[0];
  const content = fs.readFileSync(selectedPath, 'utf-8');
  return {
    name: path.basename(selectedPath),
    content,
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
