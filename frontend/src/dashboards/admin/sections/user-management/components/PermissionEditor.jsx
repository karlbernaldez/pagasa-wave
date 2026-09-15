import { useMemo, useState } from 'react';
import { ChevronDown, Search, ShieldAlert } from 'lucide-react';

import { buildPermissionGroups } from './permissionEditorModel';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const normalize = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

function PermissionRow({ item, checked, disabled, onToggle, isDarkMode, showTechnicalKeys }) {
  const elevated = item.sensitivity === 'elevated';

  return (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors',
        checked
          ? isDarkMode
            ? 'border-cyan-300/25 bg-cyan-400/[0.07]'
            : 'border-cyan-200 bg-cyan-50/70'
          : isDarkMode
            ? 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
            : 'border-slate-200 bg-white hover:bg-slate-50',
        disabled && 'cursor-not-allowed opacity-65'
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(item.key)}
        className="mt-1 h-4 w-4 shrink-0 accent-cyan-600"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
            {item.label}
          </span>
          {elevated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-amber-500">
              <ShieldAlert size={10} /> Elevated access
            </span>
          )}
        </span>
        <span
          className={cn(
            'mt-1 block text-xs leading-relaxed',
            isDarkMode ? 'text-slate-400' : 'text-slate-500'
          )}
        >
          {item.description}
        </span>
        {showTechnicalKeys && (
          <span
            className={cn(
              'mt-1.5 block font-mono text-[10px]',
              isDarkMode ? 'text-slate-600' : 'text-slate-400'
            )}
          >
            {item.key}
          </span>
        )}
      </span>
    </label>
  );
}

export function PermissionEditor({
  categories = [],
  metadata = {},
  permissions = [],
  onChange,
  disabled = false,
  isDarkMode = false,
}) {
  const groups = useMemo(() => buildPermissionGroups(categories, metadata), [categories, metadata]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(() => new Set());
  const [showTechnicalKeys, setShowTechnicalKeys] = useState(false);

  const selected = useMemo(() => new Set(permissions), [permissions]);
  const configurableKeys = useMemo(() => new Set(Object.keys(metadata)), [metadata]);
  const selectedConfigurable = permissions.filter((key) => configurableKeys.has(key)).length;
  const compatibilityCount = permissions.filter((key) => !configurableKeys.has(key)).length;
  const search = normalize(query);

  const visibleGroups = useMemo(() => {
    if (!search) return groups;
    return groups
      .map((group) => ({
        ...group,
        permissions: group.permissions.filter((item) =>
          [item.label, item.description, item.key, group.label]
            .map(normalize)
            .some((value) => value.includes(search))
        ),
      }))
      .filter((group) => group.permissions.length > 0);
  }, [groups, search]);

  const togglePermission = (key) => {
    if (disabled) return;
    onChange(
      selected.has(key)
        ? permissions.filter((permission) => permission !== key)
        : [...permissions, key]
    );
  };

  const toggleCategory = (group) => {
    if (disabled) return;
    const keys = group.permissions.map((item) => item.key);
    const allSelected = keys.every((key) => selected.has(key));
    onChange(
      allSelected
        ? permissions.filter((permission) => !keys.includes(permission))
        : [...new Set([...permissions, ...keys])]
    );
  };

  const toggleExpanded = (key) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-2xl border p-4',
          isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-white'
        )}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
              {selectedConfigurable} of {Object.keys(metadata).length} permissions enabled
            </p>
            <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Open only the categories you need. Search by capability or description.
            </p>
            {compatibilityCount > 0 && (
              <p className="mt-1 text-[10px] font-semibold text-amber-500">
                {compatibilityCount} compatibility permission
                {compatibilityCount === 1 ? '' : 's'} preserved automatically.
              </p>
            )}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-xl lg:justify-end">
            <button
              type="button"
              aria-pressed={showTechnicalKeys}
              onClick={() => setShowTechnicalKeys((current) => !current)}
              className={cn(
                'min-h-10 shrink-0 rounded-xl border px-3 py-2 text-xs font-black transition-colors',
                showTechnicalKeys
                  ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500'
                  : isDarkMode
                    ? 'border-white/10 text-slate-400 hover:bg-white/[0.04]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {showTechnicalKeys ? 'Hide technical keys' : 'Show technical keys'}
            </button>
            <label className="relative block w-full sm:min-w-64">
              <Search
                size={15}
                className={cn(
                  'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2',
                  isDarkMode ? 'text-slate-500' : 'text-slate-400'
                )}
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search permissions"
                className={cn(
                  'min-h-10 w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-500/60',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-slate-600'
                    : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400'
                )}
              />
            </label>
          </div>
        </div>
      </div>

      {visibleGroups.map((group) => {
        const categoryKeys = group.permissions.map((item) => item.key);
        const selectedCount = categoryKeys.filter((key) => selected.has(key)).length;
        const allSelected = categoryKeys.length > 0 && selectedCount === categoryKeys.length;
        const isExpanded = Boolean(search) || expanded.has(group.key);

        return (
          <section
            key={group.key}
            className={cn(
              'overflow-hidden rounded-2xl border',
              isDarkMode ? 'border-white/10 bg-slate-950/45' : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex items-center gap-3 p-4">
              <button
                type="button"
                onClick={() => toggleExpanded(group.key)}
                aria-expanded={isExpanded}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <ChevronDown
                  size={17}
                  className={cn(
                    'shrink-0 transition-transform',
                    isExpanded ? 'rotate-0' : '-rotate-90',
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm font-black',
                      isDarkMode ? 'text-white' : 'text-slate-950'
                    )}
                  >
                    {group.label}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-xs',
                      isDarkMode ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {selectedCount} of {categoryKeys.length} enabled · {group.description}
                  </span>
                </span>
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleCategory(group)}
                className={cn(
                  'shrink-0 rounded-lg border px-2.5 py-1.5 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-50',
                  allSelected
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500'
                    : isDarkMode
                      ? 'border-white/10 text-slate-400'
                      : 'border-slate-200 text-slate-600'
                )}
              >
                {allSelected ? 'Clear category' : 'Select category'}
              </button>
            </div>

            {isExpanded && (
              <div
                className={cn(
                  'grid gap-2 border-t p-4 lg:grid-cols-2',
                  isDarkMode ? 'border-white/[0.07]' : 'border-slate-100'
                )}
              >
                {group.permissions.map((item) => (
                  <PermissionRow
                    key={item.key}
                    item={item}
                    checked={selected.has(item.key)}
                    disabled={disabled}
                    onToggle={togglePermission}
                    isDarkMode={isDarkMode}
                    showTechnicalKeys={showTechnicalKeys}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {visibleGroups.length === 0 && (
        <div
          className={cn(
            'rounded-2xl border px-5 py-10 text-center text-sm font-semibold',
            isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
          )}
        >
          No permissions match “{query}”.
        </div>
      )}
    </div>
  );
}
