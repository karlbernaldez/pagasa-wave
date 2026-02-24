// ╔══════════════════════════════════════════════════════╗
// ║                 tabs/GeneralTab.jsx                  ║
// ║  Accordions: Public Content, Branding, Maintenance   ║
// ╚══════════════════════════════════════════════════════╝

import { Globe, Image, Shield, AlertTriangle } from 'lucide-react';
import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';

const GeneralTab = ({ settings = {}, setSettings, dark }) => {

  /* =========================================================
     SAFE FIELD SETTER (no mutation, undo-ready)
  ========================================================= */

  const set = (field) => (val) =>
    setSettings(prev => ({
      ...prev,
      [field]: val,
    }));


  /* =========================================================
     FILE UPLOAD (history-safe)
  ========================================================= */

  const onLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      set('logoPreview')(String(reader.result));
    };
    reader.readAsDataURL(file);

    // reset input so same file can be re-selected
    e.target.value = '';
  };


  return (
    <div className="flex flex-col gap-4">

      {/* ─────────────────────────────────────────────── */}
      {/* Public Content */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Globe} title="Public Content" dark={dark} defaultOpen>
        <div className="grid gap-4">

          <Field
            label="Dashboard Title"
            value={settings.publicDashboardTitle ?? ''}
            onChange={set('publicDashboardTitle')}
            dark={dark}
          />

          <TextareaField
            label="Public Description"
            value={settings.publicDescription ?? ''}
            onChange={set('publicDescription')}
            dark={dark}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Field
              label="Alert Email"
              type="email"
              value={settings.contactEmail ?? ''}
              onChange={set('contactEmail')}
              dark={dark}
            />

            <Field
              label="Default Region"
              value={settings.defaultRegion ?? ''}
              onChange={set('defaultRegion')}
              dark={dark}
            />

          </div>

        </div>
      </Accordion>


      {/* ─────────────────────────────────────────────── */}
      {/* Branding */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Image} title="Branding" dark={dark}>
        <div className="flex flex-col gap-4">

          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2 text-slate-400">
              Upload Logo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={onLogoUpload}
              className={`w-full text-sm rounded-xl border p-3 ${
                dark
                  ? 'border-slate-700 text-slate-300 bg-slate-800'
                  : 'border-slate-200 text-slate-600 bg-white'
              }`}
            />
          </div>

          {settings.logoPreview && (
            <div className={`p-4 rounded-xl border ${
              dark
                ? 'border-slate-700 bg-slate-800/40'
                : 'border-slate-200 bg-slate-50'
            }`}>
              <p className={`text-xs mb-3 ${
                dark ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Preview
              </p>

              <img
                src={settings.logoPreview}
                alt="Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
          )}

        </div>
      </Accordion>


      {/* ─────────────────────────────────────────────── */}
      {/* Maintenance Mode */}
      {/* ─────────────────────────────────────────────── */}

      <Accordion icon={Shield} title="Maintenance Mode" dark={dark}>
        <div className="flex flex-col gap-4">

          <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
            settings.maintenanceMode
              ? dark
                ? 'border-amber-500/40 bg-amber-500/5'
                : 'border-amber-300 bg-amber-50'
              : dark
                ? 'border-slate-700 bg-slate-800/30'
                : 'border-slate-200 bg-slate-50'
          }`}>

            {/* Toggle */}
            <div className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
              settings.maintenanceMode
                ? 'bg-amber-500'
                : dark
                  ? 'bg-slate-700'
                  : 'bg-slate-300'
            }`}>

              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                settings.maintenanceMode ? 'left-6' : 'left-1'
              }`} />

              <input
                type="checkbox"
                checked={!!settings.maintenanceMode}
                onChange={(e) =>
                  set('maintenanceMode')(e.target.checked)
                }
                className="sr-only"
              />
            </div>

            <div>
              <p className={`text-sm font-semibold ${
                dark ? 'text-white' : 'text-slate-900'
              }`}>
                Enable Maintenance Mode
              </p>

              <p className={`text-xs ${
                dark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Displays a message to all public visitors
              </p>
            </div>

            {settings.maintenanceMode && (
              <span className="ml-auto text-xs font-bold text-amber-500 flex items-center gap-1">
                <AlertTriangle size={12} />
                Active
              </span>
            )}

          </label>

          {/* Only editable if enabled */}
          {settings.maintenanceMode && (
            <TextareaField
              label="Maintenance Message"
              value={settings.maintenanceMessage ?? ''}
              onChange={set('maintenanceMessage')}
              dark={dark}
            />
          )}

        </div>
      </Accordion>

    </div>
  );
};

export default GeneralTab;