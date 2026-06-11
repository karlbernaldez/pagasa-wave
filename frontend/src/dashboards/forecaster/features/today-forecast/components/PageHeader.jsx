import { Bell, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  textPrimary,
  textSecondary,
  textMuted,
  divider,
} from '../utils/theme';

export default function PageHeader({
  isDarkMode,
  user = {
    name: 'Juan Dela Cruz',
    role: 'Forecaster',
  },
}) {
  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedTime =
    currentTime.toLocaleTimeString(
      'en-PH',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila',
      }
    );

  const formattedDate =
    currentTime.toLocaleDateString(
      'en-PH',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'Asia/Manila',
      }
    );

  const initials = user.name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header
      className={`
        flex items-center justify-between
        border-b px-5 py-3
        ${divider(isDarkMode)}
        ${isDarkMode ? 'bg-[#020c1b]' : 'bg-white'}
      `}
    >
      {/* LEFT */}
      <div className="min-w-0">
        <h1
          className={`text-[32px] font-bold leading-none ${textPrimary(
            isDarkMode
          )}`}
        >
          Today's Forecast
        </h1>

        <p
          className={`mt-1 text-sm ${textSecondary(
            isDarkMode
          )}`}
        >
          Marine Forecast Operations Dashboard
        </p>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5">
        {/* PST */}
        <div className="text-right">
          <p
            className={`text-[10px] uppercase tracking-[0.12em] ${textMuted(
              isDarkMode
            )}`}
          >
            Philippine Standard Time
          </p>

          <div className="mt-1 font-mono text-[26px] font-bold leading-none text-cyan-400">
            {formattedTime}
          </div>

          <div
            className={`mt-1 text-[11px] ${textSecondary(
              isDarkMode
            )}`}
          >
            {formattedDate}
          </div>
        </div>

        <div
          className={`h-10 w-px ${
            isDarkMode
              ? 'bg-[#0d2348]'
              : 'bg-gray-200'
          }`}
        />

        {/* Notifications */}
        <button
          className={`relative rounded-lg p-2 transition-colors ${
            isDarkMode
              ? 'text-slate-400 hover:bg-[#0d2348] hover:text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Bell size={18} />

          <span className="absolute right-0 top-0 flex h-[14px] w-[14px] items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
            3
          </span>
        </button>

        {/* User */}
        <button className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {initials}
          </div>

          <div className="text-left">
            <p
              className={`text-sm font-semibold leading-tight ${textPrimary(
                isDarkMode
              )}`}
            >
              {user.name}
            </p>

            <p
              className={`text-[11px] leading-tight ${textSecondary(
                isDarkMode
              )}`}
            >
              {user.role}
            </p>
          </div>

          <ChevronDown
            size={14}
            className={textSecondary(
              isDarkMode
            )}
          />
        </button>
      </div>
    </header>
  );
}