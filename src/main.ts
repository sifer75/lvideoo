import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, clipboard } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Store from 'electron-store';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import express from 'express';

import started from 'electron-squirrel-startup';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Set the path to the ffmpeg executable
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

const store = new Store();
let videoServer: any = null;
let videoServerPort: number | null = null;

const startVideoServer = (folderPath: string) => {
  if (videoServer) {
    videoServer.close();
  }
  const app = express();
  app.use(express.static(folderPath));

  videoServer = app.listen(0, () => {
    videoServerPort = videoServer.address().port;
    console.log(`Video server started on port ${videoServerPort} serving from ${folderPath}`);
  });
};

let mainWindow: BrowserWindow | null = null; // Declare mainWindow globally

// Helper to send logs to renderer
const sendLogToRenderer = (message: string) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('main-log', message);
  }
};

// Handle folder selection dialog
ipcMain.on('open-folder-dialog', async (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow!, {
    properties: ['openDirectory'],
  });

  if (!canceled && filePaths.length > 0) {
    const selectedPath = filePaths[0];
    store.set('saveFolderPath', selectedPath); // Save to store
    startVideoServer(selectedPath); // Start server with new path
    event.sender.send('selected-folder', selectedPath);
  } else {
    event.sender.send('selected-folder', ''); // Send empty string if canceled
  }
});

// Handle getting screen sources
ipcMain.handle('get-screen-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 150, height: 150 },
  });
  return sources.map(source => ({
    id: source.id,
    name: source.name,
    thumbnail: source.thumbnail.toDataURL(),
    display_id: source.display_id,
  }));
});

// Handle saving recording
ipcMain.on('save-recording', async (event, { blob, folderPath }) => {
  sendLogToRenderer('Received save-recording event in main process.');
  sendLogToRenderer(`Blob size: ${blob.byteLength} bytes`);
  sendLogToRenderer(`Folder path: ${folderPath}`);

  try {
    const buffer = Buffer.from(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const webmFileName = `recording_${timestamp}.webm`;
    const webmFilePath = path.join(folderPath, webmFileName);
    const mp4FileName = `recording_${timestamp}.mp4`;
    const mp4FilePath = path.join(folderPath, mp4FileName);

    sendLogToRenderer(`Saving WebM to: ${webmFilePath}`);

    fs.writeFile(webmFilePath, buffer, (err) => {
      if (err) {
        sendLogToRenderer(`Failed to save WebM: ${err.message}`);
        event.sender.send('save-recording-error', err.message); // Send error to renderer
      } else {
        sendLogToRenderer(`WebM saved. Converting to MP4: ${mp4FilePath}`);
        ffmpeg(webmFilePath)
          .output(mp4FilePath)
          .videoCodec('libx264')
          .audioCodec('aac')
          .on('end', () => {
            sendLogToRenderer(`MP4 saved to: ${mp4FilePath}`);
            // Verify MP4 file existence and size
            fs.stat(mp4FilePath, (statErr, stats) => {
              if (statErr) {
                sendLogToRenderer(`Error stating MP4 file: ${statErr.message}`);
              } else {
                sendLogToRenderer(`MP4 file size: ${stats.size} bytes`);
              }
            });
            fs.unlink(webmFilePath, (unlinkErr) => {
              if (unlinkErr) console.error('Failed to delete WebM file:', unlinkErr);
            });
            event.sender.send('save-recording-success', mp4FilePath); // Send success to renderer
            event.sender.send('video-list-updated'); // Notify renderer to refresh video list
          })
          .on('error', (ffmpegErr) => {
            sendLogToRenderer(`FFmpeg conversion error: ${ffmpegErr.message}`);
            event.sender.send('save-recording-error', `Conversion error: ${ffmpegErr.message}`);
          })
          .run();
      }
    });
  } catch (error) {
    sendLogToRenderer(`Error processing recording data: ${error.message}`);
    event.sender.send('save-recording-error', error.message); // Send error to renderer
  }
});

// Handle opening video file dialog
ipcMain.on('open-video-file-dialog', async (event) => {
  const focusedWindow = BrowserWindow.getFocusedWindow();
  const { canceled, filePaths } = await dialog.showOpenDialog(focusedWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'webm', 'mkv', 'avi', 'mov'] },
    ],
  });

  if (!canceled && filePaths.length > 0) {
    event.sender.send('selected-video-file', filePaths[0]);
  } else {
    event.sender.send('selected-video-file', '');
  }
});

// Handle getting videos in folder
ipcMain.handle('get-videos-in-folder', async (event, folderPath: string | undefined) => {
  const targetPath = folderPath || store.get('saveFolderPath', app.getPath('videos')) as string; // Use stored path or default
  try {
    const files = await fs.promises.readdir(targetPath);
    const videoExtensions = ['mp4', 'webm', 'mkv', 'avi', 'mov'];
    const videoFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase().substring(1);
      return videoExtensions.includes(ext);
    }).map(file => path.join(targetPath, file));
    return videoFiles.map(filePath => `http://localhost:${videoServerPort}/${path.basename(filePath)}`);
  } catch (error) {
    sendLogToRenderer(`Error reading video folder: ${error.message}`);
    return [];
  }
});

// Handle getting stored save folder path
ipcMain.handle('get-stored-save-folder-path', () => {
  return store.get('saveFolderPath', '');
});

// Handle copy to clipboard
ipcMain.on('copy-to-clipboard', (event, text: string) => {
  sendLogToRenderer('Main: Received copy-to-clipboard event.');
  sendLogToRenderer(`Main: Text to copy: ${text}`);
  clipboard.writeText(text);
  sendLogToRenderer('Main: Text copied to clipboard.');
});

// Handle delete video
ipcMain.on('delete-video', async (event, filePath: string) => {
  sendLogToRenderer('Main: Received delete-video event.');
  sendLogToRenderer(`Main: Attempting to delete file: ${filePath}`);
  try {
    await fs.promises.unlink(filePath);
    sendLogToRenderer(`Main: File deleted successfully: ${filePath}`);
    event.sender.send('delete-video-success', filePath);
    event.sender.send('video-list-updated'); // Notify renderer to refresh video list
  } catch (error) {
    sendLogToRenderer(`Main: Error deleting file: ${error.message}`);
    event.sender.send('delete-video-error', error.message);
  }
});

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true, // Re-enable webSecurity
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Log webPreferences to confirm webSecurity status
  sendLogToRenderer(`Main: webSecurity is: ${mainWindow.webContents.session.webPreferences.webSecurity}`);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  const storedPath = store.get('saveFolderPath', app.getPath('videos')) as string;
  startVideoServer(storedPath);
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.