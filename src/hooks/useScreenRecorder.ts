import { useEffect, useRef, useState, useCallback } from "react";
interface UseScreenRecorderProps {
  isMicrophoneOn: boolean;
  isCameraOn: boolean;
}
interface ScreenSource {
  id: string;
  name: string;
}
export function useScreenRecorder({ isMicrophoneOn, isCameraOn }: UseScreenRecorderProps) {
  const [recordingStatus, setRecordingStatus] = useState<string>("Prêt");
  const [saveFolderPath, setSaveFolderPath] =
    useState<string>("Non sélectionné");
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [selectedScreenSource, setSelectedScreenSource] = useState<
    string | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  

  useEffect(() => {
    const cleanupFolderListener = window.electronAPI.receive(
      "selected-folder",
      (folderPath: string) => {
        setSaveFolderPath(folderPath);
      },
    );
    async function fetchScreenSources() {
      try {
        const sources = await window.electronAPI.getScreenSources();

        setScreenSources(sources);
        if (sources.length > 0) {
          setSelectedScreenSource(sources[0].id);
        }
      } catch (error) {
        console.error(
          "Erreur lors de la récupération des sources d'écran:",
          error,
        );
      }
    }
    fetchScreenSources();

    return () => {
      cleanupFolderListener();
    };
  }, []);

  const startRecording = useCallback(
    async (cameraStream: MediaStream | null) => {
      console.log("startRecording called. cameraStream:", cameraStream);
      if (!selectedScreenSource) {
        alert("Veuillez sélectionner une source d'écran.");
        return;
      }
      if (saveFolderPath === "Non sélectionné") {
        alert("Veuillez sélectionner un dossier de sauvegarde.");
        return;
      }

      setRecordingStatus("Enregistrement");
      recordedChunksRef.current = [];
      try {
        const screenStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: selectedScreenSource,
            },
          } as any,
        });

        const tracks = [...screenStream.getVideoTracks()];

        if (isMicrophoneOn) {
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          tracks.push(...audioStream.getAudioTracks());
        }

        if (isCameraOn) {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          tracks.push(...videoStream.getVideoTracks());
        }

        const combinedStream = new MediaStream(tracks);
        streamRef.current = combinedStream;
        const recorder = new MediaRecorder(combinedStream, {
          mimeType: "video/webm; codecs=vp9",
        });
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };
        recorder.onstop = async () => {
          const blob = new Blob(recordedChunksRef.current, {
            type: "video/webm",
          });
          window.electronAPI.send("save-recording", {
            blob: await blob.arrayBuffer(),
            folderPath: saveFolderPath,
            format: "mp4",
          });

          setRecordingStatus("Prêt");
        };
        recorder.start();
      } catch (error) {
        console.error(
          "Erreur détaillée lors du démarrage de l'enregistrement:",
          error,
        );
        if (error instanceof Error) {
          console.error(`Error name: ${error.name}`);
          console.error(`Error message: ${error.message}`);
        }
        setRecordingStatus("Erreur");
      }
    },
    [selectedScreenSource, saveFolderPath, isMicrophoneOn],
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());

    setRecordingStatus("Arrêté");
  }, []);

  return {
    recordingStatus,
    saveFolderPath,
    screenSources,
    selectedScreenSource,
    setSelectedScreenSource,
    startRecording,
    stopRecording,
  };
}
