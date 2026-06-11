import { Bell } from 'lucide-react';
import { card, heading } from '../utils/theme';

export default function Reminders({ isDarkMode }) {
  return (
    <div className={`p-5 ${card(isDarkMode)}`}>
      <h2 className={`mb-3 ${heading(isDarkMode)}`}>Reminders</h2>

      <div className="flex gap-2.5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-500/12">
          <Bell size={15} className="text-yellow-500" />
        </div>
        <div>
          <p className={`text-[12px] leading-[1.5] ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
            Don't forget to submit the forecast package for review before 5:00 PM.
          </p>
          <p className="mt-1.5 text-[11.5px] font-semibold text-yellow-500">
            2 hours remaining
          </p>
        </div>
      </div>
    </div>
  );
}