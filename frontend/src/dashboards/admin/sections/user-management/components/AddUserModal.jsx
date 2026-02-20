import React from 'react';
import { X, UserPlus, Asterisk } from 'lucide-react';
import { ROLE_OPTIONS, STATUS_OPTIONS } from '../constants';

// ─── AddUserModal ─────────────────────────────────────────────────────────────

const FIELDS = [
  { key: 'firstName',  label: 'First Name',      type: 'text',   placeholder: 'e.g. Ana',                    required: true,  span: 1 },
  { key: 'lastName',   label: 'Last Name',        type: 'text',   placeholder: 'e.g. Reyes',                  required: true,  span: 1 },
  { key: 'email',      label: 'Email Address',    type: 'email',  placeholder: 'user@pagasa.gov.ph',          required: true,  span: 2 },
  { key: 'contact',    label: 'Contact No.',      type: 'text',   placeholder: '+63 9xx xxx xxxx',            required: false, span: 1 },
  { key: 'agency',     label: 'Agency',           type: 'text',   placeholder: 'e.g. PAGASA Marine Division', required: false, span: 1 },
  { key: 'position',   label: 'Position / Title', type: 'text',   placeholder: 'e.g. Senior Forecaster',     required: false, span: 2 },
];

export function AddUserModal({ isDarkMode, newUser, setNewUser, onClose, onSubmit }) {
  const overlay = 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4';

  const card = isDarkMode
    ? 'bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60'
    : 'bg-white border border-slate-200 shadow-2xl shadow-slate-200/80';

  const label = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  const inputBase = isDarkMode
    ? 'bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/60 focus:bg-slate-800'
    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white';

  const canSubmit = newUser.firstName.trim() && newUser.lastName.trim() && newUser.email.trim();

  return (
    <div className={overlay}>
      <div className={`w-full max-w-xl rounded-2xl p-6 ${card}`} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-cyan-50 border border-cyan-200'}`}>
              <UserPlus size={16} className={isDarkMode ? 'text-cyan-400' : 'text-cyan-600'} />
            </div>
            <div>
              <h4 className={`text-base font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}`}>
                Add New User
              </h4>
              <p className={`text-xs mt-0.5 ${label}`}>Fields marked with * are required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {FIELDS.map(({ key, label: lbl, type, placeholder, required, span }) => (
            <div key={key} className={span === 2 ? 'col-span-2' : 'col-span-1'}>
              <label className={`block text-xs font-medium mb-1.5 ${label}`}>
                {lbl}{required && <span className="text-rose-400 ml-0.5">*</span>}
              </label>
              <input
                type={type}
                value={newUser[key]}
                onChange={(e) => setNewUser((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={placeholder}
                className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
              />
            </div>
          ))}

          {/* Role select */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${label}`}>Role</label>
            <select
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
            >
              {ROLE_OPTIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Status select */}
          <div>
            <label className={`block text-xs font-medium mb-1.5 ${label}`}>Status</label>
            <select
              value={newUser.status}
              onChange={(e) => setNewUser((prev) => ({ ...prev, status: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
            >
              {STATUS_OPTIONS.filter((o) => o !== 'All').map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Member since */}
          <div className="col-span-2">
            <label className={`block text-xs font-medium mb-1.5 ${label}`}>Member Since</label>
            <input
              type="date"
              value={newUser.memberSince}
              onChange={(e) => setNewUser((prev) => ({ ...prev, memberSince: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors outline-none ${inputBase}`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              canSubmit
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white shadow-md shadow-cyan-500/20 hover:shadow-cyan-400/30'
                : isDarkMode
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}