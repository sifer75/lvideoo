import { useScreenRecorder } from "../../hooks/useScreenRecorder";
import { HiOutlineMicrophone } from "react-icons/hi2";
import { BsCameraVideoOff, BsCameraVideoFill } from "react-icons/bs";
import { CiFolderOn } from "react-icons/ci";
import Button from "../Button";
import MenuModal from "../MenuModal";
import ScreenSourceSelector from "../ScreenSourceSelector";
import LabeledControl from "../LabeledControl"; // Import the new LabeledControl component
import { useState, useRef, useEffect } from "react";

interface ScreenRecorderModalProps {
  id: string;
  onClose: () => void;
}

function ScreenRecorderModal({ id, onClose }: ScreenRecorderModalProps) {
  const [isMicrophoneOn, setIsMicrophoneOn] = useState<boolean>(true);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(false);
  const [showCameraPreviewModal, setShowCameraPreviewModal] = useState<boolean>(false);

  const {
    screenSources,
    selectedScreenSource,
    setSelectedScreenSource,
    saveFolderPath,
    recordingStatus,
    startRecording,
    stopRecording,
  } = useScreenRecorder({ isMicrophoneOn, isCameraOn });

  const handleChooseFolder = () => {
    window.electronAPI.send("open-folder-dialog", null);
  };

  const handleToggleMicrophone = () => {
    setIsMicrophoneOn((prev) => !prev);
  };

  const cameraStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleToggleCamera = async () => {
    if (isCameraOn) {
      // Turn off camera
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
      setIsCameraOn(false);
      setShowCameraPreviewModal(false);
    } else {
      // Turn on camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsCameraOn(true);
        setShowCameraPreviewModal(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        alert("Impossible d'accéder à la caméra. Veuillez vérifier vos permissions.");
        setIsCameraOn(false);
        setShowCameraPreviewModal(false);
      }
    }
  };

  const handleCloseCameraPreview = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setIsCameraOn(false);
    setShowCameraPreviewModal(false);
  };

  useEffect(() => {
    if (showCameraPreviewModal && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [showCameraPreviewModal, cameraStreamRef.current]);

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
        <Button
          id={`ScreenRecorderModal__button__choose__${id}`}
          color="gray"
          onClick={handleChooseFolder}
          text={
            <div className="flex items-center space-x-2 pl-2">
              <CiFolderOn color="black" size={20} />
              <span className="font-semibold">{saveFolderPath}</span>
            </div>
          }
        />
        <LabeledControl
          id={`ScreenRecorderModal__microphone__${id}`}
          label="micro"
          icon={<HiOutlineMicrophone color="black" size={20} />}
          status={isMicrophoneOn}
          onClick={handleToggleMicrophone}
        />
        <LabeledControl
          id={`ScreenRecorderModal__camera__${id}`}
          label="vidéo"
          icon={
            isCameraOn ? (
              <BsCameraVideoFill color="black" size={20} />
            ) : (
              <BsCameraVideoOff color="black" size={20} />
            )
          }
          status={isCameraOn}
          onClick={handleToggleCamera}
        />
        <Button
          id={`ScreenRecorderModal__button__record__${id}`}
          onClick={() => {
            console.log("Before startRecording - isCameraOn:", isCameraOn);
            console.log("Before startRecording - cameraStreamRef.current:", cameraStreamRef.current);
            startRecording(isCameraOn ? cameraStreamRef.current : null);
          }}
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

        {showCameraPreviewModal && (
          <div
            className="fixed left-2 bottom-2 h-fit bg-opacity-50 flex justify-center items-left z-50"
            onClick={handleCloseCameraPreview}
          >
            <div
              className="bg-white p-4 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <video ref={videoRef} autoPlay playsInline className="w-72 h-auto rounded-md"></video>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ScreenRecorderModal;
