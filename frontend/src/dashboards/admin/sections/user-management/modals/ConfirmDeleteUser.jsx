import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

export function ConfirmDeleteUserModal({
  user,
  isDarkMode,
  onCancel,
  onConfirm,
  loading
}) {
  const [input, setInput] = useState('');

  const email = user?.email ?? '';
  const valid = input.trim() === email;

  const card = isDarkMode
    ? 'bg-slate-900 border border-slate-700 shadow-2xl'
    : 'bg-white border border-slate-200 shadow-2xl';

  const meta = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className={`w-full max-w-md rounded-2xl p-6 ${card}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2 text-red-500">
            <Trash2 size={16} />
            Delete User
          </h3>

          <button onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <p className={`text-sm mb-3 ${meta}`}>
          This action <b>cannot be undone</b>.
          To confirm, type the user's email:
        </p>

        <div className="mb-3 font-mono text-sm bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
          {email}
        </div>

        <input
          autoFocus
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type email to confirm"
          className="w-full px-3 py-2 rounded-lg border mb-5 text-sm"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-slate-200 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={!valid || loading}
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm disabled:opacity-40"
          >
            {loading ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}