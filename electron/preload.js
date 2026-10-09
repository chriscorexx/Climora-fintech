/**
 * electron/preload.js
 * Narrow, vetted IPC bridge exposed to the renderer via contextBridge.
 * contextIsolation: true — renderer cannot access Node.js directly.
 * Each method maps 1:1 to an ipcMain.handle() channel in main.js.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('climora', {
  // App
  getAppInfo: () =>
    ipcRenderer.invoke('get-app-info'),

  // Businesses
  listBusinesses: () =>
    ipcRenderer.invoke('list-businesses'),
  saveBusiness: (data) =>
    ipcRenderer.invoke('save-business', data),
  deleteBusiness: (id) =>
    ipcRenderer.invoke('delete-business', { id }),

  // Geocoding
  geocodeLocation: (location) =>
    ipcRenderer.invoke('geocode-location', { location }),

  // Assessment
  runAssessment: (businessId, forceRefresh = false) =>
    ipcRenderer.invoke('run-assessment', { businessId, forceRefresh }),

  // History
  getHistory: (businessId) =>
    ipcRenderer.invoke('get-history', { businessId }),

  // Documents
  listDocuments: (businessId) =>
    ipcRenderer.invoke('list-documents', { businessId }),
  saveDocument: (data) =>
    ipcRenderer.invoke('save-document', data),
});
