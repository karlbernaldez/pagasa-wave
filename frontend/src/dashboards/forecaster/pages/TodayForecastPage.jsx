import { useNavigate } from 'react-router-dom';
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
  const { isDarkMode } = useOutletContext();
  const forecast = useTodayForecast();
  const navigate = useNavigate();

  function handleChartClick(chart) {
    const slug = chart.title.toLowerCase().replace(/\s+/g, '-');

    navigate(`/today-forecast/${slug}`, {
      state: { chart },
    });
  }

  function handleSubmitPackage() {
    // TODO: call your API, e.g.:
    // await api.submitForecastPackage({ date: forecast.publicationDeadline.date });
    console.log('Forecast package submitted for review.');
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader isDarkMode={isDarkMode} publicationDeadline={forecast.publicationDeadline} />

      {/* Content — no scroll, fixed height fills remaining space */}
      <div className="flex-1 min-h-0 px-5 py-3">
        <div className="grid h-full grid-cols-[1fr_380px] gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-3 min-h-0">
            <ForecastProgressCard charts={forecast.charts} isDarkMode={isDarkMode} />
            <ForecastChecklist
              charts={forecast.charts}
              isDarkMode={isDarkMode}
              onChartClick={handleChartClick}
              onSubmit={handleSubmitPackage}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-3 min-h-0">
            <DeadlineCard charts={forecast.charts} isDarkMode={isDarkMode} />
            <ActivityFeed isDarkMode={isDarkMode} />
            <Reminders isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>

      <TipBar isDarkMode={isDarkMode} />
    </div>
  );
}