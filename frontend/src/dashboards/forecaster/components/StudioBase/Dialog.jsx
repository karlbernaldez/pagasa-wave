// studio/components/Dialog.jsx
import { Loader2 } from "lucide-react";
import { cn } from "./utils";

/** Reusable modal shell with backdrop */
export function Dialog({ isDark, onBackdrop, children }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onBackdrop} />
      <div className={cn(
        "relative w-full max-w-sm rounded-2xl border p-8 shadow-2xl",
        isDark ? "bg-[#0d1525] border-slate-700" : "bg-white border-slate-200"
      )}>
        {children}
      </div>
    </div>
  );
}

/** Icon badge shown at top of each dialog */
export function DialogIcon({ isDark, darkCls, lightCls, children }) {
  return (
    <div className={cn(
      "w-11 h-11 rounded-xl flex items-center justify-center mb-5 border",
      isDark ? darkCls : lightCls
    )}>
      {children}
    </div>
  );
}

/** Cancel + confirm button pair */
export function DialogActions({ isDark, onCancel, onConfirm, confirmLabel, confirmCls, loading, disabled }) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className={cn(
          "flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all",
          isDark
            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
        )}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={loading || disabled}
        className={cn(
          "flex-1 py-2.5 rounded-xl text-sm font-bold transition-all",
          "disabled:opacity-40 flex items-center justify-center gap-2",
          confirmCls
        )}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {confirmLabel}
      </button>
    </div>
  );
}