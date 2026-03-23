import { AlertCircle } from 'lucide-react';

const panelCls = (isDarkMode) =>
  `rounded-2xl border p-8 text-sm text-center ${
    isDarkMode
      ? 'bg-gray-800/50 border-gray-700/50 text-gray-400'
      : 'bg-white border-gray-200 text-gray-500'
  }`;

export const LoadingState = ({ isDarkMode }) => (
  <div className={panelCls(isDarkMode)}>
    <div className="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
    <p>Loading projects…</p>
  </div>
);

export const ErrorState = ({ message, isDarkMode }) => (
  <div
    className={`rounded-2xl border p-6 text-sm flex items-center gap-3 ${
      isDarkMode
        ? 'bg-red-900/20 border-red-800/40 text-red-300'
        : 'bg-red-50 border-red-200 text-red-700'
    }`}
  >
    <AlertCircle size={16} className="shrink-0" />
    {message}
  </div>
);

export const EmptyState = ({ isDarkMode }) => (
  <div className={panelCls(isDarkMode)}>No projects found.</div>
);