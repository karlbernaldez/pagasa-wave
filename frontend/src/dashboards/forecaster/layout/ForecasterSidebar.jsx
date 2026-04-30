// src/dashboards/forecaster/layout/ForecasterSidebar.jsx

import { NavLink } from "react-router-dom";

const navItems = [
  { name: "Overview", path: "/studio" },
  { name: "Project Library", path: "/studio" },
  { name: "Models", path: "/models" },
  { name: "Charts", path: "/charts" },
  { name: "Published Forecasts", path: "/published" },
  { name: "PDF / Exports", path: "/pdf" },
];

export default function ForecasterSidebar({ isOpen, onClose }) {
  return (
    <aside
      className={`
        fixed z-40 h-full w-64 bg-white border-r
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-200
        md:translate-x-0 md:static
      `}
    >
      <div className="p-4 font-bold text-lg border-b">
        WaveLab
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm ${
                isActive
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
            onClick={onClose}
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}