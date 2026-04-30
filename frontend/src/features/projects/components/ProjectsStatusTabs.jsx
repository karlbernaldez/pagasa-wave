const STATUSES = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'review', label: 'In Review' },
  { key: 'approved', label: 'Approved' },
];

const ProjectsStatusTabs = ({ active, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => {
        const isActive = active === status.key;

        return (
          <button
            key={status.key}
            type="button"
            onClick={() => onChange?.(status.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-blue-600 text-white shadow'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status.label}
          </button>
        );
      })}
    </div>
  );
};

export default ProjectsStatusTabs;
