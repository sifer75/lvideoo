import React, { useState, useEffect, useRef } from "react";
import ScreenRecorderModal from "./components/screenRecorderModal/ScreenRecorderModal";
import VideoLibrary from "./components/VideoLibrary";
interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}
function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showScreenRecorderModal, setShowScreenRecorderModal] =
    useState<boolean>(true);
  const [activeView, setActiveView] = useState<"recorder" | "library">(
    "library",
  ); 
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1); 
  const [itemsPerPage] = useState<number>(10); 
  const [showShareConfirmation, setShowShareConfirmation] =
    useState<boolean>(false);
  const [shareConfirmationMessage, setShareConfirmationMessage] =
    useState<string>("");
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const refreshVideoList = async () => {
    const storedPath = await window.electronAPI.getStoredSaveFolderPath();
    if (storedPath) {
      const videoUrls = await window.electronAPI.getVideosInFolder(storedPath);
      const newVideos = videoUrls.map((url) => ({
        id: url,
        title: url.split(/[\\/]/).pop() || "Vidéo",
        path: url,
        shareLink: "",
      }));
      setVideos(newVideos);
    }
  };
  
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  
  const indexOfLastVideo = currentPage * itemsPerPage;
  const indexOfFirstVideo = indexOfLastVideo - itemsPerPage;
  const paginatedVideos = filteredVideos.slice(
    indexOfFirstVideo,
    indexOfLastVideo,
  );
  
  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
  
  const goToNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };
  const goToPreviousPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };
  useEffect(() => {
    
    const cleanupVideoFile = window.electronAPI.receive(
      "selected-video-file",
      (filePath: string) => {
        if (filePath) {
          const fileName = filePath.split(/[\\/]/).pop() || "Nouvelle Vidéo";
          setVideos((prevVideos) => [
            ...prevVideos,
            {
              id: Date.now().toString(),
              title: fileName,
              path: filePath,
              shareLink: "",
            },
          ]);
        }
      },
    );
    
    const cleanupSaveSuccess = window.electronAPI.onSaveRecordingSuccess(
      (filePath: string) => {
        alert(`Enregistrement sauvegardé avec succès: ${filePath}`);
        refreshVideoList(); 
      },
    );
    const cleanupSaveError = window.electronAPI.onSaveRecordingError(
      (errorMessage: string) => {
        alert(
          `Erreur lors de la sauvegarde de l'enregistrement: ${errorMessage}`,
        );
      },
    );
    
    refreshVideoList();
    return () => {
      cleanupVideoFile();
      cleanupSaveSuccess();
      cleanupSaveError();
    };
  }, []);
  
  useEffect(() => {
    if (isCameraOn && cameraStreamRef.current && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = cameraStreamRef.current;
      cameraVideoRef.current
        .play()
        .catch((e) => console.error("Error playing camera stream:", e));
    } else if (!isCameraOn && cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
  }, [isCameraOn, cameraStreamRef.current]);
  const handleToggleCamera = async () => {
    if (isCameraOn) {
      
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraOn(false);
    } else {
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
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
  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
  };
  const handleCloseRecorderModal = () => {
    setShowScreenRecorderModal(false);
    if (isCameraOn) {
      handleToggleCamera(); 
    }
  };
  return (
    <div className="flex flex-col md:flex-row h-auto">
      <div className="flex-grow p-4 relative w-full md:w-3/4 lg:w-4/5">
        {activeView === "library" && (
          <VideoLibrary
            videos={paginatedVideos}
            onOpenRecorder={() => setShowScreenRecorderModal(true)}
            onSelectVideo={handleSelectVideo}
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
            <video
              controls
              autoPlay
              key={selectedVideo.id}
              src={selectedVideo.path}
              className="w-full h-auto"
            ></video>
          </div>
        )}
      </div>
      {showScreenRecorderModal && (
        <ScreenRecorderModal
          id={""}
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
