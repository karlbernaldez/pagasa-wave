import { ClipboardList, LayoutDashboard, PencilRuler, RotateCcw, ShieldCheck, Users } from 'lucide-react';

import Accordion from '../ui/Accordion';
import { Field, TextareaField } from '../ui/FormFields';

const cn = (...classes) => classes.filter(Boolean).join(' ');

function InfoCard({ title, children, dark }) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 text-sm font-semibold leading-6',
        dark
          ? 'border-cyan-300/20 bg-cyan-400/10 text-cyan-100'
          : 'border-cyan-100 bg-cyan-50/80 text-cyan-800'
      )}
    >
      <p className="mb-1 text-xs font-black uppercase tracking-wide opacity-80">{title}</p>
      {children}
    </div>
  );
}

function TextField({ label, field, settings, set, dark }) {
  return (
    <Field
      label={label}
      value={settings[field] ?? ''}
      onChange={set(field)}
      dark={dark}
    />
  );
}

function MessageField({ label, field, settings, set, dark, rows = 3 }) {
  return (
    <TextareaField
      label={label}
      value={settings[field] ?? ''}
      onChange={set(field)}
      rows={rows}
      dark={dark}
    />
  );
}

export default function ForecasterWorkspaceTab({ settings = {}, setSettings, dark }) {
  const set = (field) => (value) =>
    setSettings((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="flex flex-col gap-4">
      <InfoCard title="Forecaster workspace settings" dark={dark}>
        Every setting on this page is consumed by the current Forecast Package workspace.
        Studio map defaults are configured separately under Map View.
      </InfoCard>

      <Accordion icon={LayoutDashboard} title="Workspace Header" dark={dark} defaultOpen>
        <div className="grid gap-4 lg:grid-cols-2">
          <TextField
            label="Workspace Welcome Title"
            field="workspaceWelcomeTitle"
            settings={settings}
            set={set}
            dark={dark}
          />
          <MessageField
            label="Workspace Welcome Description"
            field="workspaceWelcomeDescription"
            settings={settings}
            set={set}
            dark={dark}
            rows={3}
          />
        </div>
      </Accordion>

      <Accordion icon={PencilRuler} title="Studio Drawing" dark={dark}>
        <div className="grid gap-5">
          <InfoCard title="Drawing behavior" dark={dark}>
            Pointer offsets apply only while drawing. Smoothing affects both the live preview and
            the final saved curve so the stored geometry matches what the forecaster sees.
          </InfoCard>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                Pointer X Offset (px)
              </label>
              <input
                type="number"
                min="-200"
                max="200"
                step="1"
                value={settings.drawingPointerOffsetX ?? 0}
                onChange={(event) => set('drawingPointerOffsetX')(Number(event.target.value))}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition ${
                  dark
                    ? 'border-slate-700 bg-slate-900 text-white focus:border-cyan-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                }`}
              />
              <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Negative moves the draw point left; positive moves it right.
              </p>
            </div>

            <div>
              <label className={`mb-1 block text-xs font-black uppercase tracking-wide ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                Pointer Y Offset (px)
              </label>
              <input
                type="number"
                min="-200"
                max="200"
                step="1"
                value={settings.drawingPointerOffsetY ?? 0}
                onChange={(event) => set('drawingPointerOffsetY')(Number(event.target.value))}
                className={`w-full rounded-xl border px-3 py-2.5 text-sm font-semibold outline-none transition ${
                  dark
                    ? 'border-slate-700 bg-slate-900 text-white focus:border-cyan-400'
                    : 'border-slate-300 bg-white text-slate-900 focus:border-blue-500'
                }`}
              />
              <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                Negative moves the draw point upward; positive moves it downward.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <label className={`block text-xs font-black uppercase tracking-wide ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
                  Curve Smoothing
                </label>
                <p className={`mt-1 text-xs font-semibold ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                  0% follows the pointer closely; 100% produces the smoothest operational curve.
                </p>
              </div>
              <span className={`rounded-lg px-3 py-1.5 text-sm font-black tabular-nums ${
                dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'
              }`}>
                {settings.drawingSmoothingPercent ?? 50}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={settings.drawingSmoothingPercent ?? 50}
              onChange={(event) => set('drawingSmoothingPercent')(Number(event.target.value))}
              className="w-full cursor-pointer"
            />
            <div className={`mt-1 flex justify-between text-[10px] font-black uppercase tracking-wide ${
              dark ? 'text-slate-600' : 'text-slate-400'
            }`}>
              <span>Precise</span>
              <span>Balanced</span>
              <span>Smooth</span>
            </div>
          </div>


          <div
            className={cn(
              'rounded-2xl border p-4',
              dark ? 'border-white/10 bg-white/[0.025]' : 'border-slate-200 bg-slate-50'
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={settings.drawingPostProcessEnabled === true}
                onChange={(event) =>
                  set('drawingPostProcessEnabled')(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span>
                <span className={cn('block text-sm font-black', dark ? 'text-white' : 'text-slate-900')}>
                  Post-process smoothing
                </span>
                <span className={cn('mt-1 block text-xs leading-5', dark ? 'text-slate-400' : 'text-slate-500')}>
                  Apply an additional smoothing pass after the pointer is released, immediately
                  before the final geometry is saved. Live drawing responsiveness is unchanged.
                </span>
              </span>
            </label>

            {settings.drawingPostProcessEnabled === true && (
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <label className={cn('block text-xs font-black uppercase tracking-wide', dark ? 'text-slate-300' : 'text-slate-600')}>
                      Post-process strength
                    </label>
                    <p className={cn('mt-1 text-xs font-semibold', dark ? 'text-slate-500' : 'text-slate-500')}>
                      Higher values perform stronger final corner rounding after drawing.
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-sm font-black tabular-nums',
                      dark ? 'bg-cyan-400/10 text-cyan-200' : 'bg-blue-50 text-blue-700'
                    )}
                  >
                    {settings.drawingPostProcessSmoothingPercent ?? 50}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={settings.drawingPostProcessSmoothingPercent ?? 50}
                  onChange={(event) =>
                    set('drawingPostProcessSmoothingPercent')(Number(event.target.value))
                  }
                  className="w-full cursor-pointer"
                />

                <div
                  className={cn(
                    'mt-1 flex justify-between text-[10px] font-black uppercase tracking-wide',
                    dark ? 'text-slate-600' : 'text-slate-400'
                  )}
                >
                  <span>Light</span>
                  <span>Balanced</span>
                  <span>Strong</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  drawingPointerOffsetX: 0,
                  drawingPointerOffsetY: 0,
                  drawingSmoothingPercent: 50,
                  drawingPostProcessEnabled: false,
                  drawingPostProcessSmoothingPercent: 50,
                }))
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-black transition ${
                dark
                  ? 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RotateCcw size={14} />
              Reset drawing defaults
            </button>
          </div>
        </div>
      </Accordion>

      <Accordion icon={Users} title="Collaboration & QA Guidance" dark={dark}>
        <div className="grid gap-4">
          <MessageField
            label="Collaboration Presence Message"
            field="collaborationPresenceMessage"
            settings={settings}
            set={set}
            dark={dark}
          />
          <MessageField
            label="QA Checklist Reminder"
            field="qaChecklistReminder"
            settings={settings}
            set={set}
            dark={dark}
          />
        </div>
      </Accordion>

      <Accordion icon={ShieldCheck} title="Package Reminder Messages" dark={dark}>
        <div className="grid gap-4">
          <MessageField label="Deadline Reminder Message" field="deadlineReminderMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Deadline Approaching Message" field="deadlineApproachingMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Deadline Passed Message" field="deadlinePassedMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Publish Target Missed Message" field="publishTargetMissedMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="No-Publication Cutoff Message" field="noPublicationCutoffMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Revision Instruction Message" field="revisionInstructionMessage" settings={settings} set={set} dark={dark} />
        </div>
      </Accordion>

      <Accordion icon={ClipboardList} title="Workspace Helper Copy" dark={dark}>
        <div className="grid gap-4">
          <MessageField label="Empty Package Message" field="emptyPackageMessage" settings={settings} set={set} dark={dark} />
          <MessageField label="Chart Sequence Helper Message" field="chartSequenceHelperMessage" settings={settings} set={set} dark={dark} rows={4} />
        </div>
      </Accordion>
    </div>
  );
}
