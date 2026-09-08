import { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Loader2,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

import {
  createRole,
  deleteRole,
  fetchPermissionCatalog,
  fetchRoles,
  updateRole,
} from '@/api/roleAPI';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const FEATURE_LABELS = {
  dashboard: 'Dashboard',
  studio: 'Studio',
  projects: 'Forecast Projects',
  wave_models: 'Wave Models',
  wave_pipeline: 'Wave Pipeline',
  model_onboarding: 'Model Onboarding',
  users: 'Users',
  roles: 'User Types',
  analytics: 'Analytics',
  reports: 'Reports',
  settings: 'System Settings',
};

const ACTION_LABELS = {
  view: 'View',
  view_own: 'View own',
  view_all: 'View all',
  create: 'Create',
  edit: 'Edit',
  submit: 'Submit',
  review: 'Review',
  approve: 'Approve',
  publish: 'Publish',
  manage: 'Manage',
  run_builder: 'Run builder',
  delete_package: 'Delete packages',
  change_status: 'Change status',
  delete: 'Delete',
  export: 'Export',
};

const emptyForm = () => ({
  key: '',
  name: '',
  description: '',
  permissions: [],
  enabled: true,
});

function ErrorBanner({ message, isDarkMode }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm font-semibold',
        isDarkMode
          ? 'border-red-300/20 bg-red-400/10 text-red-200'
          : 'border-red-200 bg-red-50 text-red-800'
      )}
    >
      {message}
    </div>
  );
}

function RoleCard({ role, selected, onSelect, isDarkMode }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className={cn(
        'w-full rounded-2xl border p-4 text-left shadow-xl backdrop-blur-xl transition-colors',
        selected
          ? isDarkMode
            ? 'border-cyan-300/30 bg-cyan-400/[0.08] shadow-black/20'
            : 'border-cyan-200 bg-cyan-50/80 shadow-slate-300/30'
          : isDarkMode
            ? 'border-white/10 bg-slate-950/50 shadow-black/20 hover:bg-slate-900/65'
            : 'border-white/70 bg-white/70 shadow-slate-300/40 hover:bg-white'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
              isDarkMode ? 'bg-cyan-400/10 text-cyan-200' : 'bg-cyan-50 text-cyan-700'
            )}
          >
            {role.system ? <LockKeyhole size={17} /> : <ShieldCheck size={17} />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {role.name}
              </p>
              {role.system && (
                <span
                  className={cn(
                    'rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide',
                    isDarkMode ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  System
                </span>
              )}
              {!role.enabled && (
                <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-500">
                  Disabled
                </span>
              )}
            </div>
            <p className={cn('mt-1 line-clamp-2 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              {role.description || 'No description provided.'}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-black',
            isDarkMode ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'
          )}
        >
          <Users size={11} /> {role.memberCount}
        </span>
      </div>
      <div className={cn('mt-3 flex items-center justify-between text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
        <span>{role.permissions.length} permissions</span>
        <span className="font-mono">{role.key}</span>
      </div>
    </button>
  );
}

function PermissionEditor({ catalog, permissions, onChange, disabled, isDarkMode }) {
  const selected = new Set(permissions);

  const toggle = (permission) => {
    if (disabled) return;
    onChange(
      selected.has(permission)
        ? permissions.filter((item) => item !== permission)
        : [...permissions, permission]
    );
  };

  const toggleFeature = (feature, actions) => {
    if (disabled) return;
    const keys = actions.map((action) => `${feature}.${action}`);
    const allSelected = keys.every((key) => selected.has(key));
    onChange(
      allSelected
        ? permissions.filter((permission) => !keys.includes(permission))
        : [...new Set([...permissions, ...keys])]
    );
  };

  return (
    <div className="space-y-3">
      {Object.entries(catalog).map(([feature, actions]) => {
        const keys = actions.map((action) => `${feature}.${action}`);
        const allSelected = keys.length > 0 && keys.every((key) => selected.has(key));
        return (
          <section
            key={feature}
            className={cn(
              'rounded-xl border p-3',
              isDarkMode ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-white'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className={cn('text-xs font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
                  {FEATURE_LABELS[feature] || feature}
                </p>
                <p className={cn('mt-0.5 text-[10px]', isDarkMode ? 'text-slate-500' : 'text-slate-500')}>
                  {keys.filter((key) => selected.has(key)).length} of {keys.length} enabled
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => toggleFeature(feature, actions)}
                className={cn(
                  'rounded-lg border px-2.5 py-1.5 text-[10px] font-black disabled:cursor-not-allowed disabled:opacity-50',
                  allSelected
                    ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-500'
                    : isDarkMode
                      ? 'border-white/10 text-slate-400'
                      : 'border-slate-200 text-slate-600'
                )}
              >
                {allSelected ? 'Clear section' : 'Select section'}
              </button>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {actions.map((action) => {
                const permission = `${feature}.${action}`;
                const checked = selected.has(permission);
                return (
                  <label
                    key={permission}
                    className={cn(
                      'flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold',
                      checked
                        ? isDarkMode
                          ? 'border-cyan-300/20 bg-cyan-400/[0.07] text-cyan-100'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-800'
                        : isDarkMode
                          ? 'border-white/[0.07] text-slate-400'
                          : 'border-slate-100 text-slate-600',
                      disabled ? 'cursor-not-allowed opacity-65' : 'cursor-pointer'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(permission)}
                    />
                    {ACTION_LABELS[action] || action}
                  </label>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function RolesSection({ isDarkMode }) {
  const [roles, setRoles] = useState([]);
  const [catalog, setCatalog] = useState({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    Promise.all([fetchRoles(), fetchPermissionCatalog()])
      .then(([roleResult, catalogResult]) => {
        if (!active) return;
        setRoles(roleResult?.roles || []);
        setCatalog(catalogResult?.catalog || {});
        setError('');
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Unable to load user types.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedRole = useMemo(
    () => roles.find((role) => role.key === selectedKey) || null,
    [roles, selectedKey]
  );

  const refresh = async ({ keepSelection = true } = {}) => {
    setLoading(true);
    try {
      const result = await fetchRoles();
      setRoles(result?.roles || []);
      if (!keepSelection) setSelectedKey(null);
      setError('');
    } catch (requestError) {
      setError(requestError.message || 'Unable to refresh user types.');
    } finally {
      setLoading(false);
    }
  };

  const openRole = (role) => {
    setSelectedKey(role.key);
    setCreating(false);
    setForm({
      key: role.key,
      name: role.name,
      description: role.description || '',
      permissions: [...role.permissions],
      enabled: role.enabled,
    });
    setError('');
  };

  const openCreate = () => {
    setSelectedKey(null);
    setCreating(true);
    setForm(emptyForm());
    setError('');
  };

  const closeEditor = () => {
    setSelectedKey(null);
    setCreating(false);
    setForm(emptyForm());
    setError('');
  };

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      if (creating) {
        const result = await createRole(form);
        await refresh();
        if (result?.role) openRole(result.role);
      } else if (selectedRole) {
        const result = await updateRole(selectedRole.key, {
          name: form.name,
          description: form.description,
          permissions: form.permissions,
          enabled: form.enabled,
        });
        await refresh();
        if (result?.role) openRole(result.role);
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to save user type.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!selectedRole || selectedRole.system) return;
    if (
      !window.confirm(
        `Delete user type ${selectedRole.name}? This is allowed only when no users are assigned to it.`
      )
    )
      return;

    setBusy(true);
    setError('');
    try {
      await deleteRole(selectedRole.key);
      closeEditor();
      await refresh({ keepSelection: false });
    } catch (requestError) {
      setError(requestError.message || 'Unable to delete user type.');
    } finally {
      setBusy(false);
    }
  };

  const editing = creating || Boolean(selectedRole);
  const adminLocked = selectedRole?.key === 'admin';

  if (editing) {
    return (
      <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={closeEditor}
              className={cn(
                'grid h-10 w-10 shrink-0 place-items-center rounded-xl border',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] text-slate-300'
                  : 'border-slate-200 bg-white text-slate-700'
              )}
              aria-label="Back to user types"
            >
              <ArrowLeft size={17} />
            </button>
            <div>
              <p className={cn('text-lg font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                {creating ? 'Create User Type' : selectedRole.name}
              </p>
              <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                {adminLocked
                  ? 'Administrator permissions are protected to prevent lockout.'
                  : 'Configure the user type and the capabilities it grants.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {!creating && !selectedRole.system && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove()}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-red-500 hover:bg-red-500/10 disabled:opacity-50"
              >
                <Trash2 size={14} /> Delete
              </button>
            )}
            <button
              type="button"
              disabled={busy || !form.name.trim() || (creating && !form.key.trim())}
              onClick={() => void save()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
          </div>
        </section>

        <ErrorBanner message={error} isDarkMode={isDarkMode} />

        <section
          className={cn(
            'rounded-2xl border p-5 shadow-xl backdrop-blur-xl',
            isDarkMode
              ? 'border-white/10 bg-slate-950/50 shadow-black/20'
              : 'border-white/70 bg-white/70 shadow-slate-300/40'
          )}
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                Name
              </span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                maxLength={80}
                className={cn(
                  'min-h-10 w-full rounded-xl border px-3 py-2 text-sm outline-none',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />
            </label>
            <label className="space-y-1">
              <span className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                Key
              </span>
              <input
                value={form.key}
                disabled={!creating}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    key: event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''),
                  }))
                }
                maxLength={32}
                placeholder="senior_forecaster"
                className={cn(
                  'min-h-10 w-full rounded-xl border px-3 py-2 font-mono text-sm outline-none disabled:opacity-60',
                  isDarkMode
                    ? 'border-white/10 bg-white/[0.04] text-white'
                    : 'border-slate-200 bg-white text-slate-900'
                )}
              />
            </label>
          </div>
          <label className="mt-4 block space-y-1">
            <span className={cn('text-[10px] font-black uppercase', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              maxLength={300}
              rows={3}
              className={cn(
                'w-full rounded-xl border px-3 py-2 text-sm outline-none',
                isDarkMode
                  ? 'border-white/10 bg-white/[0.04] text-white'
                  : 'border-slate-200 bg-white text-slate-900'
              )}
            />
          </label>
          {!adminLocked && (
            <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) =>
                  setForm((current) => ({ ...current, enabled: event.target.checked }))
                }
              />
              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Enabled</span>
            </label>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
                Permissions
              </p>
              <p className={cn('mt-1 text-xs', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
                {form.permissions.length} capabilities selected
              </p>
            </div>
            {adminLocked && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-black text-amber-500">
                <LockKeyhole size={12} /> Protected
              </span>
            )}
          </div>
          <PermissionEditor
            catalog={catalog}
            permissions={form.permissions}
            onChange={(permissions) => setForm((current) => ({ ...current, permissions }))}
            disabled={adminLocked || busy}
            isDarkMode={isDarkMode}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-5 p-4 sm:p-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-950')}>
            User types
          </p>
          <p className={cn('mt-1 text-xs font-semibold', isDarkMode ? 'text-slate-400' : 'text-slate-500')}>
            {loading ? 'Loading user types' : `${roles.length} configured user type${roles.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className={cn(
              'inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm font-black disabled:opacity-60',
              isDarkMode
                ? 'border-white/10 bg-white/[0.04] text-slate-300'
                : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-500"
          >
            <Plus size={14} /> Create User Type
          </button>
        </div>
      </section>

      <ErrorBanner message={error} isDarkMode={isDarkMode} />

      <section className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {roles.map((role) => (
          <RoleCard
            key={role.key}
            role={role}
            selected={false}
            onSelect={openRole}
            isDarkMode={isDarkMode}
          />
        ))}
      </section>

      {!loading && roles.length === 0 && (
        <section
          className={cn(
            'rounded-2xl border px-5 py-14 text-center',
            isDarkMode ? 'border-white/10 bg-slate-950/50' : 'border-slate-200 bg-white'
          )}
        >
          <Check size={24} className="mx-auto mb-2 text-slate-500" />
          <p className={cn('text-sm font-black', isDarkMode ? 'text-white' : 'text-slate-900')}>
            No user types found
          </p>
        </section>
      )}
    </div>
  );
}
