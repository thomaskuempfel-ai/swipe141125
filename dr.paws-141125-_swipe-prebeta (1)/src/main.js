const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const TargetManager = require('./managers/targetManager');
const ScraperManager = require('./managers/scraperManager');
const PaymentManager = require('./managers/paymentManager');
const AlertManager = require('./managers/alertManager');

const store = new Store({
  encryptionKey: 'swipe-spy-app-encryption-key-2024'
});

let mainWindow;
let targetManager;
let scraperManager;
let paymentManager;
let alertManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, '../assets/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });

  const targetsDir = path.join(app.getPath('userData'), 'targets');
  if (!fs.existsSync(targetsDir)) {
    fs.mkdirSync(targetsDir, { recursive: true });
  }

  targetManager = new TargetManager(targetsDir, store);
  scraperManager = new ScraperManager(store);
  paymentManager = new PaymentManager(store);
  alertManager = new AlertManager(mainWindow, store);

  if (paymentManager.isPremium()) {
    scraperManager.startMonitoring(targetManager, alertManager);
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', () => {
});

app.on('before-quit', async () => {
  app.isQuitting = true;
  if (scraperManager) {
    scraperManager.stopMonitoring();
    await scraperManager.cleanup();
  }
});

ipcMain.handle('add-target-csv', async (event, filePath) => {
  try {
    const targets = await targetManager.addFromCSV(filePath);
    return { success: true, targets };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-target-linkedin', async (event, url) => {
  try {
    const target = await targetManager.addFromLinkedIn(url, scraperManager);
    return { success: true, target };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-targets', async () => {
  return targetManager.getAllTargets();
});

ipcMain.handle('remove-target', async (event, targetId) => {
  return targetManager.removeTarget(targetId);
});

ipcMain.handle('get-payment-status', async () => {
  return {
    isPremium: paymentManager.isPremium(),
    expiresAt: paymentManager.getExpirationDate()
  };
});

ipcMain.handle('open-payment', async () => {
  const checkoutWindow = new BrowserWindow({
    width: 800,
    height: 600,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  checkoutWindow.loadURL('https://your-vercel-app.vercel.app/checkout');

  checkoutWindow.webContents.on('will-navigate', (event, url) => {
    if (url.includes('success')) {
      paymentManager.activatePremium();
      scraperManager.startMonitoring(targetManager, alertManager);
      checkoutWindow.close();
      mainWindow.webContents.send('payment-success');
    }
  });

  return { success: true };
});

ipcMain.handle('set-api-keys', async (event, keys) => {
  try {
    if (keys.grokApiKey) {
      store.set('grokApiKey', keys.grokApiKey);
    }
    if (keys.slackWebhook) {
      store.set('slackWebhook', keys.slackWebhook);
    }
    if (keys.fcmKey) {
      store.set('fcmKey', keys.fcmKey);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-api-keys', async () => {
  return {
    hasGrokKey: !!store.get('grokApiKey'),
    hasSlackWebhook: !!store.get('slackWebhook'),
    hasFcmKey: !!store.get('fcmKey')
  };
});

ipcMain.handle('select-csv-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, filePath: result.filePaths[0] };
  }
  return { success: false };
});

ipcMain.handle('open-targets-folder', async () => {
  const targetsDir = path.join(app.getPath('userData'), 'targets');
  shell.openPath(targetsDir);
  return { success: true };
});
