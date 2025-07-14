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
  openVideoFileDialog: () => ipcRenderer.invoke('open-video-file-dialog'),
  getVideosInFolder: (folderPath: string) => ipcRenderer.invoke('get-videos-in-folder', folderPath),
  getStoredSaveFolderPath: () => ipcRenderer.invoke('get-stored-save-folder-path'),
  copyToClipboard: (text: string) => ipcRenderer.send('copy-to-clipboard', text),
  deleteVideo: (filePath: string) => ipcRenderer.invoke('delete-video', filePath),
  getVideoThumbnail: (videoPath: string) => ipcRenderer.invoke('get-video-thumbnail', videoPath),
  getPublicUrl: () => ipcRenderer.invoke('get-public-url'),
});