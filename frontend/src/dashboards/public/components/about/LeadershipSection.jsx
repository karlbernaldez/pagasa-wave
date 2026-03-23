// ╔══════════════════════════════════════════════════════╗
// ║                  LeadershipSection                   ║
// ║  Props:                                              ║
// ║    leaders — array of { name, role, avatar }         ║
// ║  Responsive: 1→2→3→4 columns based on count         ║
// ╚══════════════════════════════════════════════════════╝
import React from 'react';
import { Award, User } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeProvider';

const getGridCols = (count) => {
  if (count === 1) return 'grid-cols-1 max-w-[140px] mx-auto';
  if (count === 2) return 'grid-cols-2 max-w-xs mx-auto';
  if (count === 3) return 'grid-cols-3';
  if (count === 4) return 'grid-cols-4';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
};

// Fallback avatar using initials
const AvatarFallback = ({ name, isDarkMode }) => {
  const initials = name
    .split(' ')
    .filter((_, i) => i === 0 || i === name.split(' ').length - 1)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`w-full h-full flex items-center justify-center text-3xl font-black ${
        isDarkMode ? 'bg-slate-700 text-blue-300' : 'bg-slate-100 text-blue-700'
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
      className={`group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl ${
        isDarkMode
          ? 'bg-slate-800/60 border border-slate-700/60 hover:border-blue-500/40'
          : 'bg-white border border-slate-200 hover:border-blue-300 shadow-md'
      }`}
    >
      {/* Photo — compact portrait */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-slate-800">
        {!imgError && leader.avatar ? (
          <img
            src={leader.avatar}
            alt={`${leader.name} profile`}
            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <AvatarFallback name={leader.name} isDarkMode={isDarkMode} />
        )}

        {/* Gradient overlay at bottom of photo */}
        <div className={`absolute inset-0 bg-gradient-to-t ${
          isDarkMode
            ? 'from-slate-800/90 via-transparent to-transparent'
            : 'from-slate-900/70 via-transparent to-transparent'
        }`} />
      </div>

      {/* Info */}
      <div className={`px-3 py-2.5 flex-1 ${isDarkMode ? 'bg-slate-800/60' : 'bg-white'}`}>
        <p
          className={`text-xs font-black leading-snug mb-0.5 transition-colors duration-300 ${
            isDarkMode ? 'text-white group-hover:text-blue-300' : 'text-slate-900 group-hover:text-blue-700'
          }`}
        >
          {leader.name}
        </p>
        <p className={`text-[10px] leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          {leader.role}
        </p>
      </div>

      {/* Accent bar at bottom */}
      <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500" />
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