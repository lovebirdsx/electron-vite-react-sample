import { app, BrowserWindow, shell } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storage } from '../../base/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.env.DIST = join(__dirname, '../dist');
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
    ? join(process.env.DIST, '../public')
    : process.env.DIST;

let win: BrowserWindow | null;
const preload = join(__dirname, './preload.mjs');
const url = process.env.VITE_DEV_SERVER_URL!;
const indexHtml = join(process.env.DIST, 'index.html');

const defalutWindowConfig = {
    x: 0,
    y: 0,
    width: 800,
    height: 600,
    showDevTools: false,
}

function saveWindowState(section: string, window: BrowserWindow) {
    const bounds = window.getBounds();
    storage.write(section, 'config', {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        showDevTools: window.webContents.isDevToolsOpened(),
    });
}

async function createWindow() {
    const state = storage.read('mainWindow', 'config', defalutWindowConfig);

    win = new BrowserWindow({
        title: 'Main window',
        icon: join(process.env.VITE_PUBLIC!, 'vite.svg'),
        ...state,
        webPreferences: {
            preload,
        },
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(url);
        if (state.showDevTools) {
            win.webContents.openDevTools();
        }
    } else {
        win.loadFile(indexHtml);
    }

    win.on('close', () => {
        saveWindowState('mainWindow', win!);
    });

    win.on('resize', () => {
        saveWindowState('mainWindow', win!);
    });

    win.on('move', () => {
        saveWindowState('mainWindow', win!);
    });

    win.once('ready-to-show', () => {
        win?.show();
        win?.focus();
    });

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString());
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) {
            shell.openExternal(url);
        }

        return { action: 'deny' };
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.on('second-instance', () => {
    if (win) {
        if (win.isMinimized()) {
            win.restore();
        }
        win.focus();
    }
})

app.on('activate', () => {
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length) {
        allWindows[0].focus();
    } else {
        createWindow();
    }
})
