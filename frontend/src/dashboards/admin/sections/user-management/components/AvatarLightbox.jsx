import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fullName, getInitials, avatarGradient } from '../utils';

export function AvatarLightbox({
  users = [],
  currentIndex = 0,
  isDarkMode = true,
  onClose,
}) {

  // clamp initial index safely
  const safeInitial = useMemo(() => {
    if (!users.length) return 0;
    return Math.min(Math.max(0, currentIndex), users.length - 1);
  }, [currentIndex, users.length]);

  const [index, setIndex] = useState(safeInitial);
  const [loaded, setLoaded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // keep index valid if users array changes
  useEffect(() => {
    setIndex(prev => Math.min(prev, users.length - 1));
  }, [users.length]);

  const user = users[index];

  const name = useMemo(() => fullName(user) || 'User', [user]);
  const gradient = useMemo(() => avatarGradient(name), [name]);
  const src = user?.avatarUrl || user?.photo || null;

  // navigation handlers
  const prev = useCallback(() => {
    setIndex(i => Math.max(0, i - 1));
  }, []);

  const next = useCallback(() => {
    setIndex(i => Math.min(users.length - 1, i + 1));
  }, [users.length]);

  // keyboard controls
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [next, prev, onClose]);

  // reset loading states when index changes
  useEffect(() => {
    setLoaded(false);
    setImgFailed(false);
  }, [index]);

  // lock background scroll while open
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const handleImgError = useCallback(() => {
    setImgFailed(true);
  }, []);

  if (!users.length || !user) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Avatar preview for ${name}`}
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close preview"
          className="absolute -top-12 right-0 text-white hover:opacity-70"
        >
          <X size={26} />
        </button>

        {/* Prev */}
        {index > 0 && (
          <button
            onClick={prev}
            aria-label="Previous user"
            className="absolute left-0 -translate-x-14 text-white hover:opacity-70"
          >
            <ChevronLeft size={34} />
          </button>
        )}

        {/* Next */}
        {index < users.length - 1 && (
          <button
            onClick={next}
            aria-label="Next user"
            className="absolute right-0 translate-x-14 text-white hover:opacity-70"
          >
            <ChevronRight size={34} />
          </button>
        )}

        {/* IMAGE OR INITIALS */}
        {src && !imgFailed ? (
          <img
            src={src}
            loading="lazy"
            alt={name}
            onLoad={() => setLoaded(true)}
            onError={handleImgError}
            className={`rounded-2xl shadow-2xl max-h-[75vh] object-contain
              transition-all duration-300
              ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
          />
        ) : (
          <div
            className={`w-56 h-56 rounded-2xl bg-gradient-to-br ${gradient}
              flex items-center justify-center text-white text-5xl font-bold
              shadow-2xl transition-transform duration-300`}
          >
            {getInitials(user)}
          </div>
        )}

        {/* Name */}
        <div className="absolute -bottom-12 text-center w-full text-white text-sm">
          {name}
        </div>

      </div>
    </div>
  );
}