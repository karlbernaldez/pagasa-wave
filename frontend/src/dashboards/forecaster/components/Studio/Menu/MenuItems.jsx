import React from "react";
import { ChevronRight } from "lucide-react";

/**
 * Collapsible section within the project menu.
 */
export const MenuSection = React.memo(
  ({ title, icon, active, toggle, children, isDarkMode }) => (
    <div>
      <button
        onClick={toggle}
        className={`w-full flex justify-between items-center px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
          isDarkMode
            ? "hover:bg-white/10 text-slate-200"
            : "hover:bg-black/10 text-slate-800"
        }`}
      >
        <span className="flex gap-2 items-center">
          {icon}
          {title}
        </span>
        <ChevronRight
          size={12}
          strokeWidth={3}
          className={`transition-transform duration-200 ${
            active ? "rotate-90" : ""
          }`}
        />
      </button>

      {active && (
        <div className="ml-4 mt-1 space-y-0.5">{children}</div>
      )}
    </div>
  )
);

MenuSection.displayName = "MenuSection";

/**
 * Single clickable item inside a MenuSection.
 */
export const MenuItem = React.memo(({ onClick, icon, label, isDarkMode }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
      isDarkMode
        ? "hover:bg-white/10 text-slate-300 hover:text-white"
        : "hover:bg-black/10 text-slate-700 hover:text-slate-900"
    }`}
  >
    {icon}
    {label}
  </button>
));

MenuItem.displayName = "MenuItem";