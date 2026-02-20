import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fullName, getInitials, avatarGradient } from '../utils';

export function AvatarLightbox({
  users = [],
  currentIndex = 0,
  isDarkMode,
  onClose
}) {

  const [index, setIndex] = useState(currentIndex);
  const [loaded, setLoaded] = useState(false);

  const user = users[index];
  const gradient = avatarGradient(fullName(user));
  const src = user?.avatarUrl || user?.photo;

  // ESC close + arrow navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex(i => Math.min(users.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex(i => Math.max(0, i - 1));
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [users.length, onClose]);

  useEffect(() => setLoaded(false), [index]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full flex items-center justify-center"
        onClick={(e)=>e.stopPropagation()}
      >

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:opacity-70"
        >
          <X size={26}/>
        </button>

        {/* Prev */}
        {index > 0 && (
          <button
            onClick={()=>setIndex(i=>i-1)}
            className="absolute left-0 -translate-x-14 text-white hover:opacity-70"
          >
            <ChevronLeft size={34}/>
          </button>
        )}

        {/* Next */}
        {index < users.length-1 && (
          <button
            onClick={()=>setIndex(i=>i+1)}
            className="absolute right-0 translate-x-14 text-white hover:opacity-70"
          >
            <ChevronRight size={34}/>
          </button>
        )}

        {/* IMAGE OR INITIALS */}
        {src ? (
          <img
            src={src}
            loading="lazy"
            onLoad={()=>setLoaded(true)}
            className={`rounded-2xl shadow-2xl max-h-[75vh] object-contain
              transition-all duration-300
              ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
            `}
            alt={fullName(user)}
          />
        ) : (
          <div
            className={`w-52 h-52 rounded-2xl bg-gradient-to-br ${gradient}
              flex items-center justify-center text-white text-5xl font-bold
              shadow-2xl transition-transform duration-300 scale-100`}
          >
            {getInitials(user)}
          </div>
        )}

        {/* Name */}
        <div className="absolute -bottom-12 text-center w-full text-white text-sm">
          {fullName(user)}
        </div>

      </div>
    </div>
  );
}
