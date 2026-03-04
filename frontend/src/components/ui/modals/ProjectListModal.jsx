import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  X, FolderOpen, Trash2, Clock, BarChart3,
  Search, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';
import { fetchUserProjects } from '@/api/projectAPI';

const STATUS_STYLES = {
  Draft: "bg-gray-500/20 text-gray-300",
  Submitted: "bg-yellow-500/20 text-yellow-300",
  "Under Review": "bg-orange-500/20 text-orange-300",
  Approved: "bg-green-500/20 text-green-300",
  Published: "bg-emerald-500/20 text-emerald-300",
  Rejected: "bg-red-500/20 text-red-300",
  Archived: "bg-slate-500/20 text-slate-300"
};

const STATUS_FILTERS = ['All', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Published', 'Rejected', 'Archived'];
const PAGE_LIMIT = 5;

const ProjectListModal = ({ visible, onClose, onSelect, onDelete, isDarkMode }) => {
  const navigate = useNavigate();

  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Fetch once when the modal opens
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchUserProjects()
      .then((data) => setAllProjects(data.projects ?? []))
      .catch((err) => console.error('Failed to load projects:', err))
      .finally(() => setLoading(false));
  }, [visible]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // Client-side filter + paginate
  const filtered = useMemo(() => {
    let result = allProjects;

    if (statusFilter !== 'All') {
      result = result.filter((p) => (p.status || 'Draft') === statusFilter);
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allProjects, statusFilter, debouncedSearch]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));
  const projects = filtered.slice((page - 1) * PAGE_LIMIT, page * PAGE_LIMIT);

  /* ── Helpers ─────────────────────────────── */
  const handleSelect = (project) => {
    // Persist lightweight context so Studio can bootstrap without an extra fetch
    localStorage.setItem("projectId", project._id);
    localStorage.setItem("projectName", project.name);
    localStorage.setItem("chartType", project.chartType);
    localStorage.setItem("forecastDate", project.forecastDate);

    onSelect?.(project);
    onClose();

    window.location.href = `/studio/${project._id}`;
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeletingId(projectToDelete._id);
      await onDelete(projectToDelete._id);
      setAllProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      setProjectToDelete(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const base = isDarkMode ? 'text-white' : 'text-slate-900';
  const muted = isDarkMode ? 'text-gray-400' : 'text-slate-500';
  const border = isDarkMode ? 'border-white/10' : 'border-black/10';

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push('…');
      acc.push(p);
      return acc;
    }, []);

  if (!visible) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Backdrop */}
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/70' : 'bg-black/50'} backdrop-blur-md`} />

        {/* Modal */}
        <div className={`relative mt-16 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-[#0b1220] border border-white/10' : 'bg-white border border-black/10'
          }`}>

          {/* ── Header ── */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${border}`}>
            <div className="flex items-center gap-3">
              <FolderOpen size={20} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
              <div>
                <div className={`font-semibold ${base}`}>Your Projects</div>
                <div className={`text-xs ${muted}`}>
                  {total > 0 ? `${total} project${total !== 1 ? 's' : ''} found` : 'No projects found'}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/10 text-slate-500 hover:text-slate-900'
                }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* ── Search + Filter Bar ── */}
          <div className={`px-5 py-3 border-b ${border} space-y-3`}>
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'
              }`}>
              <Search size={14} className={muted} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or description…"
                className={`flex-1 bg-transparent text-sm outline-none placeholder:${muted} ${base}`}
              />
              {search && (
                <button onClick={() => setSearch('')} className={muted}>
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter size={12} className={muted} />
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${statusFilter === s
                      ? isDarkMode
                        ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                        : 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                      : isDarkMode
                        ? 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                        : 'bg-black/5 text-slate-500 hover:bg-black/10 border border-black/10'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Project List ── */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 animate-pulse ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                    }`}
                >
                  <div className="flex gap-3 items-start">
                    <div className={`w-10 h-10 rounded-lg ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                    <div className="flex-1 space-y-2">
                      <div className={`h-3 w-1/2 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                      <div className={`h-2 w-3/4 rounded ${isDarkMode ? 'bg-white/10' : 'bg-black/10'}`} />
                    </div>
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4 opacity-40">🔍</div>
                <h3 className={`text-base font-semibold mb-2 ${base}`}>No Projects Found</h3>
                <p className={`text-sm ${muted}`}>
                  {search || statusFilter !== 'All'
                    ? 'Try adjusting your search or filter.'
                    : 'Create your first project to get started.'}
                </p>
              </div>
            ) : (
              projects.map((project) => (
                <div
                  key={project._id}
                  className={`rounded-xl border transition ${isDarkMode ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-black/5 hover:bg-black/10 border-black/10'
                    }`}
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-cyan-500/20' : 'bg-blue-500/20'
                      }`}>
                      <FolderOpen size={18} className={isDarkMode ? 'text-cyan-400' : 'text-blue-600'} />
                    </div>

                    <button onClick={() => handleSelect(project)} className="flex-1 text-left min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className={`font-semibold truncate ${base}`}>{project.name}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${STATUS_STYLES[project.status] || (isDarkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-200 text-gray-700')
                          }`}>
                          {project.status || 'Draft'}
                        </span>
                      </div>

                      {project.description && (
                        <p className={`text-xs mb-2 line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-slate-600'}`}>
                          {project.description}
                        </p>
                      )}

                      <div className={`flex items-center gap-3 text-[10px] ${muted}`}>
                        {project.createdAt && (
                          <div className="flex items-center gap-1">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                          </div>
                        )}
                        {project.chartType && (
                          <div className="flex items-center gap-1">
                            <BarChart3 size={10} />
                            {project.chartType}
                          </div>
                        )}
                      </div>
                    </button>

                    <button
                      disabled={deletingId === project._id}
                      onClick={(e) => { e.stopPropagation(); setProjectToDelete(project); }}
                      className={`p-1.5 rounded-lg transition flex-shrink-0 ${isDarkMode ? 'hover:bg-red-500/20 text-red-400' : 'hover:bg-red-500/20 text-red-600'
                        } disabled:opacity-40`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-5 py-3 border-t ${border}`}>
              <span className={`text-xs ${muted}`}>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/10 text-slate-500'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <ChevronLeft size={16} />
                </button>

                {pageNumbers.map((item, idx) =>
                  item === '…' ? (
                    <span key={`ellipsis-${idx}`} className={`text-xs px-1 ${muted}`}>…</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      className={`w-7 h-7 rounded-lg text-xs font-semibold transition ${page === item
                          ? isDarkMode
                            ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                            : 'bg-blue-500/20 text-blue-700 border border-blue-400/30'
                          : isDarkMode
                            ? 'hover:bg-white/10 text-gray-400'
                            : 'hover:bg-black/10 text-slate-500'
                        }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded-lg transition ${isDarkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/10 text-slate-500'
                    } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmationDialog
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Project?"
        message="Are you sure you want to permanently delete"
        layerName={projectToDelete?.name}
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default ProjectListModal;