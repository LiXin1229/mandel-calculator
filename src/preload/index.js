import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  closeMainWindow: () => ipcRenderer.invoke('close-mainWindow'),
  checkMaximized: async () => await ipcRenderer.invoke('check-maximized'),
  checkMinimized: () => ipcRenderer.invoke('check-minimized'),
  checkTopUp: async () => await ipcRenderer.invoke('check-topUp'),
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}
