import { TABS } from '../constants/tabs';

function groupTabs(tabs) {
  return tabs.reduce((groups, tab) => {
    const group = tab.group || 'Settings';
    if (!groups[group]) groups[group] = [];
    groups[group].push(tab);
    return groups;
  }, {});
}

const TabBar = ({ activeTab, setActiveTab, dark }) => {
  const groups = groupTabs(TABS);
  const activeGroup = TABS.find((tab) => tab.id === activeTab)?.group || Object.keys(groups)[0];
  const visibleTabs = groups[activeGroup] || [];

  const selectGroup = (group) => {
    const firstTab = groups[group]?.[0];
    if (firstTab) setActiveTab(firstTab.id);
  };

  return (
    <div className={`border-b px-4 py-4 ${dark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white'}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {Object.keys(groups).map((group) => {
            const active = activeGroup === group;
            return (
              <button
                key={group}
                type="button"
                onClick={() => selectGroup(group)}
                className={`rounded-2xl border px-4 py-2.5 text-sm font-black transition-all duration-200 ${
                  active
                    ? dark
                      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/20'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-700 shadow-sm'
                    : dark
                      ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                      : 'border-white/80 bg-white/60 text-slate-500 hover:bg-white hover:text-slate-900'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        <div className={`rounded-2xl border p-2 ${dark ? 'border-white/10 bg-slate-950/35' : 'border-white/80 bg-slate-50/80'}`}>
          <div className="flex flex-wrap gap-1.5">
            {visibleTabs.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={`relative inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-all duration-200 ${
                    active
                      ? dark
                        ? 'bg-white/10 text-white'
                        : 'bg-white text-slate-950 shadow-sm'
                      : dark
                        ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                        : 'text-slate-500 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabBar;
