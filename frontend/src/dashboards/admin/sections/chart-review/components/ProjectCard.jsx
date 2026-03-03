import {
  Check,
  AlertCircle,
  Eye,
  Download,
  MapPin,
  User,
  Calendar,
} from 'lucide-react';
import MiniMapPreview from '@dashboards/admin/components/MiniMapPreview';
import StatusPill from './StatusPill';
import { formatDate } from '../utils/projectUtils';
import {
  approveProject,
  rejectProject,
  publishProject,
} from '@/api/projectAPI';

const ProjectCard = ({ chart, isDarkMode, onClick, onActionComplete }) => {
  const status = chart.status?.trim();

  const isReviewable = ['Submitted', 'Under Review'].includes(status);
  const isApproved = status === 'Approved';
  const isPublished = status === 'Published';
  const isViewOnly = ['Rejected', 'Archived'].includes(status);

  const handleActionClick = async (e, action) => {
    e.stopPropagation();
    try {
      await action?.();
      onActionComplete?.();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <article
      onClick={onClick}
      className={`group rounded-2xl overflow-hidden border transition-all duration-200
        hover:shadow-xl hover:-translate-y-0.5 cursor-pointer
        ${
          isDarkMode
            ? 'bg-gray-800/60 border-gray-700/60 hover:border-gray-600/80 shadow-black/30'
            : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
    >
      {/* Map Preview */}
      <div className="relative">
        <MiniMapPreview projectId={chart._id} isDarkMode={isDarkMode} />

        <div className="absolute top-3 right-3 z-10">
          <StatusPill status={status} isDarkMode={isDarkMode} />
        </div>

        <div className="absolute bottom-3 left-3 z-10">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm ${
              isDarkMode
                ? 'bg-gray-900/70 text-gray-300 border border-gray-700/60'
                : 'bg-white/80 text-gray-600 border border-gray-200/80'
            }`}
          >
            <MapPin size={10} />
            {chart.chartType}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <h3
          className={`text-base font-bold truncate ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          {chart.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <User
              size={12}
              className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
            />
            <span
              className={`text-sm truncate ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}
            >
              {chart.owner}
            </span>
          </div>

          {chart.forecastDate && (
            <div className="flex items-center gap-2">
              <Calendar
                size={12}
                className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}
              />
              <span
                className={`text-xs ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}
              >
                Forecast: {formatDate(chart.forecastDate)}
              </span>
            </div>
          )}
        </div>

        <div className={`h-px ${isDarkMode ? 'bg-gray-700/60' : 'bg-gray-100'}`} />

        {/* Workflow Actions */}
        {isReviewable && (
          <div className="flex gap-2">
            <button
              onClick={(e) =>
                handleActionClick(e, () => approveProject(chart._id))
              }
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              <Check size={15} />
              Approve
            </button>

            <button
              onClick={(e) =>
                handleActionClick(e, () =>
                  rejectProject(chart._id, 'Needs revision')
                )
              }
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border ${
                isDarkMode
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <AlertCircle size={15} />
              Reject
            </button>
          </div>
        )}

        {isApproved && (
          <button
            onClick={(e) =>
              handleActionClick(e, () => publishProject(chart._id))
            }
            className="w-full bg-blue-500 hover:bg-blue-400 text-white rounded-xl py-2.5 text-sm font-semibold"
          >
            Publish
          </button>
        )}

        {(isPublished || isViewOnly) && (
          <div className="flex gap-2">
            <button
              onClick={(e) => handleActionClick(e)}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white rounded-xl py-2.5 text-sm font-semibold"
            >
              <Eye size={15} />
              View
            </button>

            {isPublished && (
              <button
                onClick={(e) => handleActionClick(e)}
                className={`px-3.5 rounded-xl border ${
                  isDarkMode
                    ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Download size={15} />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export default ProjectCard;