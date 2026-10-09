const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

// Compatibility switch for Linux environments
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('no-sandbox');

let mainWindow = null;

function checkUrl(url, timeoutMs = 1500) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = http.get({ host: u.hostname, port: u.port, path: u.pathname }, (res) => {
        resolve(res.statusCode >= 200 && res.statusCode < 400);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(timeoutMs, () => {
        req.destroy();
        resolve(false);
      });
    } catch {
      resolve(false);
    }
  });
}

async function waitForDevServer(url, maxRetries = 30, delayMs = 300) {
  for (let i = 0; i < maxRetries; i++) {
    const ok = await checkUrl(url, 300);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#090D16',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../public/Climora-logo.jpg'),
    title: 'Climora — Climate-Adjusted Risk Scoring for MSMEs',
  });

  const devUrl = process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173';
  const isDevRunning = await waitForDevServer(devUrl);

  if (isDevRunning) {
    console.log(`[Electron] Connected to live dev server: ${devUrl}`);
    mainWindow.loadURL(devUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log(`[Electron] Dev server not detected; loading production bundle: ${indexPath}`);
    mainWindow.loadFile(indexPath);
  }

  ipcMain.on('print-memo', () => {
    if (mainWindow) {
      mainWindow.webContents.print({ silent: false, printBackground: true });
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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
