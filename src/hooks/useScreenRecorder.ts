import { useEffect, useRef, useState } from "react";
import { createVideoConstraints } from "../components/screenRecorderModal/ScreenRecorderModal.utils";
interface UseScreenRecorderProps {
  isCameraOn: boolean;
  cameraStream: MediaStream | null;
}
interface ScreenSource {
  id: string;
  name: string;
  
}
export function useScreenRecorder({
  isCameraOn,
  cameraStream,
}: UseScreenRecorderProps) {
  
  const [recordingStatus, setRecordingStatus] = useState<string>("Prêt");
  const [saveFolderPath, setSaveFolderPath] = useState<string>("Non sélectionné");
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]); 
  const [selectedScreenSource, setSelectedScreenSource] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  const isMounted = useRef(true);
  
  useEffect(() => {
    
    isMounted.current = true;
    const cleanupFolderListener = window.electronAPI.receive(
      "selected-folder",
      (folderPath: string) => {
        
        if (isMounted.current) {
          setSaveFolderPath(folderPath);
        }
      },
    );
    async function fetchScreenSources() {
      try {
        const sources = await window.electronAPI.getScreenSources();
        
        if (isMounted.current) {
          setScreenSources(sources); 
          if (sources.length > 0) {
            setSelectedScreenSource(sources[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des sources d'écran:", error);
      }
    }
    fetchScreenSources();
    
    return () => {
      
      isMounted.current = false;
      cleanupFolderListener();
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
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const tracks = [
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
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
        
        if (isMounted.current) {
          setRecordingStatus("Prêt");
        }
      };
      recorder.start();
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      
      if (isMounted.current) {
        setRecordingStatus("Erreur");
      }
    }
  }
  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    
    if (isMounted.current) {
      setRecordingStatus("Arrêté");
    }
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
