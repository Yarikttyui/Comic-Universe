const { app, BrowserWindow, Menu, Tray, Notification, shell, nativeImage } = require('electron');
const path = require('path');

let autoUpdater;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (_) {
  autoUpdater = null;
}

const SERVER_URL = process.env.COMIC_SERVER_URL || 'https://adskoekoleso.ru';

let mainWindow;
let tray = null;

function showNotification(title, body) {
  if (!Notification.isSupported()) return;
  new Notification({ title, body, icon: path.join(__dirname, 'icon.png') }).show();
}

function go(pathname = '/') {
  if (!mainWindow) return;
  mainWindow.loadURL(`${SERVER_URL}${pathname}`);
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'icon.png')).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Comic Universe');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Открыть', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
    { label: 'Библиотека', click: () => { if (mainWindow) { mainWindow.show(); } go('/library'); } },
    { label: 'Профиль', click: () => { if (mainWindow) { mainWindow.show(); } go('/profile'); } },
    { type: 'separator' },
    { label: 'Выход', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

function setupAutoUpdater() {
  if (!autoUpdater) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    showNotification('Доступно обновление', `Версия ${info.version} загружается...`);
  });

  autoUpdater.on('update-downloaded', (info) => {
    showNotification('Обновление готово', `Версия ${info.version} будет установлена при перезапуске.`);
  });

  autoUpdater.on('error', () => {});

  autoUpdater.checkForUpdatesAndNotify().catch(() => {});

  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }, 60 * 60 * 1000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    title: 'Comic Universe',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    backgroundColor: '#11151d',
    show: false,
  });

  const template = [
    {
      label: 'Comic Universe',
      submenu: [
        { label: 'Главная', click: () => go('/') },
        { label: 'Библиотека', click: () => go('/library') },
        { label: 'Онбординг', click: () => go('/onboarding') },
        { label: 'Скачать', click: () => go('/downloads') },
        { label: 'Профиль', click: () => go('/profile') },
        { type: 'separator' },
        { label: 'Проверить обновления', click: () => { if (autoUpdater) autoUpdater.checkForUpdatesAndNotify().catch(() => {}); } },
        { type: 'separator' },
        { role: 'quit', label: 'Выход' },
      ],
    },
    {
      label: 'Создатель',
      submenu: [
        { label: 'Студия', click: () => go('/creator/studio') },
      ],
    },
    {
      label: 'Админ',
      submenu: [
        { label: 'Ревизии', click: () => go('/admin/reviews') },
        { label: 'Жалобы', click: () => go('/admin/comments') },
      ],
    },
    {
      label: 'Вид',
      submenu: [
        { role: 'reload', label: 'Обновить' },
        { role: 'togglefullscreen', label: 'Полный экран' },
        { type: 'separator' },
        { role: 'zoomIn', label: 'Увеличить' },
        { role: 'zoomOut', label: 'Уменьшить' },
        { role: 'resetZoom', label: 'Сбросить масштаб' },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  go('/');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (tray) {
        showNotification('Comic Universe', 'Приложение свёрнуто в трей.');
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupAutoUpdater();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else if (mainWindow) {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
