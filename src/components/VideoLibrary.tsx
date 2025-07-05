import React from 'react';

interface VideoItem {
  id: string;
  title: string;
  path: string;
  shareLink: string;
}

interface VideoLibraryProps {
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onShareVideo: (video: VideoItem) => void;
  onDeleteVideo: (video: VideoItem) => void;
}

function VideoLibrary({ videos, onSelectVideo, onShareVideo, onDeleteVideo }: VideoLibraryProps) {
  return (
    <div className="flex-grow overflow-y-auto">
      {videos.length === 0 ? (
        <p className="text-gray-400">Aucune vidéo enregistrée.</p>
      ) : (
        <ul className="space-y-2">
          {videos.map((video) => (
            <li
              key={video.id}
              className="bg-gray-700 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-gray-600"
              onClick={() => onSelectVideo(video)}
            >
              <span>{video.title}</span>
              <div className="space-x-2">
                <button
                  className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShareVideo(video);
                  }}
                >
                  Partager
                </button>
                <button
                  className="bg-red-500 hover:bg-red-700 text-white text-xs py-1 px-2 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteVideo(video);
                  }}
                >
                  Supprimer
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default VideoLibrary;
