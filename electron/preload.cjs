const { contextBridge, ipcRenderer } = require('electron');

/**
 * Strongly typed contextBridge for Climora desktop shell
 */
contextBridge.exposeInMainWorld('climora', {
  platform: process.platform,
  version: '1.0.1',
  printMemo: () => ipcRenderer.send('print-memo'),
});
