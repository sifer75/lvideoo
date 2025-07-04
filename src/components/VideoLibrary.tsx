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
}

function VideoLibrary({ videos, onOpenRecorder }: VideoLibraryProps) {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ma Librairie</h1>
      <button
        onClick={onOpenRecorder}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Ouvrir Enregistreur
      </button>
      <div className="flex-grow overflow-y-auto">
        {videos.length === 0 ? (
          <p className="text-gray-400">Aucune vidéo enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {videos.map((video) => (
              <li key={video.id} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                <span>{video.title}</span>
                <button className="bg-blue-500 hover:bg-blue-700 text-white text-xs py-1 px-2 rounded">Partager</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default VideoLibrary;
