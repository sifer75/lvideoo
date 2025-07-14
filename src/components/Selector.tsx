import Switch from "./SwitchStatus";
import { ReactNode } from "react";
interface SelectorBaseProps {
  id: string;
  color: string;
  text: string | ReactNode;
  logo: ReactNode;
  onClick: () => void;
}
type Visible = SelectorBaseProps & { visible: true; status: boolean };
type Hidden = SelectorBaseProps & { visible: false };
type SelectorProps = Visible | Hidden;
function Selector(props: SelectorProps & { status?: boolean }) {
  const { id, color, text, logo, visible, onClick} = props;
  const bgclass =
    color === "blue"
      ? "bg-blue-200 hover:bg-blue-500"
      : "bg-gray-500 hover:bg-gray-700";
  return (
    <button
      className={`${bgclass} text-white font-bold py-2 px-4 rounded flex w-full items-center justify-between`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-2">
        {logo}<span>{text}</span>
      </div>
      {visible && <Switch id={`switch__${id}`} toggle={props.status} />}
    </button> 
 );
}
export default Selector;
