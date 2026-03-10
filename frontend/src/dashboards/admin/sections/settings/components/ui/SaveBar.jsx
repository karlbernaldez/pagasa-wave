// ╔══════════════════════════════════════════════════════╗
// ║                   ui/SaveBar.jsx                     ║
// ║  Sticky bottom bar: Save, Reset, status message      ║
// ╚══════════════════════════════════════════════════════╝
import { Save, RotateCcw, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

const SaveBar = ({ onSave, onReset, saving, status, dark }) => (
  <div className={`sticky bottom-0 z-10 flex flex-wrap items-center gap-3 px-6 py-4 border-t backdrop-blur-md ${
    dark ? 'bg-slate-950/90 border-slate-800' : 'bg-white/90 border-slate-200'
  }`}>
    {/* Save */}
    <button
      onClick={onSave}
      disabled={saving}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-cyan-600 transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      {saving
        ? <Loader2 size={15} className="animate-spin" />
        : <Save size={15} />
      }
      {saving ? 'Saving…' : 'Save Changes'}
    </button>

    {/* Reset */}
    <button
      onClick={onReset}
      disabled={saving}
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all duration-200 hover:scale-[1.02] disabled:opacity-60 ${
        dark
          ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
      }`}
    >
      <RotateCcw size={14} /> Reset
    </button>

    {/* Status message */}
    {status && (
      <div className={`ml-1 flex items-center gap-1.5 text-sm font-semibold animate-fade-in ${
        status.type === 'success' ? 'text-emerald-500' : 'text-red-500'
      }`}>
        {status.type === 'success'
          ? <CheckCircle2 size={15} />
          : <AlertTriangle size={15} />
        }
        {status.message}
      </div>
    )}
  </div>
);

export default SaveBar;