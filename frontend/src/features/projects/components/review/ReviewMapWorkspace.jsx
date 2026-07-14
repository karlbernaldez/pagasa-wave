import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';
import { DiffLegend } from '@/features/projects/components/review/AnnotationDiffSummary';

export default function ReviewMapWorkspace({
  projectId,
  currentFeatureSource,
  diff,
  mapMode,
  onMapModeChange,
  isLoadingCurrentFeatures = false,
  featureLoadError = '',
  isDarkMode = false,
}) {
  const panel = isDarkMode
    ? 'border-white/10 bg-white/[0.035] shadow-black/15'
    : 'border-white/80 bg-white/52 shadow-slate-900/5';
  const softPanel = isDarkMode
    ? 'border-white/10 bg-white/[0.025]'
    : 'border-white/75 bg-white/48';
  const labelText = isDarkMode ? 'text-slate-500' : 'text-slate-400';

  return (
    <section className="overflow-visible bg-transparent p-3 sm:p-4 xl:min-h-0 xl:overflow-hidden">
      <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-xl backdrop-blur-2xl xl:h-full ${panel}`}>
        <div className={`flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 ${isDarkMode ? 'border-white/10 bg-white/[0.02]' : 'border-white/70 bg-white/36'}`}>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Annotation Preview</p>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {isLoadingCurrentFeatures ? 'Loading current annotations…' : mapMode === 'diff' ? 'Compare previous snapshot against current submission' : 'Large map review workspace'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className={`grid grid-cols-2 rounded-xl border p-1 shadow-inner backdrop-blur-xl sm:flex sm:shrink-0 ${isDarkMode ? 'border-white/10 bg-slate-950/28' : 'border-white/80 bg-white/46'}`}>
              {['preview', 'diff'].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => onMapModeChange(mode)}
                  className={`rounded-lg px-4 py-2 text-xs font-black capitalize transition ${mapMode === mode ? (isDarkMode ? 'bg-white/[0.09] text-cyan-200 shadow-sm ring-1 ring-white/10' : 'bg-white/90 text-cyan-700 shadow-sm ring-1 ring-white') : (isDarkMode ? 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800')}`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {mapMode === 'diff' && <DiffLegend isDarkMode={isDarkMode} />}
          </div>
        </div>

        {featureLoadError && (
          <div className={`shrink-0 border-b px-5 py-2 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {featureLoadError}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-visible bg-transparent p-3 sm:p-4 xl:overflow-hidden">
          {mapMode === 'preview' ? (
            <ProjectPreviewMap
              projectId={projectId}
              features={currentFeatureSource}
              featureScope="admin"
              isDarkMode={isDarkMode}
              className={`h-[310px] rounded-xl border shadow-lg sm:h-[460px] xl:h-full ${isDarkMode ? 'border-white/10 shadow-black/20' : 'border-white/80 shadow-slate-900/10'}`}
              height={null}
              emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
              lazy={false}
              fixedBounds
            />
          ) : (
            <div className="grid gap-3 xl:h-full xl:min-h-0 xl:grid-cols-2 xl:gap-4">
              <div className={`flex min-h-0 flex-col overflow-hidden rounded-xl border shadow-lg backdrop-blur-xl ${softPanel}`}>
                <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-white/10 bg-white/[0.025] text-slate-500' : 'border-white/70 bg-white/42 text-slate-400'}`}>
                  Previous Snapshot
                </div>
                <ProjectPreviewMap
                  features={diff.previousFeatureCollection}
                  featureScope="admin"
                  isDarkMode={isDarkMode}
                  className="h-[248px] flex-none rounded-none border-0 sm:h-[360px] xl:h-full xl:flex-1"
                  height={null}
                  emptyLabel="No previous snapshot"
                  lazy={false}
                  showDiffStyles
                  fixedBounds
                />
              </div>
              <div className={`flex min-h-0 flex-col overflow-hidden rounded-xl border shadow-lg backdrop-blur-xl ${isDarkMode ? 'border-cyan-300/15 bg-cyan-300/[0.035]' : 'border-cyan-100 bg-cyan-50/32'}`}>
                <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-cyan-300/15 bg-white/[0.025] text-cyan-300' : 'border-cyan-100 bg-white/46 text-cyan-600'}`}>
                  Current Submission
                </div>
                <ProjectPreviewMap
                  projectId={projectId}
                  features={diff.currentFeatureCollection}
                  featureScope="admin"
                  isDarkMode={isDarkMode}
                  className="h-[248px] flex-none rounded-none border-0 sm:h-[360px] xl:h-full xl:flex-1"
                  height={null}
                  emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
                  lazy={false}
                  showDiffStyles
                  fixedBounds
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
