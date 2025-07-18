import React, { useState, useEffect } from "react";
import ScreenRecorderModal from "./components/screenRecorderModal/ScreenRecorderModal";
import VideoLibrary from "./components/VideoLibrary/VideoLibrary";
interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}
function App() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [showScreenRecorderModal, setShowScreenRecorderModal] =
    useState<boolean>(false);
  const [activeView, setActiveView] = useState<"library" | "recorder">(
    "library",
  );
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(9);
  const refreshVideoList = async () => {
    const storedPath = await window.electronAPI.getStoredSaveFolderPath();
    if (storedPath) {
      const videoUrls = await window.electronAPI.getVideosInFolder(storedPath);
      const newVideos = videoUrls.map((url) => ({
        id: url,
        title: url.split(/[/]/).pop() || "Vidéo",
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
          const fileName = filePath.split(/[/]/).pop() || "Nouvelle Vidéo";
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

  const handleSelectVideo = (video: VideoItem) => {
    setSelectedVideo(video);
  };
  const handleCloseRecorderModal = () => {
    setShowScreenRecorderModal(false);
  };
  return (
    <div className="flex flex-col md:flex-row h-auto">
      <div className="w-full md:w-1/4 lg:w-1/5 bg-gray-800 text-white flex flex-col p-4">
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <button
          onClick={() => setActiveView("library")}
          className={`py-2 px-4 rounded mb-2 ${
            activeView === "library" ? "bg-blue-700" : "bg-gray-700"
          } hover:bg-blue-600`}
        >
          Ma Librairie
        </button>
      </div>
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
        {activeView === "recorder" && (
          <ScreenRecorderModal
            id={`ScreenRecorderModal__`}
            onClose={handleCloseRecorderModal}
          />
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
            />
          </div>
        )}
      </div>
      {showScreenRecorderModal && (
        <ScreenRecorderModal
          id={`ScreenRecorderModal`}
          onClose={handleCloseRecorderModal}
        />
      )}
    </div>
  );
}
export default App;
