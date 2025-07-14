import { useScreenRecorder } from "../../hooks/useScreenRecorder";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { BsCameraVideoOff } from "react-icons/bs";
import { SlScreenDesktop } from "react-icons/sl";

import Button from "../Button";
import MenuModal from "../MenuModal";
import Selector from "../Selector";
import ScreenSourceSelector from "../ScreenSourceSelector";

interface ScreenRecorderModalProps {
  id: string;
  onClose: () => void;
  isCameraOn: boolean;
  cameraStream: MediaStream | null;
  handleToggleCamera: () => Promise<void>;
}

function ScreenRecorderModal({
  id,
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
console.log(setSelectedScreenSource, "coucuos")
  return (
    <div
      id={`ScreenRecorderModal__overlay__${id}`}
      className="fixed inset-0 bg-white bg-opacity-70 flex justify-end z-50 p-10"
      onClick={onClose}
    >
      <div
        id={`ScreenRecorderModal__modal__${id}`}
        className="bg-white p-6 space-y-3 rounded-xl shadow-lg w-fit relative h-fit flex flex-col min-w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <MenuModal id={`ScreenRecorderModal__menu__${id}`} onClose={onClose} />
        <ScreenSourceSelector
          id={`ScreenRecorderModal__selector__${id}`}
          screenSources={screenSources}
          selectedScreenSource={selectedScreenSource}
          setSelectedScreenSource={setSelectedScreenSource}
        />
        <Selector
          id={`ScreenRecorderModal__selector__${id}`}
          color="gray"
          text="micro"
          logo={<HiOutlineMicrophone color="black" size={20} />}
          status={isCameraOn}
          visible={true}
          onClick={handleToggleCamera}
        />
        <Selector
          id={`ScreenRecorderModal__selector__${id}`}
          color="gray"
          text="vidéo"
          logo={<BsCameraVideoOff color="black" size={20} />}
          status={isCameraOn}
          visible={true}
          onClick={handleToggleCamera}
        />
        <Button
          id={`ScreenRecorderModal__button__record__${id}`}
          onClick={startRecording}
          disabled={recordingStatus === "Enregistrement"}
          color={"orange"}
          text="Enregistrement"
        />
        <Button
          id={`ScreenRecorderModal__button__stop__${id}`}
          onClick={stopRecording}
          disabled={recordingStatus !== "Enregistrement"}
          color={"red"}
          text="Arrêt"
        />
        <p className="mt-4 text-gray-700">
          Status: <span className="font-semibold">{recordingStatus}</span>
        </p>
      </div>
    </div>
  );
}

export default ScreenRecorderModal;
