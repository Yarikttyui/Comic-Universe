const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const SERVER_URL = process.env.COMIC_SERVER_URL || 'https://adskoekoleso.ru';

let mainWindow;

function go(pathname = '/') {
    if (!mainWindow) return;
    mainWindow.loadURL(`${SERVER_URL}${pathname}`);
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

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
