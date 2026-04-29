import { format } from 'date-fns';
import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import Button from '@/components/ui/Button';
import ProjectPreviewMap from '@/features/projects/components/ProjectPreviewMap';

const STATUS_STYLE = {
  Draft: 'bg-slate-100 text-slate-700 border-slate-200',
  Submitted: 'bg-amber-50 text-amber-700 border-amber-200',
  'Under Review': 'bg-orange-50 text-orange-700 border-orange-200',
  Published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-red-50 text-red-700 border-red-200',
  Archived: 'bg-slate-100 text-slate-500 border-slate-200',
};

function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—';

  try {
    return format(new Date(value), pattern);
  } catch {
    return '—';
  }
}

function getProjectId(project) {
  return project?._id || project?.id;
}

function getProjectName(project) {
  return project?.name || project?.title || 'Untitled project';
}

function getProjectType(project) {
  return project?.chartType || project?.type || 'Forecast';
}

function getProjectFeatures(project) {
  return project?.features || project?.featureCollection || project?.annotations || [];
}

export default function ProjectCard({
  project,
  onOpen,
  onRename,
  onDelete,
  actions,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const id = getProjectId(project);
  const name = getProjectName(project);
  const status = project?.status || 'Draft';
  const statusClass = STATUS_STYLE[status] || 'bg-blue-50 text-blue-700 border-blue-200';
  const featureSource = getProjectFeatures(project);
  const menuActions = actions ?? [
    onRename && {
      key: 'rename',
      label: 'Rename',
      icon: Pencil,
      onClick: () => onRename(project),
    },
    onDelete && {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      danger: true,
      onClick: () => onDelete(project),
    },
  ].filter(Boolean);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <ProjectPreviewMap features={featureSource} height={168} />

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              {getProjectType(project)}
            </p>
            <h3 className="mt-1 truncate text-base font-black text-slate-900" title={name}>
              {name}
            </h3>
          </div>

          <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${statusClass}`}>
            {status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="font-bold text-slate-400">Forecast Date</p>
            <p className="mt-1 font-semibold text-slate-700">
              {formatDate(project?.forecastDate)}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-400">Updated</p>
            <p className="mt-1 font-semibold text-slate-700">
              {formatDate(project?.updatedAt, 'MMM d, h:mm a')}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <Button size="sm" icon={ExternalLink} onClick={() => onOpen?.(project)}>
            Open
          </Button>

          {menuActions.length > 0 && (
            <div className="relative">
              <Button
                variant="icon"
                size="sm"
                icon={MoreHorizontal}
                aria-label={`More actions for ${name}`}
                onClick={() => setMenuOpen((value) => !value)}
              />

              {menuOpen && (
                <div className="absolute right-0 z-20 mt-2 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg">
                  {menuActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.key || action.label}
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          action.onClick?.(project);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left font-semibold hover:bg-slate-50 ${
                          action.danger ? 'text-red-600' : 'text-slate-700'
                        }`}
                      >
                        {Icon && <Icon size={14} aria-hidden="true" />}
                        {action.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
