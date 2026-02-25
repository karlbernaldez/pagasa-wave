import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import { X, UserPlus } from 'lucide-react';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants';

// ─── Fields ───────────────────────────────────────────────────────────────────
const FIELDS = [
  { key: 'firstName', label: 'First Name', type: 'text', placeholder: 'e.g. Ana', required: true, span: 1 },
  { key: 'lastName', label: 'Last Name', type: 'text', placeholder: 'e.g. Reyes', required: true, span: 1 },
  { key: 'email', label: 'Email Address', type: 'email', placeholder: 'user@pagasa.gov.ph', required: true, span: 2 },
  { key: 'contact', label: 'Contact No.', type: 'text', placeholder: '+63 9xx xxx xxxx', required: false, span: 1 },
  { key: 'agency', label: 'Agency', type: 'text', placeholder: 'e.g. PAGASA Marine Division', required: false, span: 1 },
  { key: 'position', label: 'Position / Title', type: 'text', placeholder: 'e.g. Senior Forecaster', required: false, span: 2 },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function AddUserModal({
  isDarkMode = true,
  newUser = {},
  setNewUser,
  onClose,
  onSubmit,
}) {

  const firstInputRef = useRef(null);

  // autofocus first field
  useEffect(() => {
    firstInputRef.current?.focus();
  }, []);

  // lock background scroll
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  const overlay = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';

  const card = isDarkMode
    ? 'bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60'
    : 'bg-white border border-slate-200 shadow-2xl shadow-slate-200/80';

  const labelClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const inputBase = isDarkMode
    ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:bg-slate-800'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white';

  // validation
  const canSubmit = useMemo(() => {
    const f = newUser?.firstName?.trim();
    const l = newUser?.lastName?.trim();
    const e = newUser?.email?.trim();
    return Boolean(f && l && e);
  }, [newUser]);

  // generic change helper
  const update = useCallback((key, value) => {
    setNewUser?.(prev => ({ ...prev, [key]: value }));
  }, [setNewUser]);

  // form submit handler
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit?.();
  }, [onSubmit, canSubmit]);

  // normalize status options (supports string[] or {value,label}[])
  const statusOptions = useMemo(() => {
    return STATUS_OPTIONS
      .map(o => typeof o === 'string' ? { value: o, label: o } : o)
      .filter(o => o.value !== 'All');
  }, []);

  return (
    <div
      className={overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Add new user"
    >
      <div
        className={`w-full max-w-xl rounded-2xl p-6 ${card}`}
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode
              ? 'bg-cyan-500/15 border border-cyan-500/30'
              : 'bg-cyan-50 border border-cyan-200'
              }`}>
              <UserPlus size={16} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
            </div>

            <div>
              <h4 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Add New User
              </h4>
              <p className={`text-xs mt-0.5 ${labelClass}`}>
                Fields marked with *
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode
              ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3 mb-3">

            {FIELDS.map(({ key, label, type, placeholder, required, span }, i) => (
              <div key={key} className={span === 2 ? 'col-span-2' : ''}>
                <label className={`block text-xs font-medium mb-1.5 ${labelClass}`}>
                  {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
                </label>

                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type={type}
                  value={newUser?.[key] || ''}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={placeholder}
                  required={required}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
                />
              </div>
            ))}

            {/* Role */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelClass}`}>Role</label>
              <select
                value={newUser?.role || ''}
                onChange={(e) => update('role', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
              >
                {ROLE_OPTIONS.map((r) => {
                  const value = typeof r === 'string' ? r : r.value;
                  const label = typeof r === 'string' ? r : r.label;

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${labelClass}`}>Status</label>
              <select
                value={newUser?.status || 'active'}
                onChange={(e) => update('status', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
              >
                {STATUS_OPTIONS.map((o) => {
                  const value = typeof o === 'string' ? o : o.value;
                  const label = typeof o === 'string' ? o : o.label;

                  if (value === 'All') return null;

                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Member since */}
            <div className="col-span-2">
              <label className={`block text-xs font-medium mb-1.5 ${labelClass}`}>Member Since</label>
              <input
                type="date"
                value={newUser?.memberSince || ''}
                onChange={(e) => update('memberSince', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
              />
            </div>

          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-2 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'
            }`}>

            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDarkMode
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${canSubmit
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/30'
                : isDarkMode
                  ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
            >
              Create User
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}