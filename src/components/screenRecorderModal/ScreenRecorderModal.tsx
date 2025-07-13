import { useScreenRecorder } from "../../hooks/useScreenRecorder";

interface ScreenRecorderModalProps {
  onClose: () => void;
  isCameraOn: boolean;
  cameraStream: MediaStream | null;
  handleToggleCamera: () => Promise<void>;
}

function ScreenRecorderModal({
  onClose,
  isCameraOn,
  cameraStream,
  handleToggleCamera,
}: ScreenRecorderModalProps) {
  const {
    screenSources,
    selectedScreenSource,
    setSelectedScreenSource,
    saveFolderPath,
    recordingStatus,
    startRecording,
    stopRecording,
  } = useScreenRecorder({ isCameraOn, cameraStream });

  const handleChooseFolder = () => {
    window.electronAPI.send("open-folder-dialog", null);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-lg w-1/2 h-full relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 text-2xl"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Enregistreur d'écran
        </h2>
        <div className="space-y-2 text-gray-700">
          <p>
            📹 Caméra:{" "}
            <span className="font-semibold">{isCameraOn ? "ON" : "OFF"}</span>{" "}
            <button
              onClick={handleToggleCamera}
              className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
            >
              Toggle
            </button>
          </p>
          <p>
            🎤 Audio: <span className="font-semibold">Micro + Système</span>
          </p>
          <p>
            📁 Dossier: <span className="font-semibold">{saveFolderPath}</span>{" "}
            <button
              onClick={handleChooseFolder}
              className="ml-2 px-2 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
            >
              Choisir...
            </button>
          </p>
          <div>
            <label
              htmlFor="screen-source"
              className="block text-sm font-medium text-gray-700"
            >
              Source d'écran:
            </label>
            <select
              id="screen-source"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={selectedScreenSource || ""}
              onChange={(e) => setSelectedScreenSource(e.target.value)}
            >
              {screenSources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-6 space-x-4">
          <button
            onClick={startRecording}
            disabled={recordingStatus === "Enregistrement"}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            ● ENREGISTRER
          </button>
          <button
            onClick={stopRecording}
            disabled={recordingStatus !== "Enregistrement"}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            ⏹ ARRÊTER
          </button>
        </div>
        <p className="mt-4 text-gray-700">
          Status: <span className="font-semibold">{recordingStatus}</span>
        </p>
      </div>
    </div>
  );
}

export default ScreenRecorderModal;
