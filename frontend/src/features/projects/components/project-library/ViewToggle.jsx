import { LayoutGrid, List } from "lucide-react";

export default function ViewToggle({
  view,
  setView,
  isDarkMode,
}) {
  const base =
    "inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition sm:h-10 sm:flex-none sm:px-3";

  const active =
    "bg-cyan-500 text-white shadow-sm";

  const inactive = isDarkMode
    ? "text-cyan-300 hover:bg-white/5"
    : "text-blue-600 hover:bg-blue-50";

  return (
    <div
      className={`grid w-full grid-cols-2 rounded-2xl border p-1 shadow-sm sm:inline-grid sm:w-auto ${
        isDarkMode
          ? "border-white/10 bg-slate-900"
          : "border-slate-200 bg-white"
      }`}
    >
      <button
        type="button"
        aria-label="Cards"
        aria-pressed={view === "grid"}
        className={`${base} ${
          view === "grid"
            ? active
            : inactive
        }`}
        onClick={() =>
          setView("grid")
        }
      >
        <LayoutGrid size={16} />
        <span className="sm:hidden">
          Cards
        </span>
      </button>

      <button
        type="button"
        aria-label="List"
        aria-pressed={view === "list"}
        className={`${base} ${
          view === "list"
            ? active
            : inactive
        }`}
        onClick={() =>
          setView("list")
        }
      >
        <List size={16} />
        <span className="sm:hidden">
          List
        </span>
      </button>
    </div>
  );
}