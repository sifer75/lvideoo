import React, { useState, useEffect, useRef } from 'react';
import ScreenRecorderModal from './components/ScreenRecorderModal';
import VideoLibrary from './components/VideoLibrary';

interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}

function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showScreenRecorderModal, setShowScreenRecorderModal] = useState<boolean>(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);

  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const refreshVideoList = async () => {
    const storedPath = await window.electronAPI.getStoredSaveFolderPath();
    if (storedPath) {
      const videoPaths = await window.electronAPI.getVideosInFolder(storedPath);
      const newVideos = videoPaths.map(path => ({
        id: path,
        title: path.split(/[\\/]/).pop() || 'Vidéo',
        path: path,
        shareLink: '',
      }));
      setVideos(newVideos);
    }
  };

  useEffect(() => {
    // Écoute la réponse du processus principal après la sélection d'un fichier vidéo
    const cleanupVideoFile = window.electronAPI.receive('selected-video-file', (filePath: string) => {
      if (filePath) {
        const fileName = filePath.split(/[\\/]/).pop() || 'Nouvelle Vidéo';
        setVideos(prevVideos => [...prevVideos, { id: Date.now().toString(), title: fileName, path: filePath, shareLink: '' }]);
      }
    });

    // Écoute les messages de succès/erreur de sauvegarde depuis la modale
    const cleanupSaveSuccess = window.electronAPI.onSaveRecordingSuccess((filePath: string) => {
      alert(`Enregistrement sauvegardé avec succès: ${filePath}`);
      refreshVideoList(); // Rafraîchir la liste après la sauvegarde
    });
    const cleanupSaveError = window.electronAPI.onSaveRecordingError((errorMessage: string) => {
      alert(`Erreur lors de la sauvegarde de l'enregistrement: ${errorMessage}`);
    });

    // Écoute les messages de succès/erreur de suppression
    const cleanupDeleteSuccess = window.electronAPI.onDeleteVideoSuccess((filePath: string) => {
      alert(`Vidéo supprimée avec succès: ${filePath}`);
      refreshVideoList(); // Rafraîchir la liste après la suppression
      setSelectedVideo(null); // Désélectionner la vidéo si elle est supprimée
    });
    const cleanupDeleteError = window.electronAPI.onDeleteVideoError((errorMessage: string) => {
      alert(`Erreur lors de la suppression de la vidéo: ${errorMessage}`);
    });

    // Au montage, demander la liste initiale des vidéos
    refreshVideoList();

    return () => {
      cleanupVideoFile();
      cleanupSaveSuccess();
      cleanupSaveError();
      cleanupDeleteSuccess();
      cleanupDeleteError();
    };
  }, []);

  // Gérer le flux de la caméra et l'élément vidéo sur la page principale
  useEffect(() => {
    if (isCameraOn && cameraStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
      cameraVideoRef.current.play().catch(e => console.error("Error playing camera stream:", e));
    } else if (!isCameraOn && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, [isCameraOn, cameraStreamRef.current]);

  const handleToggleCamera = async () => {
    if (isCameraOn) {
      // Arrêter la caméra
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraOn(false);
    } else {
      // Démarrer la caméra
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        setIsCameraOn(true);
      } catch (error) {
        console.error('Erreur lors de l\'accès à la caméra:', error);
        alert('Impossible d\'accéder à la caméra. Veuillez vérifier les permissions.');
      }
    }
  };

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
  };

  const handleCloseRecorderModal = () => {
    setShowScreenRecorderModal(false);
    if (isCameraOn) {
      handleToggleCamera(); // Arrête la caméra si elle est active
    }
  };

  const handleShareVideo = (video: VideoItem) => {
    window.electronAPI.copyToClipboard(video.path);
    // alert(`Chemin de la vidéo copié dans le presse-papiers: ${video.path}`); // Supprimé
  };

  const handleDeleteVideo = (video: VideoItem) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${video.title}" ?`)) {
      window.electronAPI.deleteVideo(video.path);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Erreur de chargement vidéo:', e.currentTarget.error);
    alert(`Erreur lors du chargement de la vidéo: ${e.currentTarget.error?.message || 'Erreur inconnue'}`);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/4 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4">Ma Librairie</h2>
        <VideoLibrary
          videos={videos}
          onSelectVideo={handleSelectVideo}
          onShareVideo={handleShareVideo}
          onDeleteVideo={handleDeleteVideo}
        />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4 relative">
        <button
          onClick={() => setShowScreenRecorderModal(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Ouvrir Enregistreur
        </button>

        {selectedVideo ? (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
            <video controls src={selectedVideo.path} className="w-full h-auto" onError={handleVideoError}></video>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Sélectionnez une vidéo pour la lire.</p>
          </div>
        )}

        {isCameraOn && (
          <video
            ref={cameraVideoRef}
            className="absolute bottom-4 left-4 w-[200px] h-[150px] rounded-full bg-white bg-opacity-20 border-2 border-gray-400 z-[51]"
            autoPlay
            muted
          ></video>
        )}
      </div>

      {showScreenRecorderModal && (
        <ScreenRecorderModal
          onClose={handleCloseRecorderModal}
          isCameraOn={isCameraOn}
          cameraStream={cameraStreamRef.current}
          handleToggleCamera={handleToggleCamera}
        />
      )}
    </div>
  );
}

export default App;