import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Clock,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ShieldAlert
} from 'lucide-react';

import { updateUserDetailsAPI, updateUserStatusAPI } from '@/api/userAPI';

import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants';
import { fullName, getInitials, avatarGradient } from '../utils';
import { StatusBadge } from './StatusBadge';


// ───────────────── ACTION BUTTONS CONFIG ─────────────────

const ACTION_BUTTONS = [
  {
    icon: KeyRound,
    label: 'Reset Password',
    desc: 'Send a password reset link to this user\'s email.',
    color: 'blue',
    disabled: true
  },
  {
    icon: LockKeyhole,
    label: 'Lock / Unlock',
    desc: 'Toggle account access without changing status.',
    color: 'amber',
    disabled: true
  },
  {
    icon: ScrollText,
    label: 'View Audit Trail',
    desc: 'Inspect login history and admin actions for this user.',
    color: 'violet',
    disabled: true
  }
];

const actionColors = {
  blue: {
    dark: 'border-blue-500/30 text-blue-300 hover:bg-blue-500/10',
    light: 'border-blue-200 text-blue-600 hover:bg-blue-50'
  },
  amber: {
    dark: 'border-amber-500/30 text-amber-300 hover:bg-amber-500/10',
    light: 'border-amber-200 text-amber-600 hover:bg-amber-50'
  },
  violet: {
    dark: 'border-violet-500/30 text-violet-300 hover:bg-violet-500/10',
    light: 'border-violet-200 text-violet-600 hover:bg-violet-50'
  }
};


// ───────────────── COMPONENT ─────────────────

export function ManageUserModal({ user, isDarkMode, onClose, onSave }) {

  /* ---------- STATE ---------- */

  const [formData, setFormData] = useState(() => user ?? {});
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const initializedForId = useRef(null);

  const handleSave = async () => {
    if (!formData?.id) return;

    try {
      setSaving(true);
      setError('');

      let updatedStatusUser = null;

      // update status separately if changed
      if (formData.status !== user.status) {
        updatedStatusUser = await updateUserStatusAPI(formData.id, formData.status);
      }

      // update allowed profile fields
      const profileUpdated = await updateUserDetailsAPI(formData.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        agency: formData.agency,
        position: formData.position,
        contact: formData.contact,
        address: formData.address,
        birthday: formData.birthday
      });

      const merged = {
        ...profileUpdated,
        ...(updatedStatusUser ?? {})
      };

      onSave?.(merged);
      onClose();

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (initializedForId.current === user.id) return;

    initializedForId.current = user.id;

    setFormData(user);
    console.log('Loaded user into form:', user);

  }, [user]);

  // ESC closes preview OR modal
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (showAvatarPreview) setShowAvatarPreview(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showAvatarPreview, onClose]);

  if (!user) return null;

  /* ---------- STYLES ---------- */

  const gradient = avatarGradient(fullName(user));

  const card = isDarkMode
    ? 'bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60'
    : 'bg-white border border-slate-200 shadow-2xl shadow-slate-200/80';

  const meta = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const data = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const divider = isDarkMode ? 'border-slate-800' : 'border-slate-100';


  /* ---------- RENDER ---------- */

  return (
    <>
      {/* MAIN MODAL */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">

        <div
          className={`w-full max-w-md rounded-2xl p-6 ${card}`}
          onClick={(e) => e.stopPropagation()}
        >

          {/* HEADER */}
          <div className="flex items-center justify-between mb-5">
            <h4 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
              Manage User
            </h4>

            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode
                ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                }`}
            >
              <X size={15} />
            </button>
          </div>


          {/* USER CARD */}
          <div className={`rounded-xl p-4 mb-5 border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>

            <div className="flex items-start gap-3">

              {/* AVATAR */}
              <div
                onClick={() => setShowAvatarPreview(true)}
                className="w-11 h-11 rounded-xl overflow-hidden shadow-md flex-shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >

                {(formData.avatarUrl || formData.photo) ? (
                  <img
                    src={formData.avatarUrl || formData.photo}
                    alt={fullName(formData)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full bg-gradient-to-br ${gradient}
                      flex items-center justify-center text-white text-sm font-bold`}
                  >
                    {getInitials(formData)}
                  </div>
                )}

              </div>

              {/* NAME */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                    {fullName(user)}
                  </p>

                  <StatusBadge status={formData.status} isDarkMode={isDarkMode} size="sm" />
                </div>

                <p className={`text-xs mt-1 font-mono ${meta}`}>
                  {formData.role}
                </p>
              </div>

            </div>

            {/* META */}
            <div className={`mt-3 pt-3 border-t space-y-1.5 ${divider}`}>
              <p className={`text-xs flex items-center gap-2 ${data}`}>
                <Mail size={11} /> {user.email}
              </p>

              {user.contact &&
                <p className={`text-xs flex items-center gap-2 ${data}`}>
                  <Phone size={11} /> {user.contact}
                </p>
              }

              <p className={`text-xs flex items-center gap-2 ${data}`}>
                <Building2 size={11} /> {user.agency} · {user.position}
              </p>

              <p className={`text-xs flex items-center gap-2 ${meta}`}>
                <Clock size={11} /> Last login: {user.lastLogin}
              </p>
            </div>

          </div>


          {/* EDITABLE FIELDS */}
          <div className={`rounded-xl p-4 mb-5 border space-y-3 ${isDarkMode ? 'bg-slate-800/40 border-slate-700/60' : 'bg-slate-50 border-slate-200'
            }`}>

            {/* ROLE */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${meta}`}>Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-700'
                  }`}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className={`block text-xs font-semibold mb-1 ${meta}`}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode
                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-700'
                  }`}
              >
                {STATUS_OPTIONS
                  .filter(o => {
                    const value = typeof o === "string" ? o : o.value;
                    return value.toLowerCase() !== "all";
                  })
                  .map(o => {
                    const value = typeof o === "string" ? o : o.value;
                    const label = typeof o === "string" ? o : o.label;

                    return (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    );
                  })}
              </select>
            </div>

          </div>


          {/* ACTIONS */}
          <div className="space-y-2 mb-5">
            {ACTION_BUTTONS.map(({ icon: Icon, label, desc, color, disabled }) => {
              const col = actionColors[color];
              return (
                <button
                  key={label}
                  disabled={disabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                    } ${isDarkMode ? col.dark : col.light}`}
                >
                  <Icon size={15} />
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className={`text-xs ${meta}`}>{desc}</p>
                  </div>
                </button>
              );
            })}
          </div>


          {/* NOTE */}
          <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 border mb-5 ${isDarkMode ? 'bg-slate-800/40 border-slate-700/40' : 'bg-amber-50 border-amber-100'
            }`}>
            <ShieldAlert size={13} className={`mt-0.5 ${meta}`} />
            <p className={`text-xs ${meta}`}>
              Admin actions above will be enabled once backend endpoints are ready.
            </p>
          </div>


          {/* FOOTER */}
          <div className={`flex justify-end gap-2 pt-4 border-t ${divider}`}>
            {error && (
              <p className="text-xs text-red-500 mb-3">
                {error}
              </p>
            )}
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${isDarkMode
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600"
            >
              Save Changes
            </button>

          </div>

        </div>
      </div>


      {/* AVATAR PREVIEW OVERLAY */}
      {showAvatarPreview && (
        <div
          className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-6"
          onClick={() => setShowAvatarPreview(false)}
        >
          <div
            className="relative max-w-2xl w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >

            <button
              onClick={() => setShowAvatarPreview(false)}
              className="absolute -top-12 right-0 text-white hover:opacity-70"
            >
              <X size={26} />
            </button>

            {(formData.avatarUrl || formData.photo) ? (
              <img
                src={formData.avatarUrl || formData.photo}
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                alt={fullName(formData)}
                className={`rounded-2xl shadow-2xl max-h-[75vh] object-contain transition-all duration-300 ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}
              />
            ) : (
              <div
                className={`w-56 h-56 rounded-2xl bg-gradient-to-br ${gradient}
                  flex items-center justify-center text-white text-5xl font-bold shadow-2xl`}
              >
                {getInitials(formData)}
              </div>
            )}

          </div>
        </div>
      )}

    </>
  );
}
