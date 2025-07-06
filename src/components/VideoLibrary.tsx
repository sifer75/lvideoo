import React from 'react';

interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}

interface VideoLibraryProps {
  videos: VideoItem[];
  onOpenRecorder: () => void;
  onSelectVideo: (video: VideoItem) => void;
  onShareVideo: (video: VideoItem) => void;
  onDeleteVideo: (video: VideoItem) => void;
  onImportVideo: () => void;
  selectedVideos: VideoItem[];
  onToggleSelect: (video: VideoItem) => void;
  isMultiSelectMode: boolean; // Nouvelle prop pour le mode multi-sélection
}

function VideoLibrary({ videos, onOpenRecorder, onSelectVideo, onShareVideo, onDeleteVideo, onImportVideo, selectedVideos, onToggleSelect, isMultiSelectMode, onToggleSelectMode, onDeleteSelected, onShareSelected }: VideoLibraryProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ma Librairie</h1>
      <div className="flex space-x-2 mb-4">
        <button
          onClick={onOpenRecorder}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Ouvrir Enregistreur
        </button>
        <button
          onClick={onImportVideo}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          Importer une vidéo
        </button>
        <button
          onClick={onToggleSelectMode}
          className={`py-2 px-4 rounded ${isMultiSelectMode ? 'bg-green-700' : 'bg-gray-500'} hover:bg-green-600`}
        >
          {isMultiSelectMode ? 'Désactiver Multi-sélection' : 'Activer Multi-sélection'}
        </button>
      </div>
      {isMultiSelectMode && selectedVideos.length > 0 && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={onDeleteSelected}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Supprimer la sélection ({selectedVideos.length})
          </button>
          <button
            onClick={onShareSelected}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Partager la sélection ({selectedVideos.length})
          </button>
        </div>
      )}
      <div className="flex-grow overflow-y-auto">
        {videos.length === 0 ? (
          <p className="text-gray-400">Aucune vidéo enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {videos.map((video) => (
              <li
                key={video.id}
                className={`bg-gray-700 p-2 rounded flex justify-between items-center cursor-pointer ${!isMultiSelectMode ? 'hover:bg-gray-600 transition-all duration-300 ease-in-out transform' : ''}`}
              >
                {isMultiSelectMode && (
                  <input
                    type="checkbox"
                    checked={selectedVideos.some(v => v.id === video.id)}
                    onChange={() => onToggleSelect(video)}
                    className="mr-2"
                  />
                )}
                <span onClick={() => onSelectVideo(video)} className="flex-grow">{video.title}</span>
                <button
                  onClick={() => onShareVideo(video)}
                  className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded ml-2"
                >
                  Partager
                </button>
                <button
                  onClick={() => onDeleteVideo(video)}
                  className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded ml-2"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VideoLibrary;