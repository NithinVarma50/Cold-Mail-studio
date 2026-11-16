import { app, BrowserWindow, globalShortcut, Menu, Tray, nativeImage } from 'electron';
import path from 'path';
import { initDatabase } from './db/database';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;
let isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 1024,
    minHeight: 700,
    title: 'ColdMail Studio - Local Desktop Email Automation',
    backgroundColor: '#0f172a',
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

// Function to reveal and focus dashboard window
function openAndFocusDashboard() {
  if (!mainWindow) {
    createWindow();
  } else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
    // Signal UI to switch to Dashboard view
    mainWindow.webContents.send('navigate:dashboard');
  }
}

app.whenReady().then(() => {
  // Initialize embedded SQLite database
  try {
    initDatabase();
    console.log('[DB] Local SQLite database initialized successfully.');
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite database:', err);
  }

  createWindow();

  // Register Global Desktop Shortcut: Ctrl+M (or Cmd+M on macOS)
  // Allows user to bring up the ColdMail Studio dashboard anytime from anywhere on their OS
  const shortcutRegistered = globalShortcut.register('CommandOrControl+M', () => {
    console.log('[Shortcut] Ctrl+M pressed globally -> Revealing Dashboard');
    openAndFocusDashboard();
  });

  if (shortcutRegistered) {
    console.log('[Shortcut] Registered global shortcut CommandOrControl+M');
  } else {
    console.warn('[Shortcut] Global shortcut CommandOrControl+M registration failed');
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      openAndFocusDashboard();
    }
  });
});

app.on('will-quit', () => {
  // Unregister all global shortcuts on application exit
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
