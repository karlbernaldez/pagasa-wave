import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Mail,
  Phone,
  Building2,
  Clock,
  KeyRound,
  LockKeyhole,
  ScrollText,
  ShieldAlert,
  Trash2
} from 'lucide-react';
import { ConfirmDeleteUserModal } from '../modals/ConfirmDeleteUser';

import { updateUserDetailsAPI, updateUserStatusAPI, deleteUserAPI } from '@/api/userAPI';

import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants';
import { fullName, getInitials, avatarGradient } from '../utils';
import { StatusBadge } from './StatusBadge';


const EDITABLE_PROFILE_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'agency',
  'position',
  'contact',
  'address',
  'birthday',
  'role',
];

// Statuses an admin should never be able to manually assign.
// "pending" is system-assigned on registration — reverting to it makes no
// sense and could break downstream approval flows.
const EXCLUDED_STATUSES = new Set(['all', 'pending']);

const getUserId = (user) => user?._id || user?.id;

const pickChangedFields = (source, baseline, fields) => {
  const updates = {};

  fields.forEach((field) => {
    if (source?.[field] !== baseline?.[field]) {
      updates[field] = source?.[field];
    }
  });

  return updates;
};

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
  },
  {
    icon: Trash2,
    label: 'Delete User',
    desc: 'Permanently remove this user account.',
    color: 'danger',
    disabled: false,
    destructive: true
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
  },
  danger: {
    dark: 'border-red-500/40 text-red-300 hover:bg-red-500/10',
    light: 'border-red-200 text-red-600 hover:bg-red-50'
  }
};

// ───────────────── COMPONENT ─────────────────

export function ManageUserModal({ user, isDarkMode, onClose, onSave, onDelete }) {

  /* ---------- STATE ---------- */

  const [formData, setFormData] = useState(() => user ?? {});
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState('');

  const userId = useMemo(() => getUserId(user), [user]);

  const changedProfileFields = useMemo(
    () => pickChangedFields(formData, user, EDITABLE_PROFILE_FIELDS),
    [formData, user]
  );

  const statusChanged = formData?.status !== user?.status;
  const hasChanges = statusChanged || Object.keys(changedProfileFields).length > 0;

  const selectClasses = `w-full px-3 py-2 rounded-lg border text-sm ${isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-200'
    : 'bg-white border-slate-200 text-slate-700'
    }`;

  const avatarSrc = formData?.avatarUrl || formData?.photo;

  const handleFieldChange = useCallback((field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!userId || !hasChanges) {
      onClose?.();
      return;
    }

    try {
      setSaving(true);
      setError('');

      let updatedStatusUser = null;

      if (statusChanged) {
        updatedStatusUser = await updateUserStatusAPI(userId, formData.status);
      }

      let profileUpdated = null;
      if (Object.keys(changedProfileFields).length > 0) {
        profileUpdated = await updateUserDetailsAPI(userId, changedProfileFields);
      }

      const normalizedId =
        profileUpdated?._id ||
        updatedStatusUser?._id ||
        user?._id;

      const merged = {
        ...user,
        ...formData,
        ...profileUpdated,
        ...(updatedStatusUser ?? {}),
        _id: normalizedId,
        id: normalizedId,
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

  const handleDelete = async () => {
    if (!userId) return;

    try {
      setDeleting(true);
      setError('');

      await onDelete?.(userId);   // 🔥 call hook delete

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    setFormData(user);
    setError('');
  }, [userId, user]);

  useEffect(() => {
    if (!showAvatarPreview) {
      setImageLoaded(false);
    }
  }, [showAvatarPreview]);

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

  const gradient = avatarGradient(fullName(formData));

  const card = isDarkMode
    ? 'bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60'
    : 'bg-white border border-slate-200 shadow-2xl shadow-slate-200/80';

  const meta = isDarkMode ? 'text-slate-500' : 'text-slate-400';
  const data = isDarkMode ? 'text-slate-300' : 'text-slate-600';
  const divider = isDarkMode ? 'border-slate-800' : 'border-slate-100';

  // Always exclude "all". Only exclude "pending" if the user isn't currently
  // pending — if they are, keep it visible as their current value.
  const assignableStatuses = STATUS_OPTIONS.filter((o) => {
    const value = (typeof o === 'string' ? o : o.value).toLowerCase();
    if (value === 'all') return false;
    if (value === 'pending') return user?.status?.toLowerCase() === 'pending';
    return true;
  });


  /* ---------- RENDER ---------- */

  return (
    <>
      {/* MAIN MODAL */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >

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

                {avatarSrc ? (
                  <img
                    src={avatarSrc}
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
                    {fullName(formData)}
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
                <Mail size={11} /> {formData.email || user.email}
              </p>

              {(formData.contact || user.contact) &&
                <p className={`text-xs flex items-center gap-2 ${data}`}>
                  <Phone size={11} /> {formData.contact || user.contact}
                </p>
              }

              <p className={`text-xs flex items-center gap-2 ${data}`}>
                <Building2 size={11} /> {formData.agency || user.agency} · {formData.position || user.position}
              </p>

              <p className={`text-xs flex items-center gap-2 ${meta}`}>
                <Clock size={11} /> Last login: {formData.lastLogin || user.lastLogin}
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
                onChange={(e) => handleFieldChange('role', e.target.value)}
                className={selectClasses}
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
                onChange={(e) => handleFieldChange('status', e.target.value)}
                className={selectClasses}
              >
                {assignableStatuses.map((o) => {
                  const value = typeof o === 'string' ? o : o.value;
                  const label = typeof o === 'string' ? o : o.label;

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
            {ACTION_BUTTONS.map(({ icon: Icon, label, desc, color, disabled, destructive }) => {

              const col = actionColors[color];

              const isDelete = label === 'Delete User';

              const onClick = isDelete
                ? () => setShowDeleteModal(true)
                : undefined;

              const isLoading = isDelete && deleting;

              return (
                <button
                  key={label}
                  disabled={disabled || isLoading}
                  onClick={onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left
                    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    ${isDarkMode ? col.dark : col.light}`}
                >
                  <Icon size={15} />

                  <div>
                    <p className="text-sm font-semibold">
                      {isDelete && confirmDelete
                        ? 'Confirm Delete User'
                        : isLoading
                          ? 'Deleting...'
                          : label}
                    </p>

                    <p className={`text-xs ${meta}`}>
                      {isDelete && confirmDelete
                        ? 'Click again to permanently delete this account.'
                        : desc}
                    </p>
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
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${isDarkMode
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
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

            {avatarSrc ? (
              <img
                src={avatarSrc}
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

      {showDeleteModal && (
        <ConfirmDeleteUserModal
          user={user}
          isDarkMode={isDarkMode}
          loading={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}

    </>
  );
}