const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loadProgress: () => ipcRenderer.invoke('storage:load'),
  saveProgress: (data) => ipcRenderer.invoke('storage:save', data),
  getStoragePath: () => ipcRenderer.invoke('storage:getPath'),
  openTextFile: () => ipcRenderer.invoke('file:openText'),
});
