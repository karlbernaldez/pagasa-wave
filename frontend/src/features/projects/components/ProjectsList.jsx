import { useState } from 'react';
import { format } from 'date-fns';
import { Check, ExternalLink, Eye, MoreHorizontal } from 'lucide-react';

import Button from '@/components/ui/Button';
import { ROLES } from '@/core/auth/roles';

const STATUS_STYLE = {
  Draft: 'bg-slate-100 text-slate-700',
  Submitted: 'bg-amber-100 text-amber-700',
  'Under Review': 'bg-orange-100 text-orange-700',
  Approved: 'bg-blue-100 text-blue-700',
  Published: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
  Archived: 'bg-slate-100 text-slate-500',
};

function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
}

function getProjectName(project) {
  return project.name || project.title || 'Untitled project';
}

function getProjectOwner(project) {
  return project.owner?.name || project.owner || project.createdBy?.name || '—';
}

function getProjectType(project) {
  return project.chartType || project.type || 'Forecast';
}

const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLE[status] || 'bg-blue-50 text-blue-700'}`}>
    {status || 'Unknown'}
  </span>
);

const ProjectsList = ({
  error,
  isDarkMode,
  loading,
  onApprove,
  onDelete,
  onOpen,
  onRename,
  onRetry,
  projects,
  role,
}) => {
  const [active, setActive] = useState(null);
  const isAdmin = role === ROLES.ADMIN;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading projects...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
        Failed to load projects
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
        No projects found
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className={`overflow-hidden rounded-xl border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-white'}`}>
        {projects.map((project) => {
          const status = project.status;
          const isPending = status === 'Pending' || status === 'Submitted';

          return (
            <div
              key={project._id}
              onClick={() => onOpen?.(project)}
              className={`flex cursor-pointer items-center justify-between gap-4 border-b px-5 py-4 transition-colors last:border-b-0 ${
                isDarkMode
                  ? 'border-gray-700/60 hover:bg-gray-700/30'
                  : 'border-slate-100 hover:bg-slate-50'
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`truncate font-semibold ${isDarkMode ? 'text-gray-100' : 'text-slate-900'}`}>
                  {getProjectName(project)}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-slate-500'}>
                    {getProjectOwner(project)}
                  </span>
                  <span className={`rounded px-1.5 py-0.5 text-xs ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                    {getProjectType(project)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={status} />
                <Button
                  size="sm"
                  icon={isPending ? Check : Eye}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (isPending && onApprove) onApprove(project);
                    else onOpen?.(project);
                  }}
                >
                  {isPending && onApprove ? 'Approve' : 'View'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 font-semibold text-slate-600">
          <tr>
            <th className="px-4 py-3 text-left">Forecast Project</th>
            <th className="px-4 py-3 text-left">Forecast Date</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Last Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {projects.map((project) => (
            <tr key={project._id} className="border-t hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-900">{getProjectName(project)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDate(project.forecastDate)}</td>
              <td className="px-4 py-3"><StatusBadge status={project.status} /></td>
              <td className="px-4 py-3 text-slate-600">{formatDate(project.updatedAt, 'MMM d, yyyy hh:mm a')}</td>
              <td className="relative px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <Button size="sm" onClick={() => onOpen?.(project)} icon={ExternalLink}>
                    Open
                  </Button>

                  <Button
                    variant="icon"
                    size="sm"
                    icon={MoreHorizontal}
                    aria-label="More actions"
                    onClick={() => setActive(active === project._id ? null : project._id)}
                  />
                </div>

                {active === project._id && (
                  <div className="absolute right-4 z-10 mt-2 w-32 rounded-md border bg-white text-xs shadow-md">
                    {onRename && (
                      <button
                        type="button"
                        onClick={() => { setActive(null); onRename(project); }}
                        className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                      >
                        Rename
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => { setActive(null); onDelete(project); }}
                        className="block w-full px-3 py-2 text-left text-red-600 hover:bg-slate-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsList;
