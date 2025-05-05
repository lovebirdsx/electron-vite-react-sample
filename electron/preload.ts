// Preload script

// Example: Expose a simple function to the renderer process
// via contextBridge if contextIsolation is enabled
// (contextIsolation is enabled by default in Electron >= 12)
/*
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('myAPI', {
    doSomething: () => ipcRenderer.send('do-something')
})
*/

// Simple message handling example (if needed)
window.onmessage = ev => {
    if (ev.data.payload === 'removeLoading') {
        console.log('Received removeLoading message');
        // Add logic here if needed, e.g., removing a loading element
        // Be cautious with direct DOM manipulation in preload scripts
    }
};

console.log('Preload script loaded.');
