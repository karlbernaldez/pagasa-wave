import { useEffect, useMemo, useState } from 'react';
import {
  Clock,
  Flag,
  AlertCircle,
} from 'lucide-react';

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
    charts.find(
      chart =>
        chart.status !== 'Completed'
    ) || charts[charts.length - 1];

  const deadlineDate = useMemo(() => {
    if (!activeChart?.deadline) {
      return new Date();
    }

    const [time, meridian] =
      activeChart.deadline.split(' ');

    let [hours, minutes] =
      time.split(':').map(Number);

    if (
      meridian === 'PM' &&
      hours !== 12
    ) {
      hours += 12;
    }

    if (
      meridian === 'AM' &&
      hours === 12
    ) {
      hours = 0;
    }

    const now = new Date();

    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0
    );
  }, [activeChart]);

  const [timeLeft, setTimeLeft] =
    useState({
      hours: 0,
      minutes: 0,
      seconds: 0,
      totalSeconds: 0,
    });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();

      const diff = Math.max(
        0,
        Math.floor(
          (deadlineDate.getTime() -
            now.getTime()) /
            1000
        )
      );

      const hours =
        Math.floor(diff / 3600);

      const minutes =
        Math.floor(
          (diff % 3600) / 60
        );

      const seconds =
        diff % 60;

      setTimeLeft({
        hours,
        minutes,
        seconds,
        totalSeconds: diff,
      });
    };

    updateCountdown();

    const interval =
      setInterval(
        updateCountdown,
        1000
      );

    return () =>
      clearInterval(interval);
  }, [deadlineDate]);

  const pad = value =>
    String(value).padStart(2, '0');

  const remainingShort =
    `${timeLeft.hours}h ${pad(
      timeLeft.minutes
    )}m`;

  const remainingFull =
    `${timeLeft.hours}h ${pad(
      timeLeft.minutes
    )}m ${pad(
      timeLeft.seconds
    )}s`;

  const TOTAL_SECONDS =
    3 * 60 * 60;

  const progress =
    Math.max(
      0,
      Math.min(
        1,
        timeLeft.totalSeconds /
          TOTAL_SECONDS
      )
    );

  const circumference = 283;

  const dashOffset =
    circumference * (1 - progress);

  const gaugeColor =
    timeLeft.totalSeconds > 7200
      ? '#22c55e'
      : timeLeft.totalSeconds > 3600
      ? '#f59e0b'
      : '#ef4444';

  const timerClass =
    timeLeft.totalSeconds < 3600
      ? 'animate-pulse text-red-500'
      : timeLeft.totalSeconds >
        7200
      ? 'text-emerald-500'
      : 'text-yellow-500';

  const statusMessage =
    timeLeft.totalSeconds > 7200
      ? 'On schedule.'
      : timeLeft.totalSeconds > 3600
      ? 'Deadline approaching.'
      : 'Immediate attention required.';

  return (
    <div
      className={`p-6 ${card(
        isDarkMode
      )}`}
    >
      <h2
        className={`mb-4 ${heading(
          isDarkMode
        )}`}
      >
        Next Deadline
      </h2>

      <div className="mb-4 text-center">
        <p
          className={`text-sm font-semibold ${textSecondary(
            isDarkMode
          )}`}
        >
          Forecast Package
        </p>

        <h3
          className={`mt-1 text-lg font-bold ${textPrimary(
            isDarkMode
          )}`}
        >
          {activeChart?.title ??
            'No Pending Tasks'}
        </h3>
      </div>

      <div className="flex justify-center">
        <svg
          viewBox="0 0 220 118"
          className="w-full max-w-[220px]"
        >
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={
              isDarkMode
                ? '#0d2348'
                : '#e5e7eb'
            }
            strokeWidth="10"
            strokeLinecap="round"
          />

          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke={gaugeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={
              circumference
            }
            strokeDashoffset={
              dashOffset
            }
          />
        </svg>
      </div>

      <div className="-mt-2 text-center">
        <div
          className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full ${
            isDarkMode
              ? 'bg-[#0d2348]'
              : 'bg-gray-100'
          }`}
        >
          <Clock
            size={15}
            className={textSecondary(
              isDarkMode
            )}
          />
        </div>

        <h3
          className={`mt-2 text-3xl font-extrabold ${timerClass}`}
        >
          {remainingShort}
        </h3>

        <p
          className={`text-xs ${textSecondary(
            isDarkMode
          )}`}
        >
          Remaining
        </p>

        <p
          className={`mt-1.5 text-[11px] ${textSecondary(
            isDarkMode
          )}`}
        >
          {statusMessage}
        </p>
      </div>

      <div className="mt-5">
        <p
          className={`mb-3 ${heading(
            isDarkMode
          )}`}
        >
          Deadline Details
        </p>

        {[
          {
            icon: (
              <Flag size={13} />
            ),
            label: 'Forecast',
            val:
              activeChart?.title ??
              '-',
          },
          {
            icon: (
              <Clock size={13} />
            ),
            label: 'Due Time',
            val:
              activeChart?.deadline ??
              '-',
          },
          {
            icon: (
              <AlertCircle size={13} />
            ),
            label:
              'Time Remaining',
            val: remainingFull,
            accent: true,
          },
        ].map(
          ({
            icon,
            label,
            val,
            accent,
          }) => (
            <div
              key={label}
              className={`flex items-center justify-between border-t py-2.5 text-xs ${divider(
                isDarkMode
              )}`}
            >
              <span
                className={`flex items-center gap-1.5 ${textSecondary(
                  isDarkMode
                )}`}
              >
                <span
                  className={textMuted(
                    isDarkMode
                  )}
                >
                  {icon}
                </span>

                {label}
              </span>

              <span
                className={`font-mono font-semibold ${
                  accent
                    ? timerClass
                    : textPrimary(
                        isDarkMode
                      )
                }`}
              >
                {val}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}