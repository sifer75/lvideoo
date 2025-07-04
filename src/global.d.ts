declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => () => void;
      getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string; display_id: string; }>>;
      saveRecording: (data: { blob: ArrayBuffer, folderPath: string }) => void;
      onSaveRecordingSuccess: (func: (filePath: string) => void) => () => void;
      onSaveRecordingError: (func: (errorMessage: string) => void) => () => void;
      openVideoFileDialog: () => void;
    };
  }

  interface VideoItem {
    id: string;
    title: string;
    path: string;
    shareLink: string;
  }

  interface ScreenSource {
    id: string;
    name: string;
    thumbnail: string;
    display_id: string;
  }

  interface ScreenRecorderModalProps {
    onClose: () => void;
    isCameraOn: boolean;
    cameraStream: MediaStream | null;
    handleToggleCamera: () => Promise<void>;
  }

  interface VideoLibraryProps {
    videos: VideoItem[];
    onOpenRecorder: () => void;
  }
}

export {};