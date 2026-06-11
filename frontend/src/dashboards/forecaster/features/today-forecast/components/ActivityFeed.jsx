import { Waves, Wind, CloudRain, ClipboardList } from 'lucide-react';
import { card, heading, textSecondary, textMuted } from '../utils/theme';

const activities = [
  {
    icon:  CloudRain,
    color: 'text-blue-500',
    bg:    'bg-blue-500/12',
    text:  'You completed 36-Hour Forecast',
    time:  '01:10 PM',
  },
  {
    icon:  Wind,
    color: 'text-emerald-500',
    bg:    'bg-emerald-500/12',
    text:  'You completed 24-Hour Forecast',
    time:  '11:45 AM',
  },
  {
    icon:  Waves,
    color: 'text-cyan-400',
    bg:    'bg-cyan-500/12',
    text:  'You completed Wave Analysis',
    time:  '09:20 AM',
  },
  {
    icon:  ClipboardList,
    color: 'text-violet-500',
    bg:    'bg-violet-500/12',
    text:  'Forecast package created',
    time:  '08:15 AM',
  },
];

export default function ActivityFeed({ isDarkMode }) {
  return (
    <div className={`p-5 ${card(isDarkMode)}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className={heading(isDarkMode)}>Recent Activity</h2>
        <button className="text-[11.5px] text-blue-500 hover:underline">View all</button>
      </div>

      <div className="space-y-2.5">
        {activities.map(({ icon: Icon, color, bg, text, time }) => (
          <div key={text} className="flex items-center gap-2.5">
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon size={14} className={color} />
            </div>
            <p className={`flex-1 text-[12px] ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
              {text}
            </p>
            <span className={`text-[11px] ${textMuted(isDarkMode)}`}>{time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}