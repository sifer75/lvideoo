import { SlScreenDesktop } from "react-icons/sl";
interface ScreenSourceSelectorProps {
  id: string;
  screenSources: { id: string; name: string }[];
  selectedScreenSource: string | null;
  setSelectedScreenSource: (sourceId: string) => void;
}
function ScreenSourceSelector({
  id,
  screenSources,
  selectedScreenSource,
  setSelectedScreenSource,
}: ScreenSourceSelectorProps) {
  return (
    <div
      className="relative w-full
      bg-gray-500 text-white font-bold rounded
      cursor-pointer"
    >
      <div
        className="absolute left-3
      top-1/2 -translate-y-1/2 z-10 pl-1"
      >
        <SlScreenDesktop color="black" size={20} />
      </div>
      <select
        id={`ScreenSourceSelector__${id}`}
        className="block w-full py-2
      pl-11 pr-10 bg-transparent
      appearance-none focus:outline-none
      rounded cursor-pointer"
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
  );
}
export default ScreenSourceSelector;
