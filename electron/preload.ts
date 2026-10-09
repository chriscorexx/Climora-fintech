import { contextBridge, ipcRenderer } from 'electron';

/**
 * Strongly typed preload bridge with Context Isolation
 */
contextBridge.exposeInMainWorld('climora', {
  platform: process.platform,
  version: '1.0.0',
  printMemo: () => ipcRenderer.send('print-memo'),
});
