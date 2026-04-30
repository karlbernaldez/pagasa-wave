const ProjectsHeader = ({
  actions,
  count,
  countLabel = 'project',
  description,
  title,
}) => {
  const hasCount = typeof count === 'number';

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-black tracking-tight text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
        {hasCount && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {count} {countLabel}{count === 1 ? '' : 's'}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default ProjectsHeader;
