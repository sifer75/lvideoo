import Button from "../Button";
import VideoItemComponent from "./VideoItemComponent";
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
        <Button
          id="VideoLibrary-button-open-recorder-modal"
          onClick={onOpenRecorder}
          color="blue"
          text="Ouvrir Enregistreur"
        />
      </div>

      <div className="flex-grow overflow-y-auto">
        {videos.length === 0 ? (
          <p className="text-gray-400">Aucune vidéo enregistrée.</p>
        ) : (
          <ul className="flex flex-wrap justify-between gap-5">
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
