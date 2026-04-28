import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Projects', path: '/studio' },
  { label: 'Profile', path: '/profile' },
  { label: 'Edit Profile', path: '/edit-profile' },
];

export default function ForecasterSidebar({ isSidebarCollapsed, isDarkMode }) {
  return (
    <aside
      className={`transition-all duration-300 ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'} border-r`}
    >
      <div className="p-4 font-bold text-lg">WaveLab</div>

      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : isDarkMode
                  ? 'text-gray-300 hover:bg-gray-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
