import React, { useState, useEffect, useRef } from "react";
import Button from "./Button";

export interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}

export interface VideoLibraryProps {
  videos: VideoItem[];
  onOpenRecorder: () => void;
  onSelectVideo: (video: VideoItem) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentPage: number;
  totalPages: number;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
}

interface VideoItemComponentProps {
  video: VideoItem;
  onSelectVideo: (video: VideoItem) => void;
}

const VideoItemComponent: React.FC<VideoItemComponentProps> = ({
  video,
  onSelectVideo,
}) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const videoRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          window.electronAPI
            .getVideoThumbnail(video.path)
            .then((thumbnailDataUrl) => {
              if (thumbnailDataUrl) {
                setThumbnail(thumbnailDataUrl);
              }
            });
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, [video.path]);

  return (
    <li
      ref={videoRef}
      key={video.id}
      className="bg-gray-700 p-2 rounded flex items-center cursor-pointer hover:bg-gray-600 transition-all duration-300 ease-in-out transform"
      onClick={() => onSelectVideo(video)}
    >
      <div className="w-32 h-20 bg-gray-800 mr-4 flex-shrink-0">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={`Vignette de ${video.title}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Chargement...
          </div>
        )}
      </div>
      <span className="flex-grow">{video.title}</span>
      <button
        onClick={(e) => e.stopPropagation()}
        className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded ml-2"
      >
        Partager
      </button>
    </li>
  );
};

function VideoLibrary({
  videos,
  onOpenRecorder,
  onSelectVideo,
  searchQuery,
  onSearchChange,
  currentPage,
  totalPages,
  goToNextPage,
  goToPreviousPage,
}: VideoLibraryProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ma Librairie</h1>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher des vidéos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex space-x-2 mb-4">
        <Button id="VideoLibrary-button-open-recorder-modal" onClick={onOpenRecorder} color="blue" text="Ouvrir Enregistreur" />

      </div>
      
      <div className="flex-grow overflow-y-auto">
        {videos.length === 0 ? (
          <p className="text-gray-400">Aucune vidéo enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {videos.map((video) => (
              <VideoItemComponent
                key={video.id}
                video={video}
                onSelectVideo={onSelectVideo}
              />
            ))}
          </ul>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Précédent
          </button>
          <span className="text-white">
            Page {currentPage} sur {totalPages}
          </span>
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoLibrary;
