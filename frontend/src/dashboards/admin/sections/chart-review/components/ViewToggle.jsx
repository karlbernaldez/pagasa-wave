import { LayoutGrid, List } from 'lucide-react';

const VIEWS = [
  { id: 'cards', icon: LayoutGrid, label: 'Cards' },
  { id: 'list', icon: List, label: 'List' },
];

const ViewToggle = ({ value, onChange, isDarkMode }) => (
  <div
    className={`inline-flex rounded-xl border p-1 ${
      isDarkMode ? 'border-gray-700 bg-gray-800/60' : 'border-gray-200 bg-white'
    }`}
  >
    {VIEWS.map(({ id, icon: Icon, label }) => (
      <button
        key={id}
        onClick={() => onChange(id)}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 transition-all duration-150 ${
          value === id
            ? 'bg-blue-500 text-white shadow-sm'
            : isDarkMode
            ? 'text-gray-400 hover:text-gray-200'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Icon size={14} />
        {label}
      </button>
    ))}
  </div>
);

export default ViewToggle;