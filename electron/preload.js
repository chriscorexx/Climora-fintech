import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('climora', {
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
});
