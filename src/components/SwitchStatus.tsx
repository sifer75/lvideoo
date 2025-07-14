interface SwitchStatusProps {
  id: string;
  toggle: boolean;
}

function SwitchStatus({ id, toggle }: SwitchStatusProps) {
  return (
    <div
      id={`SwitchStatus__${id}`}
      className="rounded-lg px-1.5 py-1 text-xs"
      style={{ backgroundColor: toggle ? "#15803d" : "#7f1d1d" }}
    >
      {toggle ? "On" : "Off"}
    </div>
  );
}

export default SwitchStatus;
