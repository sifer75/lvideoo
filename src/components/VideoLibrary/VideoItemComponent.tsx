import { useEffect, useRef, useState } from "react";

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
      className="w-80 h-80 rounded-2xl flex border flex-col items-center cursor-pointer hover:bg-gray-600 transition-all duration-300 ease-in-out transform"
      onClick={() => onSelectVideo(video)}
    >
      <div
        id="video-thumbnail"
        className="w-full h-1/2 bg-gray-800 flex-shrink-0"
      >
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
      <div className="w-full h-1/2 flex flex-col items-center p-2 justify-center">
        <span>{video.title}</span>
      </div>
    </li>
  );
};
export default VideoItemComponent;
