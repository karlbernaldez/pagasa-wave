// ╔══════════════════════════════════════════════════════╗
// ║                    TabBar.jsx                        ║
// ║  Horizontal tab switcher driven by TABS config       ║
// ╚══════════════════════════════════════════════════════╝
import { Plus } from 'lucide-react';
import { TABS } from '../constants/tabs';

const TabBar = ({ activeTab, setActiveTab, dark }) => (
  <div className={`flex gap-1 px-6 pt-4 pb-0 border-b ${
    dark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'
  }`}>
    {TABS.map(({ id, label, icon: Icon }) => {
      const active = activeTab === id;
      return (
        <button
          key={id}
          onClick={() => setActiveTab(id)}
          className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all duration-200 ${
            active
              ? dark
                ? 'text-blue-400 bg-slate-950'
                : 'text-blue-600 bg-slate-50'
              : dark
                ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/60'
          }`}
        >
          <Icon size={14} />
          {label}
          {active && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
          )}
        </button>
      );
    })}

    {/* Future tab hint */}
    <div className={`flex items-center gap-1.5 ml-auto mb-2 text-xs px-3 py-1.5 rounded-lg border border-dashed ${
      dark ? 'border-slate-700 text-slate-600' : 'border-slate-200 text-slate-300'
    }`}>
      <Plus size={10} /> More pages soon
    </div>
  </div>
);

export default TabBar;