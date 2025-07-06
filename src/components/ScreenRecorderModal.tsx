import React, { useState, useEffect, useRef } from 'react';

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

function ScreenRecorderModal({ onClose, isCameraOn, cameraStream, handleToggleCamera }: ScreenRecorderModalProps) {
  const [recordingStatus, setRecordingStatus] = useState<string>('Prêt'); // Prêt, Enregistrement, Arrêté
  const [saveFolderPath, setSaveFolderPath] = useState<string>('Non sélectionné');
  const [screenSources, setScreenSources] = useState<ScreenSource[]>([]);
  const [selectedScreenSource, setSelectedScreenSource] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Écoute la réponse du processus principal après la sélection du dossier
    const cleanupFolder = window.electronAPI.receive('selected-folder', (folderPath: string) => {
      setSaveFolderPath(folderPath);
    });

    // Récupère les sources d'écran au chargement du composant
    const fetchScreenSources = async () => {
      const sources = await window.electronAPI.getScreenSources();
      setScreenSources(sources);
      if (sources.length > 0) {
        setSelectedScreenSource(sources[0].id); // Sélectionne la première source par défaut
      }
    };
    fetchScreenSources();

    // Nettoyage des écouteurs lors du démontage du composant
    return () => {
      cleanupFolder();
    };
  }, []);

  const handleRecord = async () => {
    if (!selectedScreenSource) {
      alert("Veuillez sélectionner une source d'écran.");
      return;
    }
    if (saveFolderPath === 'Non sélectionné') {
      alert("Veuillez sélectionner un dossier de sauvegarde.");
      return;
    }

    setRecordingStatus('Enregistrement');
    recordedChunksRef.current = [];

    try {
      // Obtenir le flux vidéo de l'écran
      const screenStream = await navigator.mediaDevices.getUserMedia({
        video: {
          // @ts-ignore
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: selectedScreenSource,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080,
          },
        },
      });

      // Obtenir le flux audio du microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      const tracks = [...screenStream.getVideoTracks(), ...audioStream.getAudioTracks()];

      // Ajouter le flux de la caméra si activée
      if (isCameraOn && cameraStream) {
        tracks.push(...cameraStream.getVideoTracks());
      }

      // Combiner les flux
      const combinedStream = new MediaStream(tracks);

      streamRef.current = combinedStream;

      // Initialiser MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm; codecs=vp9', // WebM avec VP9 pour la qualité et la compatibilité
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // Envoyer le blob au processus principal pour la sauvegarde
        window.electronAPI.send('save-recording', { blob: await blob.arrayBuffer(), folderPath: saveFolderPath });
        setRecordingStatus('Prêt');
      };

      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      if (error.name === 'NotReadableError') {
        alert("Erreur: Impossible d'accéder à la source vidéo. Veuillez vérifier les permissions d'enregistrement d'écran dans les préférences système de votre OS.");
      } else {
        alert(`Erreur lors du démarrage de l'enregistrement: ${error.message}`);
      }
      setRecordingStatus('Erreur');
    }
  };

  const handleStop = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setRecordingStatus('Arrêté');
  };

  const handleChooseFolder = () => {
    window.electronAPI.send('open-folder-dialog');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-lg w-1/2 h-full relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl">&times;</button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Enregistreur d'écran</h2>
        <div className="space-y-2 text-gray-700">
          <p>📹 Caméra: <span className="font-semibold">{isCameraOn ? 'ON' : 'OFF'}</span> <button onClick={handleToggleCamera} className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300">Toggle</button></p>
          <p>🎤 Audio: <span className="font-semibold">Micro + Système</span></p>
          <p>📁 Dossier: <span className="font-semibold">{saveFolderPath}</span> <button onClick={handleChooseFolder} className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300">Choisir...</button></p>
          <div>
            <label htmlFor="screen-source" className="block text-sm font-medium text-gray-700">Source d'écran:</label>
            <select
              id="screen-source"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedScreenSource || ''}
              onChange={(e) => setSelectedScreenSource(e.target.value)}
            >
              {screenSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))
              }
            </select>
          </div>
        </div>
        <div className="mt-6 space-x-4">
          <button onClick={handleRecord} disabled={recordingStatus === 'Enregistrement'} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">● ENREGISTRER</button>
          <button onClick={handleStop} disabled={recordingStatus !== 'Enregistrement'} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">⏹ ARRÊTER</button>
        </div>
        <p className="mt-4 text-gray-700">Status: <span className="font-semibold">{recordingStatus}</span></p>
      </div>
    </div>
  );
}

export default ScreenRecorderModal;