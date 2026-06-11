/**
 * useTodayForecast
 *
 * Provides forecast package data for the Today's Forecast page.
 * Replace the mock data here with real API calls as needed.
 */
export function useTodayForecast() {
  return {
    publicationDeadline: {
      date: 'June 10, 2026',
      time: '12:00 PM',
      /** Short string shown in the gauge card (no seconds) */
      remainingShort: '2h 14m',
      /** Full string shown in the details row (with seconds) */
      remaining: '2h 14m 32s',
    },

    charts: [
      {
        title: 'Wave Analysis',
        description: 'Analyze wave conditions',
        deadline: '06:00 AM',
        status: 'Completed',
        time: '05:42 AM',
        icon: 'Waves',
      },
      {
        title: '24-Hour Forecast',
        description: 'Prepare 24-hour forecast',
        deadline: '09:00 AM',
        status: 'Completed',
        time: '08:35 AM',
        icon: 'Wind',
      },
      {
        title: '36-Hour Forecast',
        description: 'Prepare 36-hour forecast',
        deadline: '12:00 PM',
        status: 'Completed',
        time: '11:20 AM',
        icon: 'CloudRain',
      },
      {
        title: '48-Hour Forecast',
        description: 'Prepare 48-hour forecast',
        deadline: '03:00 PM',
        status: 'In Progress',
        time: null,
        icon: 'Waves',
      },
    ],
  };
}