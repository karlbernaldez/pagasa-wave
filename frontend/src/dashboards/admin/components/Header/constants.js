/**
 * Returns the dropdown panel class string based on the current theme.
 * Kept here so every dropdown stays visually consistent without prop-drilling
 * a raw class string through the tree.
 */
export const getDropdownCls = (isDarkMode) =>
  isDarkMode
    ? 'bg-[#0f1923] shadow-black/60'
    : 'bg-white shadow-gray-300/60';

export const HEADER_STYLES = `
  .title-gradient {
    background: linear-gradient(90deg, #e2f3ff 0%, #7dd3fc 40%, #a5b4fc 80%, #e2f3ff 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: titleShimmer 5s linear infinite;
  }
  @keyframes titleShimmer {
    0%   { background-position: 0%;   }
    100% { background-position: 200%; }
  }
  .bottom-accent::after {
    content: '';
    position: absolute;
    bottom: 0; left: 5%; right: 5%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #38bdf8 35%, #818cf8 65%, transparent);
    opacity: 0.45;
  }
`;