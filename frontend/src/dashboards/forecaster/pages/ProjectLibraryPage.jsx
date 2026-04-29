import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import ProjectStats from "@dashboards/forecaster/components/project-library/ProjectStats";
import ProjectToolbar from "@dashboards/forecaster/components/project-library/ProjectToolbar";
import ProjectTable from "@dashboards/forecaster/components/project-library/ProjectTable";
import ProjectPagination from "@dashboards/forecaster/components/project-library/ProjectPagination";

import ProjectCard from "@/features/projects/components/ProjectCard";
import Button from "@/components/ui/Button";

import { useProjectLibraryController } from "@dashboards/forecaster/hooks/useProjectLibraryController";

export default function ProjectLibraryPage() {
  const controller = useProjectLibraryController();
  const [view, setView] = useState("grid"); // 'grid' | 'list'

  const { projects, loading, error, onRetry, onOpen, onRename, onDelete } = controller.table;

  return (
    <div className="min-h-full bg-slate-50">
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {controller.header.title}
            </h1>
            <p className="text-sm text-slate-500">
              {controller.header.description}
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <Button
              variant={view === "grid" ? "primary" : "secondary"}
              size="sm"
              icon={LayoutGrid}
              onClick={() => setView("grid")}
            />
            <Button
              variant={view === "list" ? "primary" : "secondary"}
              size="sm"
              icon={List}
              onClick={() => setView("list")}
            />
          </div>
        </div>

        <ProjectStats {...controller.stats} />

        <ProjectToolbar {...controller.toolbar} />

        {/* GRID VIEW */}
        {view === "grid" && (
          <div>
            {loading && (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                Loading projects...
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600 flex items-center justify-between">
                Failed to load projects
                <Button variant="ghost" size="sm" onClick={onRetry}>
                  Retry
                </Button>
              </div>
            )}

            {!loading && !error && projects?.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No projects found
              </div>
            )}

            {!loading && !error && projects?.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard
                    key={p._id}
                    project={p}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* LIST VIEW (existing table preserved) */}
        {view === "list" && (
          <ProjectTable {...controller.table} />
        )}

        <ProjectPagination {...controller.pagination} />
      </div>

      {controller.dialogs}
    </div>
  );
}
