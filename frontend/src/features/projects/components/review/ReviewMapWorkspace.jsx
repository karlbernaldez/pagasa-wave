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
  const panel = isDarkMode ? 'border-white/10 bg-slate-950/60' : 'border-slate-200 bg-white';
  const softPanel = isDarkMode ? 'border-white/10 bg-slate-900/70' : 'border-slate-200 bg-slate-50';
  const labelText = isDarkMode ? 'text-slate-500' : 'text-slate-400';

  return (
    <section className={`overflow-visible p-3 sm:p-4 xl:min-h-0 xl:overflow-hidden ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm sm:rounded-3xl xl:h-full ${panel}`}>
        <div className={`flex shrink-0 flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.16em] ${labelText}`}>Annotation Preview</p>
            <p className={`mt-1 text-xs font-semibold sm:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              {isLoadingCurrentFeatures ? 'Loading current annotations…' : mapMode === 'diff' ? 'Compare previous snapshot against current submission' : 'Large map review workspace'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className={`grid grid-cols-2 rounded-2xl border p-1 shadow-inner sm:flex sm:shrink-0 ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
              <button
                type="button"
                onClick={() => onMapModeChange('preview')}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'preview' ? (isDarkMode ? 'bg-slate-800 text-blue-300 shadow-sm ring-1 ring-white/10' : 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200') : (isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-800')}`}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => onMapModeChange('diff')}
                className={`rounded-xl px-4 py-2 text-xs font-black transition ${mapMode === 'diff' ? (isDarkMode ? 'bg-slate-800 text-blue-300 shadow-sm ring-1 ring-white/10' : 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200') : (isDarkMode ? 'text-slate-400 hover:text-slate-100' : 'text-slate-500 hover:text-slate-800')}`}
              >
                Diff
              </button>
            </div>
            {mapMode === 'diff' && <DiffLegend isDarkMode={isDarkMode} />}
          </div>
        </div>

        {featureLoadError && (
          <div className={`shrink-0 border-b px-5 py-2 text-sm font-semibold ${isDarkMode ? 'border-red-500/30 bg-red-950/30 text-red-300' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {featureLoadError}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-visible p-3 sm:p-4 xl:overflow-hidden">
          {mapMode === 'preview' ? (
            <ProjectPreviewMap
              projectId={projectId}
              features={currentFeatureSource}
              featureScope="admin"
              isDarkMode={isDarkMode}
              className={`h-[310px] rounded-2xl sm:h-[460px] xl:h-full ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}
              height={null}
              emptyLabel={isLoadingCurrentFeatures ? 'Loading current annotations…' : 'No current annotations yet'}
              lazy={false}
              fixedBounds
            />
          ) : (
            <div className="grid gap-3 xl:h-full xl:min-h-0 xl:grid-cols-2 xl:gap-4">
              <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${softPanel}`}>
                <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-white/10 bg-slate-950/60 text-slate-500' : 'border-slate-200 bg-white/70 text-slate-400'}`}>
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
              <div className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border shadow-sm ${isDarkMode ? 'border-blue-400/20 bg-blue-500/5' : 'border-blue-100 bg-blue-50/40'}`}>
                <div className={`shrink-0 border-b px-4 py-3 text-xs font-black uppercase tracking-[0.14em] ${isDarkMode ? 'border-blue-400/20 bg-slate-950/60 text-blue-300' : 'border-blue-100 bg-white/80 text-blue-500'}`}>
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
