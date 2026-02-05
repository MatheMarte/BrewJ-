import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "BrewJá Management",
    icon: 'https://cdn-icons-png.flaticon.com/512/931/931949.png',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Tenta carregar a URL do ambiente (dev) ou o arquivo de build
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, 'dist/index.html')}`;
  
  win.loadURL(startUrl);
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});