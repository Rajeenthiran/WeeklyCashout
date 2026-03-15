const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    printPreview: () => ipcRenderer.invoke('print-preview')
});
