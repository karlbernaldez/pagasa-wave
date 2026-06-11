import { Bell } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';
import { card, heading } from '../utils/theme';

export default function QuickActions() {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-6 ${card(isDarkMode)}`}>
      <h2 className={heading(isDarkMode)}>REMINDERS</h2>

      <div className="mt-4 flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-500/15">
          <Bell size={16} className="text-yellow-500" />
        </div>
        <div>
          <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Don't forget to submit the forecast package for review before 5:00 PM.
          </p>
          <p className="mt-2 text-sm font-medium text-yellow-500">2 hours remaining</p>
        </div>
      </div>
    </div>
  );
}