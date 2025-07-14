import { ReactNode } from "react";
interface ButtonProps {
  id: string;
  text?: string;
  onClick: () => void;
  color: string;
  disabled?: boolean;
  logo?: ReactNode;
}

function Button({ id, onClick, text, color, disabled, logo }: ButtonProps) {
  const bgclass =
    color === "white"
      ? "bg-white hover:bg-gray-100"
      : color === "black"
      ? "bg-black hover:bg-gray-900"
      : color === "blue"
      ? "bg-blue-200 hover:bg-blue-500"
      : color === "green"
      ? "bg-green-200 hover:bg-green-500"
      : color === "red"
      ? "bg-red-500 hover:bg-red-700"
      : color === "gray"
      ? "bg-gray-200 hover:bg-gray-500"
      : "bg-orange-500 hover:bg-orange-700";

  return (
    <button
      id={id}
      className={`${bgclass} text-white font-bold p-2  rounded`}
      onClick={onClick}
      disabled={disabled}
    >
      {text ? text : logo}
    </button>
  );
}

export default Button;
