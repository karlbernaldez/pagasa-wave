// studio/components/ContextMenu.jsx
import { useEffect, useRef } from "react";
import { Pencil, Share2, Trash2 } from "lucide-react";
import { cn } from "./utils";

export function ContextMenu({ isDark, onRename, onShare, onDelete, onClose, triggerRef }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const itemCls = cn(
    "w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors",
    isDark
      ? "text-slate-300 hover:bg-slate-800 hover:text-white"
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
  );
  const iconCls = isDark ? "text-slate-500" : "text-slate-400";

  const handle = (action) => (e) => {
    e.stopPropagation();
    e.preventDefault();
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className={cn(
        "absolute top-full right-0 mt-1 z-50 w-32 rounded-lg border shadow-xl overflow-hidden py-0.5",
        isDark
          ? "bg-[#131f35] border-slate-700 shadow-black/60"
          : "bg-white border-slate-200 shadow-slate-300/50"
      )}
    >
      <button onClick={handle(onRename)} className={itemCls}>
        <Pencil size={11} strokeWidth={2} className={iconCls} />
        Rename
      </button>
      <button onClick={handle(onShare)} className={itemCls}>
        <Share2 size={11} strokeWidth={2} className={iconCls} />
        Share
      </button>
      <div className={cn("mx-2 my-0.5 h-px", isDark ? "bg-slate-700" : "bg-slate-100")} />
      <button
        onClick={handle(onDelete)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors text-red-400 hover:bg-red-950 hover:text-red-300"
      >
        <Trash2 size={11} strokeWidth={2} />
        Delete
      </button>
    </div>
  );
}