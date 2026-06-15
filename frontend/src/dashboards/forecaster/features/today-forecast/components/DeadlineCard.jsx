import { useEffect, useMemo, useState } from 'react';
import { Clock, Flag, Calendar } from 'lucide-react';

import {
  card,
  heading,
  textPrimary,
  textSecondary,
  textMuted,
  divider,
} from '../utils/theme';

export default function DeadlineCard({
  charts = [],
  isDarkMode,
}) {
  const activeChart =
    charts.find((chart) => chart.status !== 'Completed') ||
    charts[charts.length - 1];

  const deadlineDate = useMemo(() => {
    if (!activeChart?.deadline) return new Date();

    const [time, meridian] = activeChart.deadline.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (meridian === 'PM' && hours !== 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;

    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  }, [activeChart]);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0, minutes: 0, seconds: 0, totalSeconds: 0,
  });

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 1000));
      setTimeLeft({
        hours: Math.floor(diff / 3600),
        minutes: Math.floor((diff % 3600) / 60),
        seconds: diff % 60,
        totalSeconds: diff,
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadlineDate]);

  const pad = (v) => String(v).padStart(2, '0');

  const remainingFull = `${timeLeft.hours}h ${pad(timeLeft.minutes)}m ${pad(timeLeft.seconds)}s`;

  // Multicolor gauge — green → yellow → red (matches target screenshot)
  // The gauge arc goes from left to right. We split it into 3 colored segments
  // using strokeDasharray tricks on a half-circle path.
  // Path total length ≈ 283 (half circle r=90)
  const TOTAL_SECONDS = 3 * 60 * 60;
  const progress = Math.max(0, Math.min(1, timeLeft.totalSeconds / TOTAL_SECONDS));
  const circumference = 283;
  const filledLength = circumference * progress;
  const emptyLength = circumference - filledLength;

  // Color for the filled portion
  const gaugeColor =
    timeLeft.totalSeconds > 7200
      ? '#22c55e'
      : timeLeft.totalSeconds > 3600
      ? '#f59e0b'
      : '#ef4444';

  const timerColor =
    timeLeft.totalSeconds > 7200
      ? 'text-emerald-400'
      : timeLeft.totalSeconds > 3600
      ? 'text-yellow-400'
      : 'text-red-500';

  const statusMessage =
    timeLeft.totalSeconds > 7200
      ? 'Stay on track to publish on time.'
      : timeLeft.totalSeconds > 3600
      ? 'Deadline approaching — keep going.'
      : 'Immediate attention required.';

  // Today's date formatted
  const today = new Date().toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
  });

  return (
    <div className={`p-6 ${card(isDarkMode)}`}>
      <h2 className={`mb-5 ${heading(isDarkMode)}`}>Deadline Overview</h2>

      {/* Multicolor gauge */}
      <div className="flex justify-center">
        <svg viewBox="0 0 220 120" className="w-full max-w-[220px]">
          {/* Track */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={isDarkMode ? '#0d2348' : '#e5e7eb'}
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Red segment (rightmost — danger zone) */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="#ef4444"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.33} ${circumference * 0.67}`}
          />
          {/* Yellow segment (middle) */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.66} ${circumference * 0.34}`}
          />
          {/* Green segment (leftmost — safe zone) */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.33} ${circumference * 0.67}`}
          />
          {/* Progress mask — white overlay from the right to hide filled portion */}
          {/* We use a cover path that darkens the "empty" portion */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={isDarkMode ? '#061529' : '#f9fafb'}
            strokeWidth="13"
            strokeLinecap="butt"
            strokeDasharray={`0 ${filledLength} ${emptyLength}`}
          />
          {/* Clock icon center */}
          <foreignObject x="94" y="72" width="32" height="32">
            <div
              xmlns="http://www.w3.org/1999/xhtml"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: isDarkMode ? '#0d2348' : '#e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={14} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Time display */}
      <div className="-mt-1 text-center">
        <h3 className={`text-3xl font-extrabold ${timerColor}`}>
          {timeLeft.hours}h {pad(timeLeft.minutes)}m
        </h3>
        <p className={`text-xs mt-0.5 ${textSecondary(isDarkMode)}`}>Remaining</p>
        <p className={`mt-1.5 text-[11.5px] ${textSecondary(isDarkMode)}`}>{statusMessage}</p>
      </div>

      {/* Deadline Details */}
      <div className="mt-5">
        <p className={`mb-3 text-[11px] font-bold uppercase tracking-widest ${textMuted(isDarkMode)}`}>
          Deadline Details
        </p>

        {[
          {
            icon: <Calendar size={13} />,
            label: 'Date',
            val: today,
          },
          {
            icon: <Clock size={13} />,
            label: 'Publication Time',
            val: activeChart?.deadline
              ? `${activeChart.deadline} (PHT)`
              : '5:00 PM (PHT)',
          },
          {
            icon: <Flag size={13} />,
            label: 'Time Remaining',
            val: remainingFull,
            accent: true,
          },
        ].map(({ icon, label, val, accent }) => (
          <div
            key={label}
            className={`flex items-center justify-between border-t py-2.5 text-xs ${divider(isDarkMode)}`}
          >
            <span className={`flex items-center gap-1.5 ${textSecondary(isDarkMode)}`}>
              <span className={textMuted(isDarkMode)}>{icon}</span>
              {label}
            </span>
            <span
              className={`font-mono font-semibold ${
                accent ? timerColor : textPrimary(isDarkMode)
              }`}
            >
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}