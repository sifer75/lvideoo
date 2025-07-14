import { app, BrowserWindow, ipcMain, dialog, desktopCapturer } from "electron";
import path from "node:path";
import fs from "node:fs";
import ffmpeg from "fluent-ffmpeg";
import express from "express";
import { spawn, ChildProcess } from "child_process";
import started from "electron-squirrel-startup";
let videoServer: any = null;
let videoServerPort: number | null = null;
let publicUrl: string | null = null;
let ngrokProcess: ChildProcess | null = null;
const startVideoServer = async (folderPath: string) => {
  if (videoServer) {
    videoServer.close();
    if (ngrokProcess) {
      ngrokProcess.kill();
      ngrokProcess = null;
    }
  }
  const app = express();
  app.use(express.static(folderPath));
  videoServer = app.listen(0, async () => {
    videoServerPort = videoServer.address().port;
    console.log(`Video server listening on port: ${videoServerPort}`);
    const ngrokBinPath = "/opt/homebrew/bin/ngrok"; 
    
    ngrokProcess = spawn(ngrokBinPath, ["http", String(videoServerPort)], {
      shell: true,
    });
    
    await new Promise((resolve) => setTimeout(resolve, 2000)); 
    try {
      const response = await fetch("http:
      const data = await response.json();
      if (data.tunnels && data.tunnels.length > 0) {
        publicUrl = data.tunnels[0].public_url;
        console.log(`ngrok tunnel created at: ${publicUrl}`);
      } else {
        console.warn("No ngrok tunnels found via API.");
      }
    } catch (error) {
      console.error("Error fetching ngrok tunnel info:", error);
    }
  });
};
if (started) {
  app.quit();
}
const getFfmpegPath = () => {
  let ffmpegBinPath;
  if (app.isPackaged) {
    
    ffmpegBinPath = path.join(process.resourcesPath, "ffmpeg");
  } else {
    
    ffmpegBinPath = path.join(
      __dirname,
      "..",
      "..",
      "node_modules",
      "ffmpeg-static",
      "ffmpeg",
    );
  }
  return ffmpegBinPath;
};
const getFfprobePath = () => {
  let ffprobeBinPath;
  if (app.isPackaged) {
    ffprobeBinPath = path.join(process.resourcesPath, "ffprobe");
  } else {
    ffprobeBinPath = require("ffprobe-static").path;
  }
  return ffprobeBinPath;
};
import Store from "electron-store";
interface StoreSchema {
  saveFolderPath: string;
}
ffmpeg.setFfmpegPath(getFfmpegPath());
ffmpeg.setFfprobePath(getFfprobePath());
const store = new Store<StoreSchema>();
const createWindow = () => {
  
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }
  
  mainWindow.webContents.openDevTools();
  
  ipcMain.on("open-folder-dialog", async (event) => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
    });
    if (!canceled && filePaths.length > 0) {
      const selectedPath = filePaths[0];
      store.set("saveFolderPath", selectedPath); 
      startVideoServer(selectedPath); 
      event.sender.send("selected-folder", selectedPath);
    } else {
      event.sender.send("selected-folder", ""); 
    }
  });
  
  ipcMain.handle("get-screen-sources", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["window", "screen"],
      thumbnailSize: { width: 150, height: 150 },
    });
    return sources.map((source) => ({
      id: source.id,
      name: source.name,
      thumbnail: source.thumbnail.toDataURL(),
      display_id: source.display_id,
    }));
  });
  
  ipcMain.on("save-recording", async (event, { blob, folderPath }) => {
    try {
      const buffer = Buffer.from(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `recording_${timestamp}.webm`;
      const filePath = path.join(folderPath, fileName);
      fs.writeFile(filePath, buffer, (err) => {
        if (err) {
          console.error("Failed to save recording:", err);
          event.sender.send("save-recording-error", err.message); 
        } else {
          event.sender.send("save-recording-success", filePath); 
        }
      });
    } catch (error) {
      console.error("Error processing recording data:", error);
      event.sender.send("save-recording-error", error.message); 
    }
  });
  
  ipcMain.handle("open-video-file-dialog", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openFile"],
      filters: [
        { name: "Videos", extensions: ["mp4", "webm", "mkv", "avi", "mov"] },
      ],
    });
    if (!canceled && filePaths.length > 0) {
      return { filePath: filePaths[0], canceled: false };
    } else {
      return { filePath: "", canceled: true };
    }
  });
  
  ipcMain.handle(
    "get-videos-in-folder",
    async (event, folderPath: string | undefined) => {
      const targetPath =
        folderPath ||
        store.get("saveFolderPath", app.getPath("videos")); 
      try {
        const files = await fs.promises.readdir(targetPath);
        const videoExtensions = ["mp4", "webm", "mkv", "avi", "mov"];
        const videoFiles = files
          .filter((file) => {
            const ext = path.extname(file).toLowerCase().substring(1);
            return videoExtensions.includes(ext);
          })
          .map((file) => path.join(targetPath, file));
        return videoFiles.map(
          (filePath) =>
            `http:
        );
      } catch (error) {
        console.error("Error reading video folder:", error);
        return [];
      }
    },
  );
  
  ipcMain.handle("get-stored-save-folder-path", () => {
    return store.get("saveFolderPath", "");
  });
  
  ipcMain.on("copy-to-clipboard", (event, text: string) => {
    require("electron").clipboard.writeText(text);
  });
  
  ipcMain.handle("delete-video", async (event, filePath: string) => {
    try {
      await fs.promises.unlink(filePath);
      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("get-video-thumbnail", async (event, videoPath: string) => {
    try {
      const url = new URL(videoPath);
      if (url.protocol !== "http:") {
        throw new Error("Invalid protocol for thumbnail generation");
      }
      const videoFileName = path.basename(url.pathname);
      const storedPath = store.get(
        "saveFolderPath",
        app.getPath("videos"),
      );
      const actualVideoPath = path.join(storedPath, videoFileName);
      const tempDir = app.getPath("temp");
      const thumbnailFileName = `${path.basename(
        videoFileName,
        path.extname(videoFileName),
      )}.png`;
      const thumbnailPath = path.join(tempDir, thumbnailFileName);
      
      if (fs.existsSync(thumbnailPath)) {
        const data = await fs.promises.readFile(thumbnailPath);
        return `data:image/png;base64,${data.toString("base64")}`;
      }
      return new Promise((resolve, reject) => {
        ffmpeg(actualVideoPath)
          .on("end", async () => {
            try {
              
              await fs.promises.access(thumbnailPath, fs.constants.F_OK);
              const data = await fs.promises.readFile(thumbnailPath);
              resolve(`data:image/png;base64,${data.toString("base64")}`);
            } catch (err) {
              console.error(
                `Error accessing thumbnail file after generation:`,
                err,
              );
              reject(err);
            }
          })
          .on("error", (err, stdout, stderr) => {
            console.error("Error generating thumbnail for " + actualVideoPath);
            console.error("ffmpeg error:", err.message);
            console.error("ffmpeg stdout:", stdout);
            console.error("ffmpeg stderr:", stderr);
            reject(err);
          })
          .screenshots({
            timestamps: [0.1], 
            filename: thumbnailFileName,
            folder: tempDir,
            size: "320x180",
          });
      });
    } catch (error) {
      console.error("Error processing video path for thumbnail:", error);
      return null; 
    }
  });
  ipcMain.handle("get-public-url", () => {
    return publicUrl;
  });
};
app.on("ready", async () => {
  const storedPath = store.get("saveFolderPath", app.getPath("videos"));
  await startVideoServer(storedPath);
  createWindow();
});
app.on("window-all-closed", async () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
  if (ngrokProcess) {
    ngrokProcess.kill();
    ngrokProcess = null;
  }
});
app.on("activate", () => {
  
  
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
