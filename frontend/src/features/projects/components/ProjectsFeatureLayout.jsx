const ProjectsFeatureLayout = ({ children, className = '' }) => {
  return (
    <div className={`min-h-full bg-slate-50 ${className}`}>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {children}
      </div>
    </div>
  );
};

export default ProjectsFeatureLayout;
