declare global {
  interface Window {
    electronAPI: {
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (...args: any[]) => void) => () => void;
      getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string; display_id: string; }>>;
      saveRecording: (data: { blob: ArrayBuffer, folderPath: string }) => void;
      onSaveRecordingSuccess: (func: (filePath: string) => void) => () => void;
      onSaveRecordingError: (func: (errorMessage: string) => void) => () => void;
    };
  }
}

export {};
