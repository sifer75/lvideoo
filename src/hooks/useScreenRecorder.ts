import { useEffect, useRef, useState } from "react";
import { createVideoConstraints } from "../components/screenRecorderModal/ScreenRecorderModal.utils";

interface UseScreenRecorderProps {
  isCameraOn: boolean;
  cameraStream: MediaStream | null;
}

// Interface pour les sources d'écran (pour un typage plus strict)
interface ScreenSource {
  id: string;
  name: string;
  // Ajoutez d'autres propriétés si nécessaire
}

export function useScreenRecorder({
  isCameraOn,
  cameraStream,
}: UseScreenRecorderProps) {
  // --- États (State) ---
  const [recordingStatus, setRecordingStatus] = useState<string>("Prêt");
  const [saveFolderPath, setSaveFolderPath] = useState<string>("Non sélectionné");
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]); // Typage corrigé
  const [selectedScreenSource, setSelectedScreenSource] = useState<string | null>(null);

  // --- Références (Refs) ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  // NOUVEAU : Ref pour suivre l'état de montage du composant
  const isMounted = useRef(true);

  // --- Effet de bord pour l'initialisation et le nettoyage ---
  useEffect(() => {
    // Au montage, on définit isMounted à true
    isMounted.current = true;

    const cleanupFolderListener = window.electronAPI.receive(
      "selected-folder",
      (folderPath: string) => {
        // On vérifie si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted.current) {
          setSaveFolderPath(folderPath);
        }
      },
    );

    async function fetchScreenSources() {
      try {
        const sources = await window.electronAPI.getScreenSources();
        // On vérifie si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted.current) {
          setScreenSources(sources); // Correction : Met à jour screenSources
          if (sources.length > 0) {
            setSelectedScreenSource(sources[0].id);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des sources d'écran:", error);
      }
    }
    fetchScreenSources();

    // La fonction de nettoyage est appelée lorsque le composant est démonté
    return () => {
      // Au démontage, on définit isMounted à false
      isMounted.current = false;
      cleanupFolderListener();
    };
  }, []); // Le tableau vide [] assure que cet effet ne s'exécute qu'une fois

  // --- Logique d'enregistrement ---
  async function startRecording() {
    if (!selectedScreenSource) {
      alert("Veuillez sélectionner une source d'écran.");
      return;
    }
    if (saveFolderPath === "Non sélectionné") {
      alert("Veuillez sélectionner un dossier de sauvegarde.");
      return;
    }
    // Pas besoin de vérifier isMounted ici, car cette fonction est appelée par une interaction utilisateur
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
      streamRef.current = combinedStream; // AJOUT : On stocke le flux

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9",
      });
      mediaRecorderRef.current = recorder; // AJOUT : On stocke l'enregistreur

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
        // On vérifie si le composant est toujours monté avant de mettre à jour l'état
        if (isMounted.current) {
          setRecordingStatus("Prêt");
        }
      };

      recorder.start();
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      // On vérifie si le composant est toujours monté avant de mettre à jour l'état
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
    // On vérifie si le composant est toujours monté avant de mettre à jour l'état
    if (isMounted.current) {
      setRecordingStatus("Arrêté");
    }
  }

  // --- Valeur de Retour du Hook ---
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
