import { SETTINGS_GROUPS, TABS } from '../constants/tabs';

function groupTabs(tabs) {
  return tabs.reduce((groups, tab) => {
    const group = tab.group || 'settings';
    if (!groups[group]) groups[group] = [];
    groups[group].push(tab);
    return groups;
  }, {});
}

const cn = (...classes) => classes.filter(Boolean).join(' ');

const TabBar = ({ activeTab, setActiveTab, dark }) => {
  const groups = groupTabs(TABS);
  const activeGroupId = TABS.find((tab) => tab.id === activeTab)?.group || SETTINGS_GROUPS[0]?.id;
  const visibleTabs = groups[activeGroupId] || [];

  const selectGroup = (groupId) => {
    const firstTab = groups[groupId]?.[0];
    if (firstTab) setActiveTab(firstTab.id);
  };

  return (
    <div className={cn('border-b px-4 py-4', dark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white')}>
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {SETTINGS_GROUPS.map((group) => {
            const active = activeGroupId === group.id;
            const count = groups[group.id]?.length || 0;

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => selectGroup(group.id)}
                className={cn(
                  'min-h-[104px] rounded-2xl border p-4 text-left transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                  active
                    ? dark
                      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-lg shadow-cyan-950/20'
                      : 'border-cyan-200 bg-cyan-50 text-cyan-800 shadow-sm'
                    : dark
                      ? 'border-white/10 bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
                      : 'border-white/80 bg-white/60 text-slate-500 hover:bg-white hover:text-slate-900',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black">{group.label}</p>
                    <p className={cn('mt-1 text-xs font-semibold leading-5', active ? 'opacity-80' : 'opacity-75')}>
                      {group.description}
                    </p>
                  </div>
                  <span className={cn(
                    'shrink-0 rounded-full px-2 py-1 text-[11px] font-black',
                    active
                      ? dark ? 'bg-cyan-300/15 text-cyan-100' : 'bg-white/80 text-cyan-700'
                      : dark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-100 text-slate-500',
                  )}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {visibleTabs.length > 1 && (
          <div className={cn('rounded-2xl border p-2', dark ? 'border-white/10 bg-slate-950/35' : 'border-white/80 bg-slate-50/80')}>
            <div className="flex flex-wrap gap-1.5">
              {visibleTabs.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={cn(
                      'relative inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black transition-all duration-200',
                      'focus:outline-none focus:ring-2 focus:ring-cyan-400/50',
                      active
                        ? dark
                          ? 'bg-white/10 text-white'
                          : 'bg-white text-slate-950 shadow-sm'
                        : dark
                          ? 'text-slate-500 hover:bg-white/[0.06] hover:text-slate-200'
                          : 'text-slate-500 hover:bg-white hover:text-slate-900',
                    )}
                  >
                    <Icon size={14} />
                    {label}
                    {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabBar;
