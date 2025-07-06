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
  const [activeView, setActiveView] = useState<'recorder' | 'library'>('library'); // 'recorder' ou 'library'
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null); // Nouvelle état pour la vidéo sélectionnée

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

    // Au montage, demander la liste initiale des vidéos
    refreshVideoList();

    return () => {
      cleanupVideoFile();
      cleanupSaveSuccess();
      cleanupSaveError();
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

  const handleShareVideo = (video: VideoItem) => {
    // Ici, nous allons copier le chemin de la vidéo dans le presse-papiers
    // Dans une application réelle, vous généreriez un lien de partage unique
    window.electronAPI.copyToClipboard(video.path);
    alert(`Lien de partage copié: ${video.path}`);
  };

  const handleDeleteVideo = async (video: VideoItem) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la vidéo "${video.title}" ?`)) {
      try {
        await window.electronAPI.deleteVideo(video.path);
        alert(`Vidéo "${video.title}" supprimée avec succès.`);
        setVideos(prevVideos => prevVideos.filter(v => v.id !== video.id));
        setSelectedVideo(null); // Désélectionner la vidéo si elle est supprimée
      } catch (error) {
        alert(`Erreur lors de la suppression de la vidéo: ${error.message}`);
      }
    }
  };

  const handleCloseRecorderModal = () => {
    setShowScreenRecorderModal(false);
    if (isCameraOn) {
      handleToggleCamera(); // Arrête la caméra si elle est active
    }
  };

  return (
    <div className="flex h-screen">
      {/* Menu latéral gauche */}
      <div className="w-64 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <button
          onClick={() => setActiveView('library')}
          className={`py-2 px-4 rounded mb-2 ${activeView === 'library' ? 'bg-blue-700' : 'bg-gray-700'} hover:bg-blue-600`}
        >
          Ma Librairie
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-grow p-4 relative">
        {activeView === 'library' && (
          <VideoLibrary
            videos={videos}
            onOpenRecorder={() => setShowScreenRecorderModal(true)}
            onSelectVideo={handleSelectVideo}
            onShareVideo={handleShareVideo}
            onDeleteVideo={handleDeleteVideo}
          />
        )}
        
        {isCameraOn && (
          <video
            ref={cameraVideoRef}
            className="absolute bottom-4 left-4 w-[200px] h-[150px] rounded-full bg-white bg-opacity-20 border-2 border-gray-400 z-[51]"
            autoPlay
            muted
          ></video>
        )}

        {selectedVideo && (
          <div className="mt-4">
            <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
            <video controls src={selectedVideo.path} className="w-full h-auto"></video>
          </div>
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