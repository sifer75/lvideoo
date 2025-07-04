import React, { useState, useEffect, useRef } from "react";

interface ScreenSource {
  id: string;
  name: string;
  thumbnail: string;
  display_id: string;
}

function App() {
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [recordingStatus, setRecordingStatus] = useState<string>("Prêt"); // Prêt, Enregistrement, Arrêté
  const [saveFolderPath, setSaveFolderPath] =
    useState<string>("Non sélectionné");
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [selectedScreenSource, setSelectedScreenSource] = useState<
    string | null
  >(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Écoute la réponse du processus principal après la sélection du dossier
    const cleanupFolder = window.electronAPI.receive(
      "selected-folder",
      (folderPath: string) => {
        setSaveFolderPath(folderPath);
      },
    );

    // Récupère les sources d'écran au chargement du composant
    const fetchScreenSources = async () => {
      const sources = await window.electronAPI.getScreenSources();
      setScreenSources(sources);
      if (sources.length > 0) {
        setSelectedScreenSource(sources[0].id); // Sélectionne la première source par défaut
      }
    };
    fetchScreenSources();

    // Écoute les messages de succès/erreur de sauvegarde
    const cleanupSaveSuccess = window.electronAPI.onSaveRecordingSuccess(
      (filePath: string) => {
        alert(`Enregistrement sauvegardé avec succès: ${filePath}`);
      },
    );
    const cleanupSaveError = window.electronAPI.onSaveRecordingError(
      (errorMessage: string) => {
        alert(
          `Erreur lors de la sauvegarde de l'enregistrement: ${errorMessage}`,
        );
      },
    );

    // Nettoyage des écouteurs lors du démontage du composant
    return () => {
      cleanupFolder();
      cleanupSaveSuccess();
      cleanupSaveError();
    };
  }, []);

  // Nouveau useEffect pour gérer le flux de la caméra et l'élément vidéo
  useEffect(() => {
    if (isCameraOn && cameraStreamRef.current && cameraVideoRef.current) {
      console.log("Attaching camera stream to video element.");
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
      cameraVideoRef.current
        .play()
        .catch((e) => console.error("Error playing camera stream:", e));
    } else if (!isCameraOn && cameraVideoRef.current) {
      console.log("Detaching camera stream from video element.");
      cameraVideoRef.current.srcObject = null;
    }
  }, [isCameraOn, cameraStreamRef.current]);

  const handleToggleCamera = async () => {
    if (isCameraOn) {
      // Arrêter la caméra
      console.log("Arrêt de la caméra...");
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
        console.log("Flux de caméra arrêté.");
      }
      setIsCameraOn(false);
    } else {
      // Démarrer la caméra
      console.log("Démarrage de la caméra...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        console.log("Flux de caméra obtenu:", stream);
        cameraStreamRef.current = stream;
        setIsCameraOn(true);
      } catch (error) {
        console.error("Erreur lors de l'accès à la caméra:", error);
        alert(
          "Impossible d'accéder à la caméra. Veuillez vérifier les permissions.",
        );
      }
    }
  };

  const handleRecord = async () => {
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
      console.log("Tentative d'obtention du flux d'écran...");
      // Obtenir le flux vidéo de l'écran
      const screenStream = await navigator.mediaDevices.getUserMedia({
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: selectedScreenSource,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
          },
        },
      });
      console.log("Flux d'écran obtenu:", screenStream);

      console.log("Tentative d'obtention du flux audio...");
      // Obtenir le flux audio du microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("Flux audio obtenu:", audioStream);

      const tracks = [
        ...screenStream.getVideoTracks(),
        ...audioStream.getAudioTracks(),
      ];

      // Ajouter le flux de la caméra si activée
      if (isCameraOn && cameraStreamRef.current) {
        console.log("Ajout du flux de la caméra à l'enregistrement.");
        tracks.push(...cameraStreamRef.current.getVideoTracks());
      }

      // Combiner les flux
      const combinedStream = new MediaStream(tracks);
      console.log("Flux combiné créé:", combinedStream);

      streamRef.current = combinedStream;

      // Initialiser MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: "video/webm; codecs=vp9", // WebM avec VP9 pour la qualité et la compatibilité
      });
      console.log("MediaRecorder initialisé:", mediaRecorderRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available event:", event.data.size, "bytes");
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        console.log(
          "MediaRecorder stopped. Total chunks:",
          recordedChunksRef.current.length,
        );
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        console.log("Blob created:", blob.size, "bytes");
        // Envoyer le blob au processus principal pour la sauvegarde
        window.electronAPI.send("save-recording", {
          blob: await blob.arrayBuffer(),
          folderPath: saveFolderPath,
        });
        setRecordingStatus("Prêt");
      };

      mediaRecorderRef.current.start();
      console.log("MediaRecorder started.");
    } catch (error) {
      console.error("Erreur lors du démarrage de l'enregistrement:", error);
      setRecordingStatus("Erreur");
    }
  };

  const handleStop = () => {
    console.log("Arrêt de l'enregistrement...");
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
      console.log("MediaRecorder stop() called.");
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      console.log("Combined stream tracks stopped.");
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
      console.log("Camera stream tracks stopped.");
    }
    setRecordingStatus("Arrêté");
  };

  const handleChooseFolder = () => {
    window.electronAPI.send("open-folder-dialog");
  };

  return (
    <div className="p-4 relative">
      <h1 className="text-2xl font-bold mb-4">🎥 Screen Recorder</h1>
      <div className="space-y-2">
        <p>
          📹 Caméra:{" "}
          <span className="font-semibold">{isCameraOn ? "ON" : "OFF"}</span>{" "}
          <button
            onClick={handleToggleCamera}
            className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
          >
            Toggle
          </button>
        </p>
        <p>
          🎤 Audio: <span className="font-semibold">Micro + Système</span>
        </p>
        <p>
          📁 Dossier: <span className="font-semibold">{saveFolderPath}</span>{" "}
          <button
            onClick={handleChooseFolder}
            className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
          >
            Choisir...
          </button>
        </p>
        <div>
          <label
            htmlFor="screen-source"
            className="block text-sm font-medium text-gray-700"
          >
            Source d'écran:
          </label>
          <select
            id="screen-source"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={selectedScreenSource || ""}
            onChange={(e) => setSelectedScreenSource(e.target.value)}
          >
            {screenSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 space-x-4">
        <button
          onClick={handleRecord}
          disabled={recordingStatus === "Enregistrement"}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          ● ENREGISTRER
        </button>
        <button
          onClick={handleStop}
          disabled={recordingStatus !== "Enregistrement"}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          ⏹ ARRÊTER
        </button>
      </div>
      <p className="mt-4">
        Status: <span className="font-semibold">{recordingStatus}</span>
      </p>

      {isCameraOn && (
        <video
          ref={cameraVideoRef}
          className="absolute bottom-4 right-4 w-[200px] h-[150px] bg-black border-2 border-gray-400"
          autoPlay
          muted
        ></video>
      )}
    </div>
  );
}

export default App;
