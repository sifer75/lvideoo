import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, data: any) => ipcRenderer.send(channel, data),
  receive: (channel: string, func: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => func(...args);
    ipcRenderer.on(channel, subscription);
    return () => ipcRenderer.removeListener(channel, subscription);
  },
  getScreenSources: () => ipcRenderer.invoke('get-screen-sources'),
  saveRecording: (data: { blob: ArrayBuffer, folderPath: string }) => ipcRenderer.send('save-recording', data),
  onSaveRecordingSuccess: (func: (filePath: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, filePath: string) => func(filePath);
    ipcRenderer.on('save-recording-success', subscription);
    return () => ipcRenderer.removeListener('save-recording-success', subscription);
  },
  onSaveRecordingError: (func: (errorMessage: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, errorMessage: string) => func(errorMessage);
    ipcRenderer.on('save-recording-error', subscription);
    return () => ipcRenderer.removeListener('save-recording-error', subscription);
  },
  openVideoFileDialog: () => ipcRenderer.send('open-video-file-dialog'),
  getVideosInFolder: (folderPath: string) => ipcRenderer.invoke('get-videos-in-folder', folderPath),
  getStoredSaveFolderPath: () => ipcRenderer.invoke('get-stored-save-folder-path'),
  copyToClipboard: (text: string) => ipcRenderer.send('copy-to-clipboard', text),
  onMainLog: (func: (message: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, message: string) => func(message);
    ipcRenderer.on('main-log', subscription);
    return () => ipcRenderer.removeListener('main-log', subscription);
  },
  deleteVideo: (filePath: string) => ipcRenderer.send('delete-video', filePath),
  onDeleteVideoSuccess: (func: (filePath: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, filePath: string) => func(filePath);
    ipcRenderer.on('delete-video-success', subscription);
    return () => ipcRenderer.removeListener('delete-video-success', subscription);
  },
  onDeleteVideoError: (func: (errorMessage: string) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, errorMessage: string) => func(errorMessage);
    ipcRenderer.on('delete-video-error', subscription);
    return () => ipcRenderer.removeListener('delete-video-error', subscription);
  },
});