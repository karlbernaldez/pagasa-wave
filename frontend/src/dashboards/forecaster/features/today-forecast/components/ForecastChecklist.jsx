import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Waves,
  Wind,
  CloudRain,
  ChevronRight,
} from 'lucide-react';

import {
  card,
  heading,
  divider,
  iconBox,
} from '../utils/theme';

const ICONS = {
  Waves,
  Wind,
  CloudRain,
};

export default function ForecastChecklist({
  charts,
  isDarkMode,
}) {
  const nextChart =
    charts.find(
      chart =>
        chart.status !==
        'Completed'
    );

  return (
    <div
      className={`p-6 ${card(
        isDarkMode
      )}`}
    >
      <h2
        className={`mb-1 ${heading(
          isDarkMode
        )}`}
      >
        Forecast Package
      </h2>

      <p className="mb-5 text-lg font-bold text-white">
        June 11, 2026
      </p>

      <div
        className={`overflow-hidden rounded-xl border ${divider(
          isDarkMode
        )}`}
      >
        {charts.map(chart => {
          const Icon =
            ICONS[
              chart.icon
            ] || Waves;

          const completed =
            chart.status ===
            'Completed';

          const active =
            chart.status ===
            'In Progress';

          return (
            <div
              key={
                chart.title
              }
              className={`flex items-center justify-between border-b px-5 py-4 last:border-b-0 ${divider(
                isDarkMode
              )}`}
            >
              {/* LEFT */}
              <div className="flex items-center gap-4">
                {completed ? (
                  <CheckCircle2
                    size={22}
                    className="text-emerald-500"
                  />
                ) : (
                  <Circle
                    size={22}
                    className="text-slate-500"
                  />
                )}

                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBox(
                    isDarkMode
                  )}`}
                >
                  <Icon
                    size={20}
                    className={
                      completed
                        ? 'text-blue-400'
                        : 'text-cyan-400'
                    }
                  />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {
                      chart.title
                    }
                  </h3>

                  <p className="text-sm text-slate-400">
                    {
                      chart.description
                    }
                  </p>
                </div>
              </div>

              {/* RIGHT */}
              <div className="flex items-center gap-5">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    completed
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-yellow-500/15 text-yellow-400'
                  }`}
                >
                  {chart.status}
                </span>

                <span className="w-[90px] text-right text-sm text-slate-400">
                  {completed
                    ? chart.time
                    : 'Not started'}
                </span>

                <ChevronRight
                  size={16}
                  className="text-slate-500"
                />
              </div>
            </div>
          );
        })}
      </div>

      {nextChart && (
        <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-sm font-semibold text-white transition hover:bg-blue-500">
          Continue {nextChart.title}

          <ArrowRight
            size={16}
          />
        </button>
      )}
    </div>
  );
}