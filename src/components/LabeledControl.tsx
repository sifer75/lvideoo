import React from 'react';
import Switch from './SwitchStatus'; // Assurez-vous que le chemin est correct

interface LabeledControlProps {
  id: string;
  label: string; // Le texte du label (ex: "micro", "vidéo")
  icon: React.ReactNode; // L'icône à afficher (ex: <HiOutlineMicrophone />)
  status: boolean; // L'état ON/OFF du contrôle
  onClick: () => void; // La fonction à appeler lors du clic
}

const LabeledControl: React.FC<LabeledControlProps> = ({
  id,
  label,
  icon,
  status,
  onClick,
}) => {
  return (
    <div
      id={id}
      className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded flex w-full items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        {icon} <span>{label}</span>
      </div>
      <Switch id={`switch__${id}`} toggle={status} />
    </div>
  );
};

export default LabeledControl;
