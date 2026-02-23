// ╔══════════════════════════════════════════════════════╗
// ║                  LeadershipSection                   ║
// ║  Props:                                              ║
// ║    leaders — array of { name, role, avatar }         ║
// ║  Responsive: 1→2→3→4 columns based on count         ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Award } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const getGridCols = (count) => {
  if (count === 1) return 'grid-cols-1 max-w-xs mx-auto';
  if (count === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (count === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
  if (count === 4) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
};

// Fallback avatar using initials when image fails
const AvatarFallback = ({ name, isDarkMode }) => {
  const initials = name
    .split(' ')
    .filter((_, i) => i === 0 || i === name.split(' ').length - 1)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`h-16 w-16 rounded-xl flex items-center justify-center text-lg font-black shadow-md ${
        isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'
      }`}
    >
      {initials}
    </div>
  );
};

const LeaderCard = ({ leader, isDarkMode }) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div
      className={`group flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
        isDarkMode ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-50 hover:bg-slate-100'
      }`}
    >
      {!imgError && leader.avatar ? (
        <img
          src={leader.avatar}
          alt={`${leader.name} profile`}
          className="h-16 w-16 rounded-xl object-cover shadow-md flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <AvatarFallback name={leader.name} isDarkMode={isDarkMode} />
      )}
      <div className="min-w-0">
        <p
          className={`text-base font-bold truncate transition-colors duration-300 ${
            isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
          }`}
        >
          {leader.name}
        </p>
        <p className={`text-sm truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {leader.role}
        </p>
      </div>
    </div>
  );
};

const LeadershipSection = ({ leaders = [] }) => {
  const { isDarkMode } = useTheme();

  if (!leaders.length) return null;

  return (
    <div
      className={`rounded-2xl border p-7 shadow-lg backdrop-blur-sm ${
        isDarkMode ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/90'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg">
          <Award className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2
            className={`text-xl font-black transition-colors duration-700 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Leadership
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {leaders.length} team {leaders.length === 1 ? 'member' : 'members'}
          </p>
        </div>
      </div>

      {/* Leader Cards */}
      <div className={`grid gap-4 ${getGridCols(leaders.length)}`}>
        {leaders.map((leader, index) => (
          <LeaderCard key={`${leader.name}-${index}`} leader={leader} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};

export default LeadershipSection;