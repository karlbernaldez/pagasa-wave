import { useOutletContext } from 'react-router-dom';
import { useTodayForecast } from '../features/today-forecast/hooks/useTodayForecast';

import PageHeader from '../features/today-forecast/components/PageHeader';
import ForecastProgressCard from '../features/today-forecast/components/ForecastProgressCard';
import DeadlineCard from '../features/today-forecast/components/DeadlineCard';
import ForecastChecklist from '../features/today-forecast/components/ForecastChecklist';
import ActivityFeed from '../features/today-forecast/components/ActivityFeed';
import Reminders from '../features/today-forecast/components/Reminders';
import TipBar from '../features/today-forecast/components/TipBar';

export default function TodayForecastPage() {
  const { isDarkMode } =
    useOutletContext();

  const forecast =
    useTodayForecast();

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <PageHeader
        isDarkMode={isDarkMode}
      />

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden px-5 py-4">
        <div className="grid grid-cols-[1fr_270px] gap-4 items-start">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <ForecastProgressCard
              charts={forecast.charts}
              isDarkMode={isDarkMode}
            />

            <ForecastChecklist
              charts={forecast.charts}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            <DeadlineCard
              deadline={
                forecast.publicationDeadline
              }
              charts={forecast.charts}
              isDarkMode={isDarkMode}
            />

            <ActivityFeed
              isDarkMode={isDarkMode}
            />

            <Reminders
              isDarkMode={isDarkMode}
            />
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <TipBar
        isDarkMode={isDarkMode}
      />
    </div>
  );
}