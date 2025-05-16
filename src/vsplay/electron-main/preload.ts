/* eslint-disable @typescript-eslint/no-require-imports */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('myAPI', {
    doSomething: () => ipcRenderer.send('do-something')
})

window.onmessage = ev => {
    if (ev.data.payload === 'removeLoading') {
        console.log('Received removeLoading message');
    }
};

console.log('Preload script loaded.');
