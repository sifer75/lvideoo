import { app, BrowserWindow, ipcMain, dialog, desktopCapturer, pushNotifications } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import Store from 'electron-store';
import ffmpegPath from 'ffmpeg-static';
import ffmpeg from 'fluent-ffmpeg';
import express from 'express';

import started from 'electron-squirrel-startup';

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
    
  });
};

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

// Set the path to the ffmpeg executable
const getFfmpegPath = () => {
  let ffmpegBinPath;
  if (app.isPackaged) {
    // For packaged app, ffmpeg is included as an extra resource
    ffmpegBinPath = path.join(process.resourcesPath, 'ffmpeg');
  } else {
    // In development, ffmpeg-static places the binary in node_modules
    ffmpegBinPath = path.join(__dirname, '..', '..', 'node_modules', 'ffmpeg-static', 'ffmpeg');
  }
  
  return ffmpegBinPath;
};

const getFfprobePath = () => {
  let ffprobeBinPath;
  if (app.isPackaged) {
    ffprobeBinPath = path.join(process.resourcesPath, 'ffprobe');
  } else {
    ffprobeBinPath = require('ffprobe-static').path;
  }
  
  return ffprobeBinPath;
};

ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());

const store = new Store();

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
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

  // Handle folder selection dialog
  ipcMain.on('open-folder-dialog', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
    try {
      const buffer = Buffer.from(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `recording_${timestamp}.webm`;
      const filePath = path.join(folderPath, fileName);

      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error('Failed to save recording:', err);
          event.sender.send('save-recording-error', err.message); // Send error to renderer
        } else {
          event.sender.send('save-recording-success', filePath); // Send success to renderer
        }
      });
    } catch (error) {
      console.error('Error processing recording data:', error);
      event.sender.send('save-recording-error', error.message); // Send error to renderer
    }
  });

  // Handle opening video file dialog
  ipcMain.on('open-video-file-dialog', async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
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
      console.error('Error reading video folder:', error);
      return [];
    }
  });

  // Handle getting stored save folder path
  ipcMain.handle('get-stored-save-folder-path', () => {
    return store.get('saveFolderPath', '');
  });

  // Handle copy to clipboard
  ipcMain.on('copy-to-clipboard', (event, text: string) => {
    require('electron').clipboard.writeText(text);
  });

  // Handle delete video
  ipcMain.handle('delete-video', async (event, filePath: string) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('get-video-thumbnail', async (event, videoPath: string) => {
    try {
      const url = new URL(videoPath);
      if (url.protocol !== 'http:') {
        throw new Error('Invalid protocol for thumbnail generation');
      }
      const videoFileName = path.basename(url.pathname);
      const storedPath = store.get('saveFolderPath', app.getPath('videos')) as string;
      const actualVideoPath = path.join(storedPath, videoFileName);

      const tempDir = app.getPath('temp');
      const thumbnailFileName = `${path.basename(videoFileName, path.extname(videoFileName))}.png`;
      const thumbnailPath = path.join(tempDir, thumbnailFileName);

      // Check if thumbnail already exists
      if (fs.existsSync(thumbnailPath)) {
        const data = await fs.promises.readFile(thumbnailPath);
        return `data:image/png;base64,${data.toString('base64')}`;
      }

      return new Promise((resolve, reject) => {
        ffmpeg(actualVideoPath)
          .on('end', async (stdout, stderr) => {
            try {
              // Check if the file exists before trying to read it
              await fs.promises.access(thumbnailPath, fs.constants.F_OK);
              const data = await fs.promises.readFile(thumbnailPath);
              resolve(`data:image/png;base64,${data.toString('base64')}`);
            } catch (err) {
              console.error(`Error accessing thumbnail file after generation:`, err);
              reject(err);
            }
          })
          .on('error', (err, stdout, stderr) => {
            console.error('Error generating thumbnail for ' + actualVideoPath);
            console.error('ffmpeg error:', err.message);
            console.error('ffmpeg stdout:', stdout);
            console.error('ffmpeg stderr:', stderr);
            reject(err);
          })
          .screenshots({
            timestamps: [0.0pushNotificationsp], // Changed to 0.2 seconds
            filename: thumbnailFileName,
            folder: tempDir,
            size: '320x180',
          });
      });
    } catch (error) {
      console.error('Error processing video path for thumbnail:', error);
      return null; // Return null to indicate an error
    }
  });
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
