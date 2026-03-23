/**
 * A theme-aware icon button with an optional notification badge.
 *
 * @param {{
 *   onClick:     () => void,
 *   label:       string,
 *   isDarkMode:  boolean,
 *   children:    React.ReactNode,
 *   badge?:      number | null,
 * }} props
 */
const IconButton = ({ onClick, label, isDarkMode, children, badge }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className={`relative p-2.5 rounded-xl transition-all duration-150 active:scale-95 ${
      isDarkMode
        ? 'text-gray-400 hover:text-gray-100 hover:bg-white/8'
        : 'text-gray-500 hover:text-gray-900 hover:bg-black/6'
    }`}
  >
    {children}
    {badge != null && (
      <span
        aria-label={`${badge} unread`}
        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-sm shadow-red-500/40"
      >
        {badge}
      </span>
    )}
  </button>
);

export default IconButton;