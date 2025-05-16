import { app, BrowserWindow, Menu, MenuItemConstructorOptions, shell, utilityProcess } from 'electron';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storage } from '../../base/storage';
import installExtension, { REACT_DEVELOPER_TOOLS } from 'electron-devtools-installer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const isDev = process.env.NODE_ENV === 'development';

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

async function runCliTest() {
    const cliPath = join(DIST, 'out/vsplay/node/cli.js');
    const process = utilityProcess.fork(cliPath);
    process.on('error', (err) => {
        console.error('Failed to start child process.', err);
    });
    process.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
}

const menuTemplate: MenuItemConstructorOptions[] = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectAll' }
        ]
    },
    {
        label: 'Window',
        submenu: [
            { role: 'minimize' },
            { role: 'zoom' },
            { role: 'close' }
        ]
    },
    {
        label: 'Tools',
        submenu: [
            { label: 'Reload', click: () => { BrowserWindow.getFocusedWindow()?.webContents.reload() } },
            { label: 'Toggle DevTools', click: () => { BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools() } },
        ]
    },
    {
        label: 'Test',
        submenu: [
            { label: 'Log', click: () => { console.log('test log') } },
            { label: 'Run Cli', click: runCliTest },
        ]
    },
];

async function installReactDevTools() {
    if (process.env.NODE_ENV === 'development') {
        try {
            const result = await installExtension(REACT_DEVELOPER_TOOLS);
            console.log(`Added Extension:  ${result.name}`);
            return true;
        } catch (e) {
            console.error('An error occurred: ', e);
        }
    }

    return false;
}

async function createWindow(autoRefresh = false) {
    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    const state = storage.read('mainWindow', 'config', defalutWindowConfig);
    const win = new BrowserWindow({
        title: 'Main window',
        icon: join(VITE_PUBLIC, 'vite.svg'),
        ...state,
        webPreferences: {
            preload: join(DIST, 'out/vsplay/electron-main/preload.js'),

            // 开发模式下，sandbox设置为false，nodeIntegration设置为true，是为了方便调试preload.ts
            nodeIntegration: isDev,
            sandbox: !isDev,
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

        if (autoRefresh) {
            setTimeout(() => {
                win.webContents.reload();
            }, 1000);
        }
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
    app.on('ready', async () => {
        // electron的bug，安装react-devtools后，并不会马上生效，需要手动刷新一下页面
        const installSucceed = await installReactDevTools();
        createWindow(installSucceed);
    });

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
