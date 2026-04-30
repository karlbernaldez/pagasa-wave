// studio/components/ProjectDialogs.jsx
import { useState, useEffect, useRef } from "react";
import { AlertTriangle, Pencil, Share2, Copy, Check, Trash2, XCircle } from "lucide-react";
import { Dialog, DialogIcon, DialogActions } from "./Dialog";
import { cn } from "./utils";

/* ── DeleteDialog ─────────────────────── */
export function DeleteDialog({ project, isDark, onCancel, onConfirm, loading }) {
  return (
    <Dialog isDark={isDark} onBackdrop={onCancel}>
      <DialogIcon isDark={isDark} darkCls="bg-red-950 border-red-900" lightCls="bg-red-50 border-red-100">
        <AlertTriangle size={20} className="text-red-500" strokeWidth={2} />
      </DialogIcon>

      <h3 className={cn("font-bold text-base mb-2", isDark ? "text-white" : "text-slate-900")}>
        Delete project?
      </h3>
      <p className={cn("text-sm leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
        <span className={cn("font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>
          "{project.name}"
        </span>{" "}
        will be permanently removed. This cannot be undone.
      </p>

      <DialogActions
        isDark={isDark}
        onCancel={onCancel}
        onConfirm={onConfirm}
        confirmLabel="Delete"
        confirmCls="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
        loading={loading}
      />
    </Dialog>
  );
}

/* ── RejectDialog ─────────────────────── */
export function RejectDialog({ project, isDark, onCancel, onConfirm, loading }) {
  const [comment, setComment] = useState("Needs revision");
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.select(), 60); }, []);

  return (
    <Dialog isDark={isDark} onBackdrop={onCancel}>
      <DialogIcon isDark={isDark} darkCls="bg-red-950 border-red-900" lightCls="bg-red-50 border-red-100">
        <XCircle size={20} className="text-red-500" strokeWidth={2} />
      </DialogIcon>

      <h3 className={cn("font-bold text-base mb-1.5", isDark ? "text-white" : "text-slate-900")}>
        Reject project?
      </h3>
      <p className={cn("text-sm mb-5 leading-relaxed", isDark ? "text-slate-400" : "text-slate-500")}>
        Add a short reason for rejecting{" "}
        <span className={cn("font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>
          "{project.name || project.title}"
        </span>.
      </p>

      <textarea
        ref={inputRef}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        className={cn(
          "w-full resize-none rounded-xl px-4 py-3 text-sm border outline-none transition-all",
          isDark
            ? "bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-red-500"
            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-400 focus:ring-2 focus:ring-red-100"
        )}
        placeholder="Explain what needs revision…"
      />

      <DialogActions
        isDark={isDark}
        onCancel={onCancel}
        onConfirm={() => comment.trim() && onConfirm(comment.trim())}
        confirmLabel="Reject"
        confirmCls="bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-900/30"
        loading={loading}
        disabled={!comment.trim()}
      />
    </Dialog>
  );
}

/* ── RenameDialog ─────────────────────── */
export function RenameDialog({ project, isDark, onCancel, onConfirm, loading }) {
  const [name, setName] = useState(project.name);
  const inputRef = useRef(null);

  useEffect(() => { setTimeout(() => inputRef.current?.select(), 60); }, []);

  return (
    <Dialog isDark={isDark} onBackdrop={onCancel}>
      <DialogIcon isDark={isDark} darkCls="bg-cyan-950 border-cyan-900" lightCls="bg-blue-50 border-blue-100">
        <Pencil size={18} className={isDark ? "text-cyan-400" : "text-blue-600"} strokeWidth={2} />
      </DialogIcon>

      <h3 className={cn("font-bold text-base mb-1.5", isDark ? "text-white" : "text-slate-900")}>
        Rename project
      </h3>
      <p className={cn("text-sm mb-5", isDark ? "text-slate-400" : "text-slate-500")}>
        Enter a new name for this project.
      </p>

      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onConfirm(name.trim());
          if (e.key === "Escape") onCancel();
        }}
        className={cn(
          "w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-all",
          isDark
            ? "bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-cyan-600"
            : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        )}
        placeholder="Project name…"
      />

      <DialogActions
        isDark={isDark}
        onCancel={onCancel}
        onConfirm={() => name.trim() && onConfirm(name.trim())}
        confirmLabel="Save name"
        confirmCls={isDark ? "bg-cyan-500 hover:bg-cyan-400 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
        loading={loading}
        disabled={!name.trim() || name.trim() === project.name}
      />
    </Dialog>
  );
}

/* ── ShareDialog ──────────────────────── */
export function ShareDialog({ project, isDark, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/studio/${project._id}`;

  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  return (
    <Dialog isDark={isDark} onBackdrop={onClose}>
      <DialogIcon isDark={isDark} darkCls="bg-cyan-950 border-cyan-900" lightCls="bg-blue-50 border-blue-100">
        <Share2 size={18} className={isDark ? "text-cyan-400" : "text-blue-600"} strokeWidth={2} />
      </DialogIcon>

      <h3 className={cn("font-bold text-base mb-1.5", isDark ? "text-white" : "text-slate-900")}>
        Share project
      </h3>
      <p className={cn("text-sm mb-5", isDark ? "text-slate-400" : "text-slate-500")}>
        Anyone with this link can view{" "}
        <span className={cn("font-semibold", isDark ? "text-slate-200" : "text-slate-800")}>
          "{project.name}"
        </span>.
      </p>

      <div className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 mb-5",
        isDark ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"
      )}>
        <span className={cn("flex-1 text-xs truncate font-mono", isDark ? "text-slate-400" : "text-slate-500")}>
          {link}
        </span>
        <button
          onClick={copy}
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-all flex-shrink-0",
            copied
              ? "bg-green-950 text-green-400 border-green-800"
              : isDark
                ? "bg-slate-700 hover:bg-slate-600 text-slate-300 border-slate-600"
                : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200"
          )}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <button
        onClick={onClose}
        className={cn(
          "w-full py-2.5 rounded-xl text-sm font-semibold border transition-all",
          isDark
            ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
        )}
      >
        Done
      </button>
    </Dialog>
  );
}