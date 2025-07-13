import { useEffect, useRef, useState } from "react";
import { createVideoConstraints } from "../components/screenRecorderModal/ScreenRecorderModal.utils";

interface UseScreenRecorderProps {
  isCameraOn: boolean;
  cameraStream: MediaStream | null;
}

export function useScreenRecorder({
  isCameraOn,
  cameraStream,
}: UseScreenRecorderProps) {
  const [selectedScreenSource, setSelectedScreenSource] = useState<
    string | null
  >(null);
  const [screenSources, setScreenSources] = useState([]);
  const [recordingStatus, setRecordingStatus] = useState<string>("Prêt");
  const [saveFolderPath, setSaveFolderPath] = useState<string | null>(
    "non sélectionné",
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const cleanUpFolder = window.electronAPI.receive(
      "selected-folder",
      (folderPath: string) => {
        setSaveFolderPath(folderPath);
      },
    );

    async function fetchScreenSources() {
      const sources = await window.electronAPI.getScreenSources();
      if (sources.length > 0) {
        setSelectedScreenSource(sources[0].id);
      }
    }
    fetchScreenSources();
    return () => {
      cleanUpFolder();
    };
  }, []);

  async function startRecording() {
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
        video: createVideoConstraints(selectedScreenSource),
      });

      const videoStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const tracks = [
        ...screenStream.getVideoTracks(),
        ...videoStream.getAudioTracks(),
      ];

      if (isCameraOn && cameraStream) {
        tracks.push(...cameraStream.getVideoTracks());
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
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      setRecordingStatus("Erreur");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRecordingStatus("Arreté");
  }

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
