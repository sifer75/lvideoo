import { RiCloseLine } from "react-icons/ri";
import { LuHouse } from "react-icons/lu";

import Button from "./Button";

interface MenuModalProps {
  id: string;
  onClose: () => void;
}

function MenuModal({ id, onClose }: MenuModalProps) {
  return (
    <div id={`MenuModal__${id}`} className="w-full flex justify-between">
      <Button
        id={`ScreenRecorderModal__button__close__${id}`}
        onClick={onClose}
        color={"white"}
        logo={<RiCloseLine color="black" size={30} />}
      />
      <Button
        id={`ScreenRecorderModal__button__homepage__${id}`}
        onClick={onClose}
        color={"white"}
        logo={<LuHouse color="black" size={30} />}
      />
    </div>
  );
}

export default MenuModal;
