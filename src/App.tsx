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
  const [selectedVideos, setSelectedVideos] = useState<VideoItem[]>([]); // Nouvel état pour la sélection multiple
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false); // Nouvel état pour le mode multi-sélection
  const [searchQuery, setSearchQuery] = useState<string>(''); // Nouvel état pour la chaîne de recherche
  const [currentPage, setCurrentPage] = useState<number>(1); // Nouvel état pour la page actuelle
  const [itemsPerPage] = useState<number>(10); // Nombre d'éléments par page
  const [showShareConfirmation, setShowShareConfirmation] = useState<boolean>(false);
  const [shareConfirmationMessage, setShareConfirmationMessage] = useState<string>('');

  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const refreshVideoList = async () => {
    const storedPath = await window.electronAPI.getStoredSaveFolderPath();
    if (storedPath) {
      const videoUrls = await window.electronAPI.getVideosInFolder(storedPath);
      const newVideos = videoUrls.map(url => ({
        id: url,
        title: url.split(/[\\/]/).pop() || 'Vidéo',
        path: url,
        shareLink: '',
      }));
      setVideos(newVideos);
    }
  };

  // Filtrer les vidéos en fonction de la chaîne de recherche
  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculer les vidéos pour la page actuelle
  const indexOfLastVideo = currentPage * itemsPerPage;
  const indexOfFirstVideo = indexOfLastVideo - itemsPerPage;
  const paginatedVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

  // Fonctions pour changer de page
  const goToNextPage = () => {
    setCurrentPage(prevPage => Math.min(prevPage + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
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

  const handleToggleSelect = (video: VideoItem) => {
    setSelectedVideos(prevSelected =>
      prevSelected.some(v => v.id === video.id)
        ? prevSelected.filter(v => v.id !== video.id)
        : [...prevSelected, video]
    );
  };

  const handleShareVideo = (video: VideoItem) => {
    window.electronAPI.copyToClipboard(video.path);
    setShareConfirmationMessage(`Lien de partage copié: ${video.path}`);
    setShowShareConfirmation(true);
    setTimeout(() => {
      setShowShareConfirmation(false);
      setShareConfirmationMessage('');
    }, 3000); // Masquer après 3 secondes
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

  const handleImportVideo = async () => {
    const result = await window.electronAPI.openVideoFileDialog();
    if (!result.canceled && result.filePath) {
      refreshVideoList();
      alert(`Vidéo importée avec succès: ${result.filePath}`);
    } else if (result.error) {
      alert(`Erreur lors de l'importation de la vidéo: ${result.error}`);
    }
  };

  const handleDeleteSelectedVideos = async () => {
    if (selectedVideos.length === 0) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer ${selectedVideos.length} vidéo(s) sélectionnée(s) ?`)) {
      for (const video of selectedVideos) {
        try {
          await window.electronAPI.deleteVideo(video.path);
        } catch (error) {
          alert(`Erreur lors de la suppression de la vidéo "${video.title}": ${error.message}`);
        }
      }
      setSelectedVideos([]); // Réinitialiser la sélection
      refreshVideoList(); // Rafraîchir la liste
      setSelectedVideo(null); // Désélectionner la vidéo affichée si elle a été supprimée
    }
  };

  const handleShareSelectedVideos = () => {
    if (selectedVideos.length === 0) return;

    const shareLinks = selectedVideos.map(video => video.path).join('\n');
    window.electronAPI.copyToClipboard(shareLinks);
    setShareConfirmationMessage(`${selectedVideos.length} lien(s) de partage copié(s) dans le presse-papiers.`);
    setShowShareConfirmation(true);
    setTimeout(() => {
      setShowShareConfirmation(false);
      setShareConfirmationMessage('');
    }, 3000); // Masquer après 3 secondes
  };

  const handleCloseRecorderModal = () => {
    setShowScreenRecorderModal(false);
    if (isCameraOn) {
      handleToggleCamera(); // Arrête la caméra si elle est active
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Menu latéral gauche */}
      <div className="w-full md:w-1/4 lg:w-1/5 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <button
          onClick={() => setActiveView('library')}
          className={`py-2 px-4 rounded mb-2 ${activeView === 'library' ? 'bg-blue-700' : 'bg-gray-700'} hover:bg-blue-600`}
        >
          Ma Librairie
        </button>
      </div>

      {/* Contenu principal */}
      <div className="flex-grow p-4 relative w-full md:w-3/4 lg:w-4/5">
        {activeView === 'library' && (
          <VideoLibrary
            videos={paginatedVideos}
            onOpenRecorder={() => setShowScreenRecorderModal(true)}
            onSelectVideo={handleSelectVideo}
            onShareVideo={handleShareVideo}
            onDeleteVideo={handleDeleteVideo}
            onImportVideo={handleImportVideo}
            selectedVideos={selectedVideos}
            onToggleSelect={handleToggleSelect}
            isMultiSelectMode={isMultiSelectMode}
            onToggleSelectMode={() => setIsMultiSelectMode(prev => !prev)}
            onDeleteSelected={handleDeleteSelectedVideos}
            onShareSelected={handleShareSelectedVideos}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            currentPage={currentPage}
            totalPages={totalPages}
            goToNextPage={goToNextPage}
            goToPreviousPage={goToPreviousPage}
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

      {showShareConfirmation && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50">
          {shareConfirmationMessage}
        </div>
      )}
    </div>
  );
}

export default App;