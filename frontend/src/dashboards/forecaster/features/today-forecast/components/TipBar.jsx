import { Lightbulb } from 'lucide-react';
import { divider } from '../utils/theme';

const shortcuts = [
  { key: 'B', label: 'Brush' },
  { key: 'E', label: 'Eraser' },
  { key: 'Z', label: 'Undo' },
  { key: 'Y', label: 'Redo' },
  { key: 'Space', label: 'Pan', active: true },
];

export default function TipBar({
  isDarkMode,
}) {
  return (
    <div
      className={`
        h-12
        flex-shrink-0
        flex
        items-center
        gap-4
        border-t
        px-6
        ${divider(isDarkMode)}
        ${
          isDarkMode
            ? 'bg-[#061529]'
            : 'bg-white'
        }
      `}
    >
      <div className="flex items-center gap-1.5">
        <Lightbulb
          size={13}
          className="text-yellow-500"
        />

        <span className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-yellow-500">
          TIP
        </span>
      </div>

      <span
        className={`text-[11px] ${
          isDarkMode
            ? 'text-[#64748b]'
            : 'text-gray-400'
        }`}
      >
        Use keyboard shortcuts to work
        faster
      </span>

      <div className="ml-auto flex items-center gap-2">
        {shortcuts.map(
          ({
            key,
            label,
            active,
          }) => (
            <div
              key={key}
              className={`
                h-7
                flex
                items-center
                gap-1
                rounded-md
                border
                px-2
                text-[11px]
                font-semibold
                ${
                  active
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : isDarkMode
                    ? 'border-[#1e3a5f] bg-[#0d2348] text-[#94a3b8]'
                    : 'border-gray-300 bg-gray-100 text-gray-600'
                }
              `}
            >
              <span className="font-bold">
                {key}
              </span>

              <span className="font-normal">
                {label}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}