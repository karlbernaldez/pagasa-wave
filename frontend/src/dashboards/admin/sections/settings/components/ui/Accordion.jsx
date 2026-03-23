// ╔══════════════════════════════════════════════════════╗
// ║                  ui/Accordion.jsx                    ║
// ╚══════════════════════════════════════════════════════╝
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const sectionCardCls = (dark) =>
  `rounded-2xl border transition-all duration-200 ${
    dark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
  }`;

const Accordion = ({ icon: Icon, title, count, children, dark, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={sectionCardCls(dark)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-all duration-200 rounded-2xl ${
          open ? '' : 'hover:bg-slate-50/5'
        }`}
      >
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0 ${
          dark ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600'
        }`}>
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
            {title}
          </span>
          {count !== undefined && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
              dark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
              {count} {count === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        {open
          ? <ChevronUp  size={16} className={dark ? 'text-slate-500' : 'text-slate-400'} />
          : <ChevronDown size={16} className={dark ? 'text-slate-500' : 'text-slate-400'} />
        }
      </button>

      {open && (
        <div className={`px-6 pb-6 border-t ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="pt-5">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Accordion;