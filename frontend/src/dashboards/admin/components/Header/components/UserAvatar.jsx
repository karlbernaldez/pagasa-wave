import { useState } from 'react';

/**
 * Renders a user avatar: image when available, initialed fallback otherwise.
 *
 * @param {{ avatarUrl?: string|null, initials: string, size?: 'md'|'lg' }} props
 */
const UserAvatar = ({ avatarUrl, initials, size = 'md' }) => {
  const [imgError, setImgError] = useState(false);
  const dim      = size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const textSize = size === 'lg' ? 'text-sm'   : 'text-xs';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt="User avatar"
        onError={() => setImgError(true)}
        className={`${dim} rounded-xl object-cover ring-2 ring-cyan-500/40`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`${dim} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/20`}
    >
      <span className={`text-white font-bold ${textSize}`}>{initials}</span>
    </div>
  );
};

export default UserAvatar;