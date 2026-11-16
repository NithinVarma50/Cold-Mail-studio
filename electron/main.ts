import { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './db/database';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    title: 'ColdMail Studio - Local Desktop Email Automation',
    backgroundColor: '#090d16',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Register all IPC handlers
  registerIpcHandlers(mainWindow);

  const startUrl = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Function to reveal, un-minimize, and forcefully bring dashboard window to front
function openAndFocusDashboard() {
  if (!mainWindow) {
    createWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }
  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  // Windows OS trick to ensure window breaks through to the foreground
  mainWindow.setAlwaysOnTop(true);
  mainWindow.show();
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);

  // Send signal to frontend to switch to Dashboard view
  mainWindow.webContents.send('navigate:dashboard');
}

app.whenReady().then(async () => {
  // Initialize embedded SQLite database
  try {
    await initDatabase();
    console.log('[DB] Local SQLite database initialized successfully.');
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite database:', err);
  }

  createWindow();

  // Register multiple Global Desktop Shortcuts to ensure 100% reliability
  // 1. Primary Ctrl+M (Cmd+M on Mac)
  // 2. Collision-free Ctrl+Shift+M (in case Ctrl+M is reserved by another app)
  // 3. Ctrl+Alt+M
  // 4. F9 (Single key instant launcher)
  const shortcuts = [
    'CommandOrControl+M',
    'CommandOrControl+Shift+M',
    'CommandOrControl+Alt+M',
    'F9'
  ];

  shortcuts.forEach(sc => {
    try {
      const registered = globalShortcut.register(sc, () => {
        console.log(`[Global Shortcut Triggered] ${sc} -> Bringing Dashboard to focus`);
        openAndFocusDashboard();
      });
      if (registered) {
        console.log(`[Shortcut OK] Registered global shortcut: ${sc}`);
      } else {
        console.warn(`[Shortcut Busy] Could not register global shortcut: ${sc}`);
      }
    } catch (e) {
      console.error(`[Shortcut Error] Failed registering ${sc}:`, e);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      openAndFocusDashboard();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
