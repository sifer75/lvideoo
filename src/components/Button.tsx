interface ButtonProps {
  id: string;
  text: string;
  onClick: () => void;
  color: string;
}

function Button({ id, onClick, text, color }: ButtonProps) {
  return (
    <button
      id={id}
      className={`bg-${color}-500 hover:bg-${color}-700 text-white font-bold py-2 px-4 rounded`}
      onClick={onClick}
    >
      {text}
    </button>
  );
}

export default Button;
