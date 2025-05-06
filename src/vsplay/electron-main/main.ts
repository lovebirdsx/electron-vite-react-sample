import { app, BrowserWindow, shell } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { storage } from '../../base/storage';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// main打包后路径为：dist/out/vsplay/electron-main/main.js，在vite.config.ts中配置
const DIST = join(__dirname, '../../..');
const VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(DIST, '../public') : DIST;

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

    const win = new BrowserWindow({
        title: 'Main window',
        icon: join(VITE_PUBLIC, 'vite.svg'),
        ...state,
        webPreferences: {
            preload: join(__dirname, './preload.mjs'),
        },
    });
    
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        win.loadFile(join(DIST, 'index.html'));
    }

    if (state.showDevTools) {
        win.webContents.openDevTools();
    }
    
    app.on('second-instance', () => {
        if (win.isMinimized()) {
            win.restore();
        }
        win.focus();
    });

    win.on('close', () => {
        saveWindowState('mainWindow', win);
    });

    win.on('resize', () => {
        saveWindowState('mainWindow', win);
    });

    win.on('move', () => {
        saveWindowState('mainWindow', win);
    });

    win.once('ready-to-show', () => {
        win.show();
        win.focus();
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

function main() {
    app.whenReady().then(createWindow);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });
}

main();
